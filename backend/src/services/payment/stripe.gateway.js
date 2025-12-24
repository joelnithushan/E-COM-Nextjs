import stripe from '../../config/stripe.js';
import { PaymentGateway } from './payment.gateway.interface.js';
import { PAYMENT_STATUS } from '../../config/constants.js';
import { logger } from '../../utils/logger.util.js';

/**
 * Stripe Payment Gateway Implementation
 */
export class StripeGateway extends PaymentGateway {
  /**
   * Create a Stripe Payment Intent
   */
  async createPaymentIntent({ amount, currency = 'usd', orderId, metadata = {} }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          orderId: orderId.toString(),
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      logger.error('Stripe createPaymentIntent error:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Verify/Confirm a Stripe Payment
   */
  async verifyPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      const statusMap = {
        succeeded: PAYMENT_STATUS.PAID,
        processing: PAYMENT_STATUS.PENDING,
        requires_payment_method: PAYMENT_STATUS.FAILED,
        requires_confirmation: PAYMENT_STATUS.PENDING,
        requires_action: PAYMENT_STATUS.PENDING,
        canceled: PAYMENT_STATUS.CANCELLED,
      };

      return {
        success: paymentIntent.status === 'succeeded',
        status: statusMap[paymentIntent.status] || PAYMENT_STATUS.PENDING,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
        failureReason: paymentIntent.last_payment_error?.message,
      };
    } catch (error) {
      logger.error('Stripe verifyPayment error:', error);
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }

  /**
   * Handle Stripe Webhook Events
   */
  async handleWebhook(event) {
    try {
      const { type, data } = event;

      switch (type) {
        case 'payment_intent.succeeded':
          return {
            eventType: 'payment.succeeded',
            paymentIntentId: data.object.id,
            amount: data.object.amount / 100,
            currency: data.object.currency,
            orderId: data.object.metadata?.orderId,
            paidAt: new Date(data.object.created * 1000),
          };

        case 'payment_intent.payment_failed':
          return {
            eventType: 'payment.failed',
            paymentIntentId: data.object.id,
            amount: data.object.amount / 100,
            currency: data.object.currency,
            orderId: data.object.metadata?.orderId,
            failureReason: data.object.last_payment_error?.message,
          };

        case 'charge.refunded':
          return {
            eventType: 'payment.refunded',
            paymentIntentId: data.object.payment_intent,
            refundId: data.object.id,
            amount: data.object.amount_refunded / 100,
            currency: data.object.currency,
            orderId: data.object.metadata?.orderId,
          };

        default:
          return {
            eventType: type,
            data: data.object,
          };
      }
    } catch (error) {
      logger.error('Stripe handleWebhook error:', error);
      throw error;
    }
  }

  /**
   * Refund a Stripe Payment
   */
  async refundPayment(paymentIntentId, amount = null) {
    try {
      // Retrieve payment intent to get charge ID
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment must be succeeded to refund');
      }

      // Get the charge ID from the payment intent
      const charges = await stripe.charges.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });

      if (charges.data.length === 0) {
        throw new Error('No charge found for this payment intent');
      }

      const chargeId = charges.data[0].id;

      // Create refund
      const refundParams = {
        charge: chargeId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundParams);

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      logger.error('Stripe refundPayment error:', error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Get Payment Status
   */
  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      const statusMap = {
        succeeded: PAYMENT_STATUS.PAID,
        processing: PAYMENT_STATUS.PENDING,
        requires_payment_method: PAYMENT_STATUS.FAILED,
        requires_confirmation: PAYMENT_STATUS.PENDING,
        requires_action: PAYMENT_STATUS.PENDING,
        canceled: PAYMENT_STATUS.CANCELLED,
      };

      return {
        id: paymentIntent.id,
        status: statusMap[paymentIntent.status] || PAYMENT_STATUS.PENDING,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      logger.error('Stripe getPaymentStatus error:', error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }
}


