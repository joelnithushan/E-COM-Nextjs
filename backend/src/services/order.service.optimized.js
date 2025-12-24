import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import cartService from './cart.service.js';
import { offsetPagination, getCount } from '../utils/pagination.util.js';

/**
 * Order Service (Optimized)
 * Performance optimizations:
 * - Field selection to prevent over-fetching
 * - Index-aware queries
 * - Optimized pagination
 * - Batch operations where possible
 */
class OrderService {
  // Field selections for different use cases
  static LIST_FIELDS = 'orderNumber user items status payment.status total createdAt';
  static DETAIL_FIELDS = 'orderNumber user items shippingAddress billingAddress shipping payment status subtotal tax shippingCost total notes adminNotes cancelledAt cancelledReason paidAt processingAt shippedAt deliveredAt createdAt updatedAt';

  /**
   * Get user's orders (OPTIMIZED)
   * 
   * Optimizations:
   * - Uses user + createdAt compound index
   * - Field selection
   * - Lean queries
   * - Minimal population
   */
  async getUserOrders(userId, query = {}) {
    const { page = 1, limit = 10, status } = query;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const { skip, limit: limitNum } = offsetPagination(page, limit);

    // Use compound index: user + status + createdAt
    const sort = status
      ? { status: 1, createdAt: -1 }
      : { createdAt: -1 };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(OrderService.LIST_FIELDS)
        .populate('items.product', 'name slug images') // Minimal product data
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      getCount(Order, filter, total > 10000), // Use estimated count for large collections
    ]);

    return {
      orders,
      pagination: {
        page,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: skip + orders.length < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get all orders - Admin (OPTIMIZED)
   * 
   * Optimizations:
   * - Uses status + createdAt compound index
   * - Field selection
   * - Lean queries
   * - Batch population
   */
  async getAllOrders(query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      userId,
      search,
      startDate,
      endDate,
    } = query;

    const filter = {};

    // Use compound indexes where possible
    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }

    if (userId) {
      filter.user = userId;
    }

    // Text search (uses text index on orderNumber)
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        // Note: User email search requires population, consider denormalizing
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const { skip, limit: limitNum } = offsetPagination(page, limit);

    // Optimize sort based on filters
    const sort = status
      ? { status: 1, createdAt: -1 } // Uses status + createdAt index
      : { createdAt: -1 }; // Uses createdAt index

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(OrderService.LIST_FIELDS)
        .populate('user', 'name email') // Minimal user data
        .populate('items.product', 'name slug') // Minimal product data
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      getCount(Order, filter, total > 10000),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: skip + orders.length < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get order by ID (OPTIMIZED)
   * 
   * Optimizations:
   * - Field selection
   * - Minimal population
   * - Lean query
   */
  async getOrderById(orderId, userId, isAdmin = false) {
    const order = await Order.findById(orderId)
      .select(OrderService.DETAIL_FIELDS)
      .populate('user', 'name email phone') // Only needed user fields
      .populate('items.product', 'name slug images') // Only needed product fields
      .lean();

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Authorization check
    if (!isAdmin && order.user._id.toString() !== userId.toString()) {
      const error = new Error('Unauthorized to view this order');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return order;
  }

  /**
   * Create order from cart (OPTIMIZED)
   * 
   * Optimizations:
   * - Batch product lookups
   * - Field selection for product queries
   * - Single cart validation
   */
  async createOrderFromCart(userId, orderData) {
    const { shippingAddress, billingAddress, shippingMethod, shippingCost, tax, notes } = orderData;

    // Get cart summary (validated)
    const cartSummary = await cartService.getCartSummary(userId);

    if (!cartSummary.items || cartSummary.items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Batch product lookups (more efficient than individual queries)
    const productIds = cartSummary.items.map((item) => item.product._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name sku price images status stock variants trackInventory allowBackorder')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate all items are still available
    const validationErrors = [];
    for (const item of cartSummary.items) {
      const product = productMap.get(item.product._id.toString());
      if (!product || product.status !== 'active') {
        validationErrors.push({
          productId: item.product._id,
          productName: item.product.name,
          reason: 'Product is no longer available',
        });
        continue;
      }

      // Stock check (simplified, using product from map)
      let stockCheck = { available: true, availableStock: 0 };

      if (product.variants && product.variants.length > 0) {
        if (item.selectedVariants && item.selectedVariants.length > 0) {
          for (const variant of product.variants) {
            const selectedOption = item.selectedVariants.find(
              (sv) => sv.variantName === variant.name
            );
            if (selectedOption) {
              const option = variant.options.find(
                (opt) => opt.value === selectedOption.optionValue
              );
              if (option) {
                stockCheck.available = product.trackInventory
                  ? option.stock >= item.quantity
                  : true;
                stockCheck.availableStock = option.stock;
                stockCheck.canBackorder = product.allowBackorder && option.stock === 0;
                break;
              }
            }
          }
        } else {
          stockCheck.available = false;
          stockCheck.reason = 'Product variants must be selected';
        }
      } else {
        stockCheck.available = product.trackInventory
          ? product.stock >= item.quantity
          : true;
        stockCheck.availableStock = product.stock;
        stockCheck.canBackorder = product.allowBackorder && product.stock === 0;
      }

      if (!stockCheck.available && !stockCheck.canBackorder) {
        validationErrors.push({
          productId: item.product._id,
          productName: item.product.name,
          reason: `Insufficient stock. Available: ${stockCheck.availableStock}`,
          availableStock: stockCheck.availableStock,
        });
      }
    }

    if (validationErrors.length > 0) {
      const error = new Error('Some items in your cart are no longer available');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.validationErrors = validationErrors;
      throw error;
    }

    // Prepare order items (using products from map, no additional queries)
    const orderItems = cartSummary.items.map((item) => {
      const product = productMap.get(item.product._id.toString());
      const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

      return {
        product: product._id,
        name: product.name,
        sku: product.sku || null,
        price: item.price,
        quantity: item.quantity,
        image: primaryImage?.url || null,
        selectedVariants: item.selectedVariants || [],
        subtotal: item.subtotal,
      };
    });

    // Calculate totals
    const subtotal = cartSummary.subtotal;
    const finalShippingCost = shippingCost || 0;
    const finalTax = tax || 0;
    const total = subtotal + finalShippingCost + finalTax;

    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      shipping: {
        method: shippingMethod || 'standard',
        cost: finalShippingCost,
      },
      payment: {
        method: 'stripe',
        status: PAYMENT_STATUS.PENDING,
        amount: total,
        currency: 'usd',
      },
      status: ORDER_STATUS.PENDING,
      subtotal,
      tax: finalTax,
      shippingCost: finalShippingCost,
      total,
      notes: notes || null,
    });

    // Clear cart after successful order creation
    await cartService.clearCart(userId);

    return await this.getOrderById(order._id, userId);
  }

  /**
   * Update order status (OPTIMIZED)
   * 
   * Optimizations:
   * - Field selection for update
   * - Minimal data fetching
   */
  async updateOrderStatus(orderId, newStatus, adminNotes = null) {
    const order = await Order.findById(orderId).select('status processingAt shippedAt deliveredAt cancelledAt');
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(order.status);
    if (!validTransitions.includes(newStatus)) {
      const error = new Error(
        `Invalid status transition from ${order.status} to ${newStatus}`
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Update status and timestamps
    const statusUpdates = { status: newStatus };

    switch (newStatus) {
      case ORDER_STATUS.PROCESSING:
        if (!order.processingAt) statusUpdates.processingAt = new Date();
        break;
      case ORDER_STATUS.SHIPPED:
        if (!order.shippedAt) statusUpdates.shippedAt = new Date();
        break;
      case ORDER_STATUS.DELIVERED:
        if (!order.deliveredAt) statusUpdates.deliveredAt = new Date();
        break;
      case ORDER_STATUS.CANCELLED:
        if (!order.cancelledAt) statusUpdates.cancelledAt = new Date();
        break;
    }

    if (adminNotes) {
      statusUpdates.adminNotes = adminNotes;
    }

    await Order.findByIdAndUpdate(orderId, statusUpdates);

    return await this.getOrderById(orderId, null, true);
  }

  /**
   * Get valid status transitions
   */
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.CANCELLED]: [],
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Cancel order (OPTIMIZED)
   */
  async cancelOrder(orderId, userId, reason = null, isAdmin = false) {
    const order = await Order.findById(orderId).select('user status');
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Authorization check
    if (!isAdmin && order.user.toString() !== userId.toString()) {
      const error = new Error('Unauthorized to cancel this order');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    // Check if order can be cancelled
    if (order.status === ORDER_STATUS.DELIVERED) {
      const error = new Error('Cannot cancel a delivered order');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      const error = new Error('Order is already cancelled');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Update order
    await Order.findByIdAndUpdate(orderId, {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelledReason: reason || null,
    });

    return await this.getOrderById(orderId, userId, isAdmin);
  }

  /**
   * Update shipping information (OPTIMIZED)
   */
  async updateShippingInfo(orderId, shippingData) {
    const order = await Order.findById(orderId).select('status shipping shippingCost subtotal tax total');
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.DELIVERED) {
      const error = new Error('Cannot update shipping for cancelled or delivered orders');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Build update object
    const updates = {};
    if (shippingData.trackingNumber) {
      updates['shipping.trackingNumber'] = shippingData.trackingNumber;
    }
    if (shippingData.carrier) {
      updates['shipping.carrier'] = shippingData.carrier;
    }
    if (shippingData.method) {
      updates['shipping.method'] = shippingData.method;
    }
    if (shippingData.cost !== undefined) {
      updates['shipping.cost'] = shippingData.cost;
      updates.shippingCost = shippingData.cost;
      updates.total = order.subtotal + order.tax + shippingData.cost;
    }

    await Order.findByIdAndUpdate(orderId, updates);

    return await this.getOrderById(orderId, null, true);
  }

  /**
   * Update order payment status (OPTIMIZED)
   */
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    const order = await Order.findById(orderId).select('status payment');
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const updates = {
      'payment.status': paymentStatus,
    };

    if (transactionId) {
      updates['payment.transactionId'] = transactionId;
    }

    // If payment is successful, move order to processing
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      if (order.status === ORDER_STATUS.PENDING) {
        updates.status = ORDER_STATUS.PROCESSING;
        updates['payment.paidAt'] = new Date();
        updates.paidAt = new Date();
        updates.processingAt = new Date();
      }
    }

    await Order.findByIdAndUpdate(orderId, updates);
    
    // Return updated order (minimal fields)
    return await Order.findById(orderId).select(OrderService.LIST_FIELDS).lean();
  }
}

export default new OrderService();

