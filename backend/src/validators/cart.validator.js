import Joi from 'joi';

// Selected variant schema
const selectedVariantSchema = Joi.object({
  variantName: Joi.string().required().messages({
    'string.empty': 'Variant name is required',
  }),
  optionValue: Joi.string().required().messages({
    'string.empty': 'Variant option value is required',
  }),
});

// Add item to cart schema
export const addItemSchema = Joi.object({
  productId: Joi.string().required().messages({
    'string.empty': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
  }),
  selectedVariants: Joi.array().items(selectedVariantSchema).default([]),
});

// Update item quantity schema
export const updateItemQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
  }),
});


