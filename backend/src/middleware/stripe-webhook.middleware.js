import stripe from '../config/stripe.js';
import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Middleware to verify Stripe webhook signature
 * This ensures the webhook request is actually from Stripe
 */
export const verifyStripeWebhook = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    logger.warn('Stripe webhook signature missing');
    return sendError(res, 'Missing stripe-signature header', HTTP_STATUS.BAD_REQUEST);
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return sendError(
      res,
      'Webhook secret not configured',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Attach verified event to request
    req.body = event;
    next();
  } catch (error) {
    logger.error('Stripe webhook signature verification failed:', error.message);
    return sendError(res, 'Invalid webhook signature', HTTP_STATUS.BAD_REQUEST);
  }
};

