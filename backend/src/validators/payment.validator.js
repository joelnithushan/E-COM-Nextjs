import Joi from 'joi';
import { PAYMENT_METHODS } from '../config/constants.js';

// Create payment intent validation schema
export const createPaymentIntentSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'string.empty': 'Order ID is required',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .default(PAYMENT_METHODS.STRIPE)
    .messages({
      'any.only': 'Invalid payment method',
    }),
});

// Verify payment validation schema
export const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'string.empty': 'Order ID is required',
  }),
  paymentIntentId: Joi.string().required().messages({
    'string.empty': 'Payment intent ID is required',
  }),
});

// Refund payment validation schema
export const refundPaymentSchema = Joi.object({
  amount: Joi.number().positive().optional().messages({
    'number.positive': 'Refund amount must be positive',
  }),
});


