import Stripe from 'stripe';
import { logger } from '../utils/logger.util.js';
import config from './index.js';

if (!config.stripe.secretKey) {
  logger.warn('Stripe secret key not configured. Payment features will not work.');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion,
});

export default stripe;


