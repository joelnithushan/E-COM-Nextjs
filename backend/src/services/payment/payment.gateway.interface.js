/**
 * Abstract Payment Gateway Interface
 * 
 * This interface defines the contract that all payment gateways must implement.
 * This allows for easy integration of multiple payment providers (Stripe, PayPal, PayHere, etc.)
 */

/**
 * @typedef {Object} PaymentIntentResult
 * @property {string} id - Payment intent/transaction ID
 * @property {string} [clientSecret] - For client-side confirmation (Stripe)
 * @property {string} status - Payment status
 * @property {number} amount - Amount in smallest currency unit
 * @property {string} currency - Currency code (e.g., 'usd')
 * @property {Record<string, string>} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} PaymentVerificationResult
 * @property {boolean} success - Whether payment was successful
 * @property {string} status - Payment status
 * @property {string} transactionId - Transaction ID
 * @property {number} amount - Amount paid
 * @property {string} currency - Currency code
 * @property {Date} [paidAt] - Payment timestamp
 * @property {string} [failureReason] - Reason for failure if unsuccessful
 */

/**
 * @typedef {Object} RefundResult
 * @property {boolean} success - Whether refund was successful
 * @property {string} refundId - Refund transaction ID
 * @property {number} amount - Refunded amount
 * @property {string} status - Refund status
 */

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



