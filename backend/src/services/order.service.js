import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import cartService from './cart.service.js';

/**
 * Order Service
 * Handles all order-related business logic
 */
class OrderService {
  /**
   * Create order from cart
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

    // Validate all items are still available
    const validationErrors = [];
    for (const item of cartSummary.items) {
      const product = await Product.findById(item.product._id);
      if (!product || product.status !== 'active') {
        validationErrors.push({
          productId: item.product._id,
          productName: item.product.name,
          reason: 'Product is no longer available',
        });
        continue;
      }

      // Check stock one more time (using cart service's method)
      // We need to check stock manually here since checkStockAvailability is private
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

    // Prepare order items with product snapshots
    const orderItems = await Promise.all(
      cartSummary.items.map(async (item) => {
        const product = await Product.findById(item.product._id);
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
      })
    );

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
      billingAddress: billingAddress || shippingAddress, // Use shipping if billing not provided
      shipping: {
        method: shippingMethod || 'standard',
        cost: finalShippingCost,
      },
      payment: {
        method: 'stripe', // Default, can be updated
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
   * Get order by ID (with authorization check)
   */
  async getOrderById(orderId, userId, isAdmin = false) {
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('items.product', 'name slug images');

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Authorization check: user can only view their own orders unless admin
    if (!isAdmin && order.user._id.toString() !== userId.toString()) {
      const error = new Error('Unauthorized to view this order');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return order;
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId, query = {}) {
    const { page = 1, limit = 10, status } = query;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name slug images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + orders.length < total,
        hasPrev: Number(page) > 1,
      },
    };
  }

  /**
   * Get all orders (Admin only)
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

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }

    if (userId) {
      filter.user = userId;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .populate('items.product', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + orders.length < total,
        hasPrev: Number(page) > 1,
      },
    };
  }

  /**
   * Update order status (Admin only)
   */
  async updateOrderStatus(orderId, newStatus, adminNotes = null) {
    const order = await Order.findById(orderId);
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

    // Update status and set appropriate timestamps
    const statusUpdates = {
      status: newStatus,
    };

    switch (newStatus) {
      case ORDER_STATUS.PROCESSING:
        if (!order.processingAt) {
          statusUpdates.processingAt = new Date();
        }
        break;
      case ORDER_STATUS.SHIPPED:
        if (!order.shippedAt) {
          statusUpdates.shippedAt = new Date();
        }
        break;
      case ORDER_STATUS.DELIVERED:
        if (!order.deliveredAt) {
          statusUpdates.deliveredAt = new Date();
        }
        break;
      case ORDER_STATUS.CANCELLED:
        if (!order.cancelledAt) {
          statusUpdates.cancelledAt = new Date();
        }
        break;
    }

    if (adminNotes) {
      statusUpdates.adminNotes = adminNotes;
    }

    Object.assign(order, statusUpdates);
    await order.save();

    return await this.getOrderById(orderId, null, true);
  }

  /**
   * Get valid status transitions
   */
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      [ORDER_STATUS.PENDING]: [
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.PROCESSING]: [
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.SHIPPED]: [
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED, // Rare but possible
      ],
      [ORDER_STATUS.DELIVERED]: [], // Final state
      [ORDER_STATUS.CANCELLED]: [], // Final state
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, userId, reason = null, isAdmin = false) {
    const order = await Order.findById(orderId);
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
    order.status = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    if (reason) {
      order.cancelledReason = reason;
    }

    await order.save();

    return await this.getOrderById(orderId, userId, isAdmin);
  }

  /**
   * Update shipping information (Admin only)
   */
  async updateShippingInfo(orderId, shippingData) {
    const order = await Order.findById(orderId);
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

    // Update shipping info
    if (shippingData.trackingNumber) {
      order.shipping.trackingNumber = shippingData.trackingNumber;
    }
    if (shippingData.carrier) {
      order.shipping.carrier = shippingData.carrier;
    }
    if (shippingData.method) {
      order.shipping.method = shippingData.method;
    }
    if (shippingData.cost !== undefined) {
      // Recalculate total if shipping cost changes
      const oldShippingCost = order.shippingCost;
      order.shipping.cost = shippingData.cost;
      order.shippingCost = shippingData.cost;
      order.total = order.subtotal + order.tax + shippingData.cost;
    }

    await order.save();

    return await this.getOrderById(orderId, null, true);
  }

  /**
   * Update order payment status (called by payment service)
   */
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    order.payment.status = paymentStatus;
    if (transactionId) {
      order.payment.transactionId = transactionId;
    }

    // If payment is successful, move order to processing
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      if (order.status === ORDER_STATUS.PENDING) {
        order.status = ORDER_STATUS.PROCESSING;
        order.payment.paidAt = new Date();
        order.paidAt = new Date();
        order.processingAt = new Date();
      }
    }

    await order.save();
    return order;
  }
}

export default new OrderService();

