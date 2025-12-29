import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import inventoryService from './inventory.service.js';

/**
 * Cart Service
 * Handles all cart-related business logic with stock validation
 */
class CartService {
  /**
   * Get or create user's cart
   */
  async getOrCreateCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name slug price images status stock variants',
    });

    if (!cart) {
      cart = await Cart.create({ user: userId });
    }

    // Validate and clean cart items
    const validatedCart = await this.validateCartItems(cart);
    return validatedCart;
  }

  /**
   * Validate cart items (check stock, product status, etc.)
   */
  async validateCartItems(cart) {
    if (!cart.items || cart.items.length === 0) {
      return cart;
    }

    // Batch product lookup (single query instead of N queries)
    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug price images status stock variants trackInventory allowBackorder')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const validItems = [];
    const removedItems = [];

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product) {
        removedItems.push({ item, reason: 'Product not found' });
        continue;
      }

      if (product.status !== 'active') {
        removedItems.push({ item, reason: 'Product is no longer available' });
        continue;
      }

      // Check stock availability using inventory service
      // Note: Using synchronous check for batch validation (read-only, safe)
      const stockCheck = this.checkStockAvailabilitySync(
        product,
        item.quantity,
        item.selectedVariants
      );

      if (!stockCheck.available) {
        // Adjust quantity to available stock or remove if out of stock
        if (stockCheck.availableStock > 0) {
          item.quantity = stockCheck.availableStock;
          validItems.push(item);
        } else {
          removedItems.push({ item, reason: 'Out of stock' });
        }
        continue;
      }

      // Update price snapshot (in case price changed)
      const currentPrice = this.calculateItemPrice(product, item.selectedVariants);
      item.price = currentPrice;
      validItems.push(item);
    }

    // Update cart with valid items
    if (removedItems.length > 0) {
      cart.items = validItems;
      await cart.save();
    }

    // Return cart with validation info
    const cartObj = cart.toObject();
    if (removedItems.length > 0) {
      cartObj.validationWarnings = removedItems.map(({ item, reason }) => ({
        productId: item.product,
        reason,
      }));
    }

    return cartObj;
  }

  /**
   * Check stock availability (synchronous version for batch operations)
   */
  checkStockAvailabilitySync(product, quantity, selectedVariants = []) {
    // If product has variants
    if (product.variants && product.variants.length > 0) {
      if (selectedVariants.length === 0) {
        return {
          available: false,
          availableStock: 0,
          reason: 'Product variants must be selected',
        };
      }

      // Find matching variant option
      for (const variant of product.variants) {
        const selectedOption = selectedVariants.find(
          (sv) => sv.variantName === variant.name
        );

        if (selectedOption) {
          const option = variant.options.find(
            (opt) => opt.value === selectedOption.optionValue
          );

          if (!option) {
            return {
              available: false,
              availableStock: 0,
              reason: 'Invalid variant option selected',
            };
          }

          const available = product.trackInventory
            ? option.stock >= quantity
            : true;

          return {
            available,
            availableStock: option.stock,
            canBackorder: product.allowBackorder && option.stock === 0,
          };
        }
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
    };
  }

  /**
   * Calculate item price including variant pricing
   */
  calculateItemPrice(product, selectedVariants = []) {
    let price = product.price;

    if (product.variants && product.variants.length > 0 && selectedVariants.length > 0) {
      for (const variant of product.variants) {
        const selectedOption = selectedVariants.find(
          (sv) => sv.variantName === variant.name
        );

        if (selectedOption) {
          const option = variant.options.find(
            (opt) => opt.value === selectedOption.optionValue
          );

          if (option && option.price) {
            price += option.price;
          }
        }
      }
    }

    return price;
  }

  /**
   * Add item to cart
   */
  async addItem(userId, productId, quantity, selectedVariants = []) {
    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId });
    }

    // Get product
    const product = await Product.findById(productId);
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

      // Check stock availability using inventory service (atomic-safe validation)
    const stockCheck = await inventoryService.checkAndReserveStock(
      productId,
      quantity,
      selectedVariants
    );

    if (!stockCheck.available && !stockCheck.canBackorder) {
      const error = new Error(
        `Insufficient stock. Available: ${stockCheck.availableStock}`
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.availableStock = stockCheck.availableStock;
      throw error;
    }

    // Calculate price
    const price = this.calculateItemPrice(product, selectedVariants);

    // Check if item already exists with same variants
    // Normalize selectedVariants for comparison (handle both formats)
    const normalizeVariants = (variants) => {
      if (!variants || variants.length === 0) return [];
      return variants
        .map((v) => ({
          variantName: String(v.variantName || v.name || ''),
          optionValue: String(v.optionValue || v.value || ''),
        }))
        .sort((a, b) => {
          if (a.variantName !== b.variantName) {
            return a.variantName.localeCompare(b.variantName);
          }
          return a.optionValue.localeCompare(b.optionValue);
        });
    };

    const normalizedSelectedVariants = normalizeVariants(selectedVariants);
    
    const existingItemIndex = cart.items.findIndex((item) => {
      if (item.product.toString() !== productId.toString()) {
        return false;
      }
      const normalizedItemVariants = normalizeVariants(item.selectedVariants || []);
      return JSON.stringify(normalizedItemVariants) === JSON.stringify(normalizedSelectedVariants);
    });

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Re-check stock with new quantity (atomic-safe validation)
      const newStockCheck = await inventoryService.checkAndReserveStock(
        productId,
        newQuantity,
        selectedVariants
      );

      if (!newStockCheck.available && !newStockCheck.canBackorder) {
        const error = new Error(
          `Cannot add more items. Available stock: ${newStockCheck.availableStock}`
        );
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.availableStock = newStockCheck.availableStock;
        throw error;
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = price; // Update price
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        selectedVariants,
        price,
      });
    }

    // Update expiration
    cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Save cart and ensure it's persisted
    try {
      await cart.save();
      logger.debug(`Cart saved for user ${userId}, items count: ${cart.items.length}`);
    } catch (saveError) {
      logger.error('Error saving cart:', saveError);
      throw new Error('Failed to save cart');
    }

    // Return updated cart with populated product data
    return await this.getOrCreateCart(userId);
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const error = new Error('Cart not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const item = cart.items.find(
      (i) => i._id.toString() === itemId.toString()
    );
    if (!item) {
      const error = new Error('Item not found in cart');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (quantity <= 0) {
      return await this.removeItem(userId, itemId);
    }

    // Get product and check stock
    const product = await Product.findById(item.product);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Check stock availability using inventory service (atomic-safe validation)
    const stockCheck = await inventoryService.checkAndReserveStock(
      item.product,
      quantity,
      item.selectedVariants
    );

    if (!stockCheck.available && !stockCheck.canBackorder) {
      const error = new Error(
        `Insufficient stock. Available: ${stockCheck.availableStock}`
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.availableStock = stockCheck.availableStock;
      throw error;
    }

    // Update quantity
    item.quantity = quantity;
    item.price = this.calculateItemPrice(product, item.selectedVariants);

    cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await cart.save();

    return await this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const error = new Error('Cart not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId.toString()
    );

    if (cart.items.length === initialLength) {
      const error = new Error('Item not found in cart');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    await cart.save();
    return await this.getOrCreateCart(userId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const error = new Error('Cart not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    cart.items = [];
    await cart.save();

    return await this.getOrCreateCart(userId);
  }

  /**
   * Get cart summary (for checkout)
   * Validates all items and returns ready-to-checkout data
   * @param {String} userId - User ID
   * @param {String} couponCode - Optional coupon code to apply
   * @returns {Promise<Object>} Cart summary with totals
   */
  async getCartSummary(userId, couponCode = null) {
    const cart = await this.getOrCreateCart(userId);

    // Validate all items
    const validatedCart = await this.validateCartItems(
      await Cart.findById(cart._id)
    );

    // Calculate totals
    const subtotal = validatedCart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Apply coupon if provided
    let discountAmount = 0;
    let couponData = null;

    if (couponCode) {
      try {
        const couponService = (await import('./coupon.service.js')).default;
        const couponResult = await couponService.validateAndApplyCoupon(
          couponCode,
          subtotal,
          userId,
          validatedCart.items
        );
        
        discountAmount = couponResult.discountAmount;
        couponData = {
          code: couponResult.coupon.code,
          discountAmount: couponResult.discountAmount,
          discountType: couponResult.discountType,
          finalAmount: couponResult.finalAmount,
        };
      } catch (error) {
        // Coupon validation failed, continue without discount
        // Error will be handled in order creation
      }
    }

    // Batch product lookup (more efficient than individual queries)
    const productIds = validatedCart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug images stock variants status')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Get product details for each item (using batch-loaded products)
    const itemsWithDetails = validatedCart.items.map((item) => {
      const product = productMap.get(item.product.toString());
      const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: primaryImage,
        },
        quantity: item.quantity,
        selectedVariants: item.selectedVariants,
        price: item.price,
        subtotal: item.price * item.quantity,
      };
    });

    return {
      items: itemsWithDetails,
      subtotal,
      discount: couponData,
      discountAmount,
      total: subtotal - discountAmount,
      itemCount: validatedCart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      validationWarnings: validatedCart.validationWarnings || [],
    };
  }
}

export default new CartService();


