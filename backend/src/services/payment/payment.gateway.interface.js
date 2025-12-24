/**
 * Abstract Payment Gateway Interface
 * 
 * This interface defines the contract that all payment gateways must implement.
 * This allows for easy integration of multiple payment providers (Stripe, PayPal, PayHere, etc.)
 */

/**
 * Payment Intent Creation Result
 */
export interface PaymentIntentResult {
  id: string; // Payment intent/transaction ID
  clientSecret?: string; // For client-side confirmation (Stripe)
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

/**
 * Payment Verification Result
 */
export interface PaymentVerificationResult {
  success: boolean;
  status: string;
  transactionId: string;
  amount: number;
  currency: string;
  paidAt?: Date;
  failureReason?: string;
}

/**
 * Refund Result
 */
export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}

/**
 * Abstract Payment Gateway Class
 * All payment gateway implementations must extend this class
 */
export class PaymentGateway {
  /**
   * Create a payment intent
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Amount in smallest currency unit (cents for USD)
   * @param {string} params.currency - Currency code (e.g., 'usd')
   * @param {string} params.orderId - Order ID
   * @param {Object} params.metadata - Additional metadata
   * @returns {Promise<PaymentIntentResult>}
   */
  async createPaymentIntent(params) {
    throw new Error('createPaymentIntent must be implemented by subclass');
  }

  /**
   * Verify/Confirm a payment
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<PaymentVerificationResult>}
   */
  async verifyPayment(paymentIntentId) {
    throw new Error('verifyPayment must be implemented by subclass');
  }

  /**
   * Process webhook event
   * @param {Object} event - Webhook event payload
   * @returns {Promise<Object>} Processed event data
   */
  async handleWebhook(event) {
    throw new Error('handleWebhook must be implemented by subclass');
  }

  /**
   * Refund a payment
   * @param {string} transactionId - Transaction ID to refund
   * @param {number} amount - Amount to refund (optional, full refund if not provided)
   * @returns {Promise<RefundResult>}
   */
  async refundPayment(transactionId, amount = null) {
    throw new Error('refundPayment must be implemented by subclass');
  }

  /**
   * Get payment status
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment status information
   */
  async getPaymentStatus(paymentIntentId) {
    throw new Error('getPaymentStatus must be implemented by subclass');
  }
}


