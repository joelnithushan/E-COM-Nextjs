import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Inventory Service
 * Handles atomic stock operations to prevent race conditions
 * 
 * Strategy:
 * 1. Use MongoDB atomic operators ($inc) for stock updates
 * 2. Use findOneAndUpdate with conditions to ensure stock availability
 * 3. Use transactions for multi-document operations
 * 4. Implement optimistic locking for concurrent operations
 */
class InventoryService {
  /**
   * Reserve stock atomically (for cart items)
   * This doesn't decrement stock, but validates availability
   * 
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to reserve
   * @param {Array} selectedVariants - Selected variant options
   * @returns {Promise<Object>} Stock availability info
   */
  async checkAndReserveStock(productId, quantity, selectedVariants = []) {
    try {
      const product = await Product.findById(productId)
        .select('stock variants trackInventory allowBackorder status')
        .lean();

      if (!product) {
        const error = new Error('Product not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      if (product.status !== 'active') {
        const error = new Error('Product is not available');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Check stock for variants
      if (product.variants && product.variants.length > 0) {
        // Product has variants
        if (selectedVariants.length === 0) {
          // No variants selected - use base product stock
          // This allows products with optional variants or when variants aren't required
          const available = product.trackInventory
            ? (product.stock || 0) >= quantity
            : true;

          return {
            available,
            availableStock: product.stock || 0,
            canBackorder: product.allowBackorder && (product.stock || 0) === 0,
            variantPath: null,
          };
        }

        // Product has variants and user selected variants - check variant stock
        // Find matching variant option
        for (const variant of product.variants) {
          const selectedOption = selectedVariants.find(
            (sv) => (sv.variantName || sv.name) === variant.name
          );

          if (selectedOption) {
            const option = variant.options.find(
              (opt) => opt.value === (selectedOption.optionValue || selectedOption.value)
            );

            if (!option) {
              return {
                available: false,
                availableStock: 0,
                reason: 'Invalid variant option selected',
              };
            }

            const available = product.trackInventory
              ? (option.stock || 0) >= quantity
              : true;

            return {
              available,
              availableStock: option.stock || 0,
              canBackorder: product.allowBackorder && (option.stock || 0) === 0,
              variantPath: `variants.${product.variants.indexOf(variant)}.options.${variant.options.indexOf(option)}.stock`,
            };
          }
        }

        // If we have selected variants but didn't find a match, check if all required variants are selected
        const requiredVariants = product.variants.map((v) => v.name);
        const selectedVariantNames = selectedVariants.map((sv) => sv.variantName || sv.name);
        const missingVariants = requiredVariants.filter((rv) => !selectedVariantNames.includes(rv));
        
        if (missingVariants.length > 0) {
          return {
            available: false,
            availableStock: 0,
            reason: `Required variants not selected: ${missingVariants.join(', ')}`,
          };
        }

        return {
          available: false,
          availableStock: 0,
          reason: 'Required variant not selected',
        };
      }

      // Product without variants
      const available = product.trackInventory
        ? product.stock >= quantity
        : true;

      return {
        available,
        availableStock: product.stock,
        canBackorder: product.allowBackorder && product.stock === 0,
        variantPath: null, // Simple product, no variants
      };
    } catch (error) {
      logger.error('Error checking stock:', error);
      throw error;
    }
  }

  /**
   * Decrement stock (public method)
   * Creates its own transaction if session not provided
   */
  async decrementStock(productId, quantity, selectedVariants = [], session = null) {
    return await this.decrementStockInternal(productId, quantity, selectedVariants, session);
  }

  /**
   * Restore stock atomically (for order cancellation/refund)
   * 
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to restore
   * @param {Array} selectedVariants - Selected variant options
   * @returns {Promise<Object>} Updated product stock info
   */
  async restoreStock(productId, quantity, selectedVariants = []) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findById(productId)
        .select('stock variants trackInventory')
        .session(session)
        .lean();

      if (!product) {
        await session.abortTransaction();
        const error = new Error('Product not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      if (!product.trackInventory) {
        await session.commitTransaction();
        return {
          success: true,
          restored: false,
        };
      }

      // Handle variants
      if (product.variants && product.variants.length > 0 && selectedVariants.length > 0) {
        let variantIndex = -1;
        let optionIndex = -1;

        for (let i = 0; i < product.variants.length; i++) {
          const variant = product.variants[i];
          const selectedOption = selectedVariants.find(
            (sv) => sv.variantName === variant.name
          );

          if (selectedOption) {
            variantIndex = i;
            optionIndex = variant.options.findIndex(
              (opt) => opt.value === selectedOption.optionValue
            );
            break;
          }
        }

        if (variantIndex !== -1 && optionIndex !== -1) {
          await Product.findByIdAndUpdate(
            productId,
            {
              $inc: { [`variants.${variantIndex}.options.${optionIndex}.stock`]: quantity },
            },
            { session }
          );

          await session.commitTransaction();
          return {
            success: true,
            restored: true,
          };
        }
      } else {
        // Simple product
        await Product.findByIdAndUpdate(
          productId,
          {
            $inc: { stock: quantity },
          },
          { session }
        );

        await session.commitTransaction();
        return {
          success: true,
          restored: true,
        };
      }

      await session.commitTransaction();
      return {
        success: true,
        restored: false,
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error restoring stock:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Batch decrement stock for multiple items (for order creation)
   * Uses transaction to ensure all-or-nothing stock decrement
   * 
   * @param {Array} items - Array of {productId, quantity, selectedVariants}
   * @returns {Promise<Object>} Results of stock decrement operations
   */
  async batchDecrementStock(items) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const results = [];
      const errors = [];

      for (const item of items) {
        try {
          const result = await this.decrementStockInternal(
            item.productId,
            item.quantity,
            item.selectedVariants || [],
            session
          );
          results.push({
            productId: item.productId,
            success: true,
            ...result,
          });
        } catch (error) {
          errors.push({
            productId: item.productId,
            error: error.message,
            availableStock: error.availableStock,
          });
        }
      }

      if (errors.length > 0) {
        await session.abortTransaction();
        return {
          success: false,
          errors,
          results: [],
        };
      }

      await session.commitTransaction();

      return {
        success: true,
        results,
        errors: [],
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error in batch decrement stock:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Decrement stock (public method)
   * Creates its own transaction if session not provided
   */
  async decrementStock(productId, quantity, selectedVariants = [], session = null) {
    return await this.decrementStockInternal(productId, quantity, selectedVariants, session);
  }

  /**
   * Decrement stock with session (internal method)
   * @private
   */
  async decrementStockInternal(productId, quantity, selectedVariants = [], session = null) {
    // If session provided, use it; otherwise create new transaction
    const useExternalSession = !!session;
    if (!session) {
      session = await mongoose.startSession();
      await session.startTransaction();
    }

    try {
      const product = await Product.findById(productId)
        .select('stock variants trackInventory allowBackorder status')
        .session(session)
        .lean();

      if (!product) {
        if (!useExternalSession) await session.abortTransaction();
        const error = new Error('Product not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      if (product.status !== 'active') {
        if (!useExternalSession) await session.abortTransaction();
        const error = new Error('Product is not available');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      if (!product.trackInventory) {
        if (!useExternalSession) await session.commitTransaction();
        return {
          success: true,
          availableStock: null,
          decremented: false,
        };
      }

      let updateResult;

      if (product.variants && product.variants.length > 0) {
        if (selectedVariants.length === 0) {
          if (!useExternalSession) await session.abortTransaction();
          const error = new Error('Product variants must be selected');
          error.statusCode = HTTP_STATUS.BAD_REQUEST;
          throw error;
        }

        let variantIndex = -1;
        let optionIndex = -1;

        for (let i = 0; i < product.variants.length; i++) {
          const variant = product.variants[i];
          const selectedOption = selectedVariants.find(
            (sv) => sv.variantName === variant.name
          );

          if (selectedOption) {
            variantIndex = i;
            optionIndex = variant.options.findIndex(
              (opt) => opt.value === selectedOption.optionValue
            );
            break;
          }
        }

        if (variantIndex === -1 || optionIndex === -1) {
          if (!useExternalSession) await session.abortTransaction();
          const error = new Error('Invalid variant option selected');
          error.statusCode = HTTP_STATUS.BAD_REQUEST;
          throw error;
        }

        updateResult = await Product.findOneAndUpdate(
          {
            _id: productId,
            status: 'active',
            [`variants.${variantIndex}.options.${optionIndex}.stock`]: { $gte: quantity },
          },
          {
            $inc: { [`variants.${variantIndex}.options.${optionIndex}.stock`]: -quantity },
          },
          {
            new: true,
            session,
            runValidators: false,
          }
        ).select('stock variants').lean();

        if (!updateResult) {
          if (!useExternalSession) await session.abortTransaction();
          const error = new Error('Insufficient stock for variant');
          error.statusCode = HTTP_STATUS.BAD_REQUEST;
          error.availableStock = product.variants[variantIndex].options[optionIndex].stock;
          throw error;
        }

        const updatedOption = updateResult.variants[variantIndex].options[optionIndex];
        if (!useExternalSession) await session.commitTransaction();

        return {
          success: true,
          availableStock: updatedOption.stock,
          decremented: true,
        };
      } else {
        updateResult = await Product.findOneAndUpdate(
          {
            _id: productId,
            status: 'active',
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            session,
            runValidators: false,
          }
        ).select('stock').lean();

        if (!updateResult) {
          if (!useExternalSession) await session.abortTransaction();
          const error = new Error('Insufficient stock');
          error.statusCode = HTTP_STATUS.BAD_REQUEST;
          error.availableStock = product.stock;
          throw error;
        }

        if (!useExternalSession) await session.commitTransaction();

        return {
          success: true,
          availableStock: updateResult.stock,
          decremented: true,
        };
      }
    } catch (error) {
      if (!useExternalSession) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (!useExternalSession) {
        await session.endSession();
      }
    }
  }
}

export default new InventoryService();

