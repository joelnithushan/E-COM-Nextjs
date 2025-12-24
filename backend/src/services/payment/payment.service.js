import Order from '../../models/Order.js';
import { StripeGateway } from './stripe.gateway.js';
import { PAYMENT_STATUS, PAYMENT_METHODS, ORDER_STATUS } from '../../config/constants.js';
import { logger } from '../../utils/logger.util.js';
import { HTTP_STATUS } from '../../config/constants.js';
import orderService from '../order.service.js';

/**
 * Payment Service
 * Handles payment operations and abstracts payment gateway logic
 */
class PaymentService {
  constructor() {
    // Initialize payment gateways
    this.gateways = {
      [PAYMENT_METHODS.STRIPE]: new StripeGateway(),
      // Future: Add PayPal and PayHere gateways here
      // [PAYMENT_METHODS.PAYPAL]: new PayPalGateway(),
      // [PAYMENT_METHODS.PAYHERE]: new PayHereGateway(),
    };
  }

  /**
   * Get payment gateway instance
   * @param {string} method - Payment method (stripe, paypal, payhere)
   * @returns {PaymentGateway} Gateway instance
   */
  getGateway(method) {
    const gateway = this.gateways[method];
    if (!gateway) {
      throw new Error(`Payment gateway not found for method: ${method}`);
    }
    return gateway;
  }

  /**
   * Create payment intent for an order
   * @param {string} orderId - Order ID
   * @param {string} paymentMethod - Payment method
   * @returns {Promise<Object>} Payment intent result
   */
  async createPaymentIntent(orderId, paymentMethod = PAYMENT_METHODS.STRIPE) {
    try {
      // Get order
      const order = await Order.findById(orderId);
      if (!order) {
        const error = new Error('Order not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if order already has a paid payment
      if (order.payment.status === PAYMENT_STATUS.PAID) {
        const error = new Error('Order is already paid');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Get payment gateway
      const gateway = this.getGateway(paymentMethod);

      // Create payment intent
      const paymentIntent = await gateway.createPaymentIntent({
        amount: order.total,
        currency: order.payment.currency || 'usd',
        orderId: order._id.toString(),
        metadata: {
          orderNumber: order.orderNumber,
          userId: order.user.toString(),
        },
      });

      // Update order with payment intent ID
      order.payment.paymentIntentId = paymentIntent.id;
      order.payment.method = paymentMethod;
      await order.save();

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      logger.error('PaymentService createPaymentIntent error:', error);
      throw error;
    }
  }

  /**
   * Verify payment before order confirmation
   * @param {string} orderId - Order ID
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(orderId, paymentIntentId) {
    try {
      // Get order
      const order = await Order.findById(orderId);
      if (!order) {
        const error = new Error('Order not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Verify payment intent ID matches
      if (order.payment.paymentIntentId !== paymentIntentId) {
        const error = new Error('Payment intent ID does not match order');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Get payment gateway
      const gateway = this.getGateway(order.payment.method);

      // Verify payment
      const verification = await gateway.verifyPayment(paymentIntentId);

      // Update order payment status using order service
      await orderService.updatePaymentStatus(
        orderId,
        verification.status,
        verification.transactionId
      );

      return {
        success: verification.success,
        status: verification.status,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paidAt: order.payment.paidAt,
      };
    } catch (error) {
      logger.error('PaymentService verifyPayment error:', error);
      throw error;
    }
  }

  /**
   * Handle webhook event from payment gateway
   * @param {string} paymentMethod - Payment method
   * @param {Object} event - Webhook event
   * @returns {Promise<Object>} Processed event result
   */
  async handleWebhook(paymentMethod, event) {
    try {
      const gateway = this.getGateway(paymentMethod);
      const webhookData = await gateway.handleWebhook(event);

      // Find order by payment intent ID
      const order = await Order.findOne({
        'payment.paymentIntentId': webhookData.paymentIntentId,
      });

      if (!order) {
        logger.warn(`Order not found for payment intent: ${webhookData.paymentIntentId}`);
        return { processed: false, reason: 'Order not found' };
      }

      // Update order based on webhook event using order service
      switch (webhookData.eventType) {
        case 'payment.succeeded':
          await orderService.updatePaymentStatus(
            order._id.toString(),
            PAYMENT_STATUS.PAID,
            webhookData.paymentIntentId
          );
          break;

        case 'payment.failed':
          await orderService.updatePaymentStatus(
            order._id.toString(),
            PAYMENT_STATUS.FAILED
          );
          break;

        case 'payment.refunded':
          await orderService.updatePaymentStatus(
            order._id.toString(),
            PAYMENT_STATUS.REFUNDED
          );
          // Also update refund timestamp
          order.payment.refundedAt = new Date();
          await order.save();
          break;

        default:
          logger.info(`Unhandled webhook event type: ${webhookData.eventType}`);
      }

      return {
        processed: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        eventType: webhookData.eventType,
      };
    } catch (error) {
      logger.error('PaymentService handleWebhook error:', error);
      throw error;
    }
  }

  /**
   * Refund a payment
   * @param {string} orderId - Order ID
   * @param {number} amount - Amount to refund (optional, full refund if not provided)
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(orderId, amount = null) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        const error = new Error('Order not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      if (!order.payment.paymentIntentId) {
        const error = new Error('Payment intent not found for this order');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      if (order.payment.status !== PAYMENT_STATUS.PAID) {
        const error = new Error('Only paid orders can be refunded');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const gateway = this.getGateway(order.payment.method);
      const refund = await gateway.refundPayment(
        order.payment.paymentIntentId,
        amount
      );

      if (refund.success) {
        order.payment.status = PAYMENT_STATUS.REFUNDED;
        order.payment.refundedAt = new Date();
        await order.save();
      }

      return {
        success: refund.success,
        refundId: refund.refundId,
        amount: refund.amount,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      logger.error('PaymentService refundPayment error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PaymentService();

