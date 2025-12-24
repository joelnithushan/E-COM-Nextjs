import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createPaymentIntentSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
} from '../validators/payment.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { verifyStripeWebhook } from '../middleware/stripe-webhook.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/v1/payments/create-intent
 * @desc    Create payment intent for an order
 * @access  Private
 */
router.post(
  '/create-intent',
  authenticate,
  validate(createPaymentIntentSchema),
  paymentController.createPaymentIntent
);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify payment before order confirmation
 * @access  Private
 */
router.post(
  '/verify',
  authenticate,
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

/**
 * @route   POST /api/v1/payments/webhook/:method
 * @desc    Handle payment gateway webhooks
 * @access  Public (verified by webhook signature)
 * @note    This route should NOT use body-parser JSON middleware
 *          Raw body is needed for signature verification
 */
router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  verifyStripeWebhook,
  paymentController.handleWebhook
);

/**
 * @route   POST /api/v1/payments/refund/:orderId
 * @desc    Refund a payment
 * @access  Private (Admin only)
 */
router.post(
  '/refund/:orderId',
  authenticate,
  adminOnly,
  validate(refundPaymentSchema),
  paymentController.refundPayment
);

export default router;

