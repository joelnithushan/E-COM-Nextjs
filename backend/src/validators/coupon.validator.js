import Joi from 'joi';

/**
 * Coupon Validation Schemas
 */

// Create coupon schema
export const createCouponSchema = Joi.object({
  code: Joi.string()
    .required()
    .min(3)
    .max(50)
    .pattern(/^[A-Z0-9_-]+$/)
    .messages({
      'string.pattern.base': 'Coupon code can only contain letters, numbers, hyphens, and underscores',
    }),
  
  discountType: Joi.string()
    .valid('percentage', 'fixed')
    .required()
    .messages({
      'any.only': 'Discount type must be either "percentage" or "fixed"',
    }),
  
  discountValue: Joi.number()
    .required()
    .min(0)
    .when('discountType', {
      is: 'percentage',
      then: Joi.number().max(100),
      otherwise: Joi.number(),
    })
    .messages({
      'number.max': 'Percentage discount must be between 0 and 100',
    }),
  
  minimumOrderValue: Joi.number()
    .min(0)
    .default(0),
  
  maxDiscountAmount: Joi.number()
    .min(0)
    .when('discountType', {
      is: 'percentage',
      then: Joi.number().optional(),
      otherwise: Joi.number().forbidden(),
    }),
  
  expiresAt: Joi.date()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Expiry date must be in the future',
    }),
  
  startsAt: Joi.date()
    .optional()
    .default(Date.now),
  
  usageLimit: Joi.number()
    .min(0)
    .allow(null)
    .optional(),
  
  perUserLimit: Joi.number()
    .min(1)
    .default(1),
  
  applicableProducts: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  applicableCategories: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  excludedProducts: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  excludedCategories: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  isActive: Joi.boolean()
    .default(true),
  
  description: Joi.string()
    .max(500)
    .optional(),
  
  notes: Joi.string()
    .max(1000)
    .optional(),
});

// Update coupon schema (all fields optional)
export const updateCouponSchema = Joi.object({
  code: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[A-Z0-9_-]+$/)
    .optional(),
  
  discountType: Joi.string()
    .valid('percentage', 'fixed')
    .optional(),
  
  discountValue: Joi.number()
    .min(0)
    .when('discountType', {
      is: 'percentage',
      then: Joi.number().max(100),
      otherwise: Joi.number(),
    })
    .optional(),
  
  minimumOrderValue: Joi.number()
    .min(0)
    .optional(),
  
  maxDiscountAmount: Joi.number()
    .min(0)
    .when('discountType', {
      is: 'percentage',
      then: Joi.number().optional(),
      otherwise: Joi.number().forbidden(),
    }),
  
  expiresAt: Joi.date()
    .optional()
    .allow(null),
  
  startsAt: Joi.date()
    .optional(),
  
  usageLimit: Joi.number()
    .min(0)
    .allow(null)
    .optional(),
  
  perUserLimit: Joi.number()
    .min(1)
    .optional(),
  
  applicableProducts: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  applicableCategories: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  excludedProducts: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  excludedCategories: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
  
  isActive: Joi.boolean()
    .optional(),
  
  description: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),
  
  notes: Joi.string()
    .max(1000)
    .allow(null, '')
    .optional(),
});

// Validate coupon schema (public endpoint)
export const validateCouponSchema = Joi.object({
  code: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Coupon code is required',
    }),
  
  orderTotal: Joi.number()
    .required()
    .min(0)
    .messages({
      'any.required': 'Order total is required',
      'number.min': 'Order total must be positive',
    }),
  
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.alternatives()
          .try(Joi.string().hex().length(24), Joi.object())
          .required(),
        quantity: Joi.number().min(1).required(),
        selectedVariants: Joi.array().optional(),
      })
    )
    .optional()
    .default([]),
});

// Query schema for getting coupons
export const couponQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isActive: Joi.boolean().optional(),
  search: Joi.string().optional(),
  discountType: Joi.string().valid('percentage', 'fixed').optional(),
  expired: Joi.boolean().optional(),
});



