import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Cart Service (Optimized)
 * Performance optimizations:
 * - Batch product lookups
 * - Field selection
 * - Lean queries
 * - Reduced database round trips
 */
class CartService {
  // Minimal product fields for cart operations
  static CART_PRODUCT_FIELDS = 'name slug price images status stock variants trackInventory allowBackorder';

  /**
   * Get or create user's cart (OPTIMIZED)
   * 
   * Optimizations:
   * - Field selection for populated products
   * - Lean query
   * - Single query with population
   */
  async getOrCreateCart(userId) {
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: CartService.CART_PRODUCT_FIELDS, // Only fetch needed fields
      })
      .lean();

    if (!cart) {
      cart = await Cart.create({ user: userId });
      return cart.toObject();
    }

    // Validate and clean cart items
    const validatedCart = await this.validateCartItems(cart);
    return validatedCart;
  }

  /**
   * Validate cart items (OPTIMIZED)
   * 
   * Optimizations:
   * - Batch product lookups
   * - Field selection
   * - Single save operation
   */
  async validateCartItems(cart) {
    if (!cart.items || cart.items.length === 0) {
      return cart;
    }

    // Batch product lookup (single query instead of N queries)
    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .select(CartService.CART_PRODUCT_FIELDS)
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

      // Check stock availability
      const stockCheck = this.checkStockAvailabilitySync(
        product,
        item.quantity,
        item.selectedVariants
      );

      if (!stockCheck.available) {
        if (stockCheck.availableStock > 0) {
          item.quantity = stockCheck.availableStock;
          validItems.push(item);
        } else {
          removedItems.push({ item, reason: 'Out of stock' });
        }
        continue;
      }

      // Update price snapshot
      const currentPrice = this.calculateItemPrice(product, item.selectedVariants);
      item.price = currentPrice;
      validItems.push(item);
    }

    // Update cart if items were removed (single save operation)
    if (removedItems.length > 0) {
      await Cart.findByIdAndUpdate(cart._id, { items: validItems });
      cart.items = validItems;
    }

    // Return cart with validation info
    const cartObj = { ...cart };
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
    if (product.variants && product.variants.length > 0) {
      if (selectedVariants.length === 0) {
        return {
          available: false,
          availableStock: 0,
          reason: 'Product variants must be selected',
        };
      }

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

    const available = product.trackInventory ? product.stock >= quantity : true;

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
   * Add item to cart (OPTIMIZED)
   * 
   * Optimizations:
   * - Single product query with field selection
   * - Single cart update
   */
  async addItem(userId, productId, quantity, selectedVariants = []) {
    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId });
    }

    // Get product with minimal fields
    const product = await Product.findById(productId)
      .select(CartService.CART_PRODUCT_FIELDS)
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

    // Check stock availability
    const stockCheck = this.checkStockAvailabilitySync(product, quantity, selectedVariants);

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
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId.toString() &&
        JSON.stringify(item.selectedVariants.sort()) ===
          JSON.stringify(selectedVariants.sort())
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Re-check stock with new quantity
      const newStockCheck = this.checkStockAvailabilitySync(
        product,
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
      cart.items[existingItemIndex].price = price;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        selectedVariants,
        price,
      });
    }

    cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await cart.save();

    return await this.getOrCreateCart(userId);
  }

  /**
   * Update item quantity (OPTIMIZED)
   */
  async updateItemQuantity(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const error = new Error('Cart not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const item = cart.items.find((i) => i._id.toString() === itemId.toString());
    if (!item) {
      const error = new Error('Item not found in cart');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (quantity <= 0) {
      return await this.removeItem(userId, itemId);
    }

    // Get product with minimal fields
    const product = await Product.findById(item.product)
      .select(CartService.CART_PRODUCT_FIELDS)
      .lean();

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Check stock availability
    const stockCheck = this.checkStockAvailabilitySync(
      product,
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

    item.quantity = quantity;
    item.price = this.calculateItemPrice(product, item.selectedVariants);

    cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await cart.save();

    return await this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart (OPTIMIZED)
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
   * Clear cart (OPTIMIZED)
   */
  async clearCart(userId) {
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    );

    return await this.getOrCreateCart(userId);
  }

  /**
   * Get cart summary (OPTIMIZED)
   * 
   * Optimizations:
   * - Batch product lookups
   * - Field selection
   * - Single validation pass
   */
  async getCartSummary(userId) {
    const cart = await this.getOrCreateCart(userId);

    if (!cart.items || cart.items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        itemCount: 0,
        validationWarnings: [],
      };
    }

    // Batch product lookup
    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug images stock variants status')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate and calculate
    const itemsWithDetails = [];
    const validationWarnings = [];

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product || product.status !== 'active') {
        validationWarnings.push({
          productId: item.product,
          reason: product ? 'Product is no longer available' : 'Product not found',
        });
        continue;
      }

      // Stock check
      const stockCheck = this.checkStockAvailabilitySync(
        product,
        item.quantity,
        item.selectedVariants
      );

      if (!stockCheck.available && stockCheck.availableStock === 0) {
        validationWarnings.push({
          productId: item.product,
          reason: 'Out of stock',
        });
        continue;
      }

      const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

      itemsWithDetails.push({
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: primaryImage,
        },
        quantity: stockCheck.available ? item.quantity : stockCheck.availableStock,
        selectedVariants: item.selectedVariants,
        price: item.price,
        subtotal: item.price * (stockCheck.available ? item.quantity : stockCheck.availableStock),
      });
    }

    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: itemsWithDetails,
      subtotal,
      itemCount,
      validationWarnings,
    };
  }
}

export default new CartService();



