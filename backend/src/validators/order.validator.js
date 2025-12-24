import Joi from 'joi';
import { ORDER_STATUS } from '../config/constants.js';

// Address schema
const addressSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Name is required',
  }),
  street: Joi.string().required().messages({
    'string.empty': 'Street address is required',
  }),
  city: Joi.string().required().messages({
    'string.empty': 'City is required',
  }),
  state: Joi.string().required().messages({
    'string.empty': 'State is required',
  }),
  zipCode: Joi.string().required().messages({
    'string.empty': 'ZIP code is required',
  }),
  country: Joi.string().required().messages({
    'string.empty': 'Country is required',
  }),
  phone: Joi.string().required().messages({
    'string.empty': 'Phone number is required',
  }),
});

// Create order schema
export const createOrderSchema = Joi.object({
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.optional(),
  shippingMethod: Joi.string().default('standard'),
  shippingCost: Joi.number().min(0).default(0),
  tax: Joi.number().min(0).default(0),
  notes: Joi.string().max(500).allow('', null),
});

// Update order status schema
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .required()
    .messages({
      'any.only': 'Invalid order status',
    }),
  adminNotes: Joi.string().max(1000).allow('', null),
});

// Cancel order schema
export const cancelOrderSchema = Joi.object({
  reason: Joi.string().max(500).allow('', null),
});

// Update shipping info schema
export const updateShippingInfoSchema = Joi.object({
  trackingNumber: Joi.string().trim().allow('', null),
  carrier: Joi.string().trim().allow('', null),
  method: Joi.string().trim().allow('', null),
  cost: Joi.number().min(0).allow(null),
});

// Query parameters schema
export const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(ORDER_STATUS)),
  paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded', 'cancelled'),
  userId: Joi.string(),
  search: Joi.string().trim(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
});


