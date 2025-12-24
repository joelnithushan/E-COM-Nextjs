import paymentService from '../services/payment/payment.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Create payment intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    const result = await paymentService.createPaymentIntent(orderId, paymentMethod);

    sendSuccess(
      res,
      result,
      'Payment intent created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Create payment intent error:', error);
    sendError(
      res,
      error.message || 'Failed to create payment intent',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Verify payment
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const result = await paymentService.verifyPayment(orderId, paymentIntentId);

    sendSuccess(res, result, 'Payment verified successfully');
  } catch (error) {
    logger.error('Verify payment error:', error);
    sendError(
      res,
      error.message || 'Failed to verify payment',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Handle webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const paymentMethod = req.params.method || 'stripe';
    const event = req.body;

    const result = await paymentService.handleWebhook(paymentMethod, event);

    // Always return 200 to Stripe to acknowledge receipt
    res.status(HTTP_STATUS.OK).json({
      success: true,
      processed: result.processed,
      data: result,
    });
  } catch (error) {
    logger.error('Webhook handling error:', error);
    // Still return 200 to prevent Stripe from retrying
    res.status(HTTP_STATUS.OK).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const result = await paymentService.refundPayment(orderId, amount);

    sendSuccess(res, result, 'Payment refunded successfully');
  } catch (error) {
    logger.error('Refund payment error:', error);
    sendError(
      res,
      error.message || 'Failed to refund payment',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};


