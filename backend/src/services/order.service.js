import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logging.config.js';
import cartService from './cart.service.js';
import inventoryService from './inventory.service.js';
import couponService from './coupon.service.js';

/**
 * Order Service
 * Handles all order-related business logic
 */
class OrderService {
  /**
   * Create order from cart
   * Uses MongoDB transactions and atomic stock operations to prevent race conditions
   */
  async createOrderFromCart(userId, orderData) {
    const {
      shippingAddress,
      billingAddress,
      shippingMethod,
      shippingCost,
      tax,
      notes,
      couponCode,
    } = orderData;

    // Get cart summary (validated)
    const cartSummary = await cartService.getCartSummary(userId);

    if (!cartSummary.items || cartSummary.items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Start MongoDB transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate and atomically decrement stock for all items
      const stockValidationErrors = [];
      const stockDecrementResults = [];

      for (const item of cartSummary.items) {
        try {
          // Atomic stock decrement (prevents race conditions)
          const result = await inventoryService.decrementStock(
            item.product._id,
            item.quantity,
            item.selectedVariants || [],
            session
          );

          stockDecrementResults.push({
            productId: item.product._id,
            success: true,
            availableStock: result.availableStock,
          });
        } catch (error) {
          // Stock insufficient or product unavailable
          stockValidationErrors.push({
            productId: item.product._id,
            productName: item.product.name,
            reason: error.message || 'Insufficient stock',
            availableStock: error.availableStock,
          });
        }
      }

      // If any item has insufficient stock, abort transaction and return errors
      if (stockValidationErrors.length > 0) {
        await session.abortTransaction();
        const error = new Error('Some items in your cart are no longer available');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.validationErrors = stockValidationErrors;
        throw error;
      }

      // Prepare order items with product snapshots
      const orderItems = await Promise.all(
        cartSummary.items.map(async (item) => {
          const product = await Product.findById(item.product._id)
            .select('name sku images')
            .session(session)
            .lean();
          const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

          return {
            product: item.product._id,
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

      // Apply coupon discount if provided
      let discountAmount = 0;
      let couponData = null;
      
      if (couponCode) {
        try {
          const couponResult = await couponService.validateAndApplyCoupon(
            couponCode,
            subtotal,
            userId,
            cartSummary.items
          );
          
          discountAmount = couponResult.discountAmount;
          couponData = {
            amount: discountAmount,
            couponCode: couponResult.coupon.code,
            couponId: couponResult.coupon.id,
            discountType: couponResult.discountType,
            discountValue: couponResult.discountValue,
          };
        } catch (error) {
          // If coupon validation fails, continue without discount
          logger.warn(`Coupon validation failed: ${error.message}`);
          // Don't throw error, just proceed without discount
        }
      }

      const total = subtotal - discountAmount + finalShippingCost + finalTax;

      // Create order within transaction
      const [order] = await Order.create(
        [
          {
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
            discount: couponData || { amount: 0 },
            tax: finalTax,
            shippingCost: finalShippingCost,
            total,
            notes: notes || null,
          },
        ],
        { session }
      );

      // Increment coupon usage if coupon was applied
      if (couponData && couponData.couponId) {
        // Do this outside transaction to avoid blocking
        couponService.incrementCouponUsage(couponData.couponId).catch((error) => {
          logger.error(`Error incrementing coupon usage: ${error.message}`);
        });
      }

      // Commit transaction (all operations succeed or all rollback)
      await session.commitTransaction();

      // Clear cart after successful order creation (outside transaction)
      await cartService.clearCart(userId);

      logger.info(`Order created successfully: ${order._id} for user: ${userId}`);

      return await this.getOrderById(order._id, userId);
    } catch (error) {
      // Abort transaction on any error (stock automatically restored)
      await session.abortTransaction();
      logger.error('Error creating order:', error);

      // Re-throw error with proper status code
      if (error.statusCode) {
        throw error;
      }

      const orderError = new Error(
        error.message || 'Failed to create order'
      );
      orderError.statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      orderError.validationErrors = error.validationErrors;
      throw orderError;
    } finally {
      await session.endSession();
    }
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

    // Field selection for list view
    const selectFields = 'orderNumber user items status payment.status total createdAt';

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(selectFields) // Only fetch needed fields
        .populate('items.product', 'name slug images') // Minimal product data
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

    // Field selection for admin list view
    const selectFields = 'orderNumber user items status payment.status total createdAt';

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(selectFields) // Only fetch needed fields
        .populate('user', 'name email') // Minimal user data
        .populate('items.product', 'name slug') // Minimal product data
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

