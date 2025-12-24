import Joi from 'joi';

// Create category schema
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required().messages({
    'string.empty': 'Category name is required',
    'string.min': 'Category name must be at least 2 characters',
    'string.max': 'Category name cannot exceed 50 characters',
  }),
  slug: Joi.string()
    .lowercase()
    .trim()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .messages({
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  description: Joi.string().max(500).trim().allow('', null),
  image: Joi.object({
    url: Joi.string().uri().allow('', null),
    publicId: Joi.string().allow('', null),
  }).allow(null),
  parent: Joi.string().allow(null, ''),
  status: Joi.string().valid('active', 'inactive').default('active'),
  order: Joi.number().default(0),
  metaTitle: Joi.string().max(60).allow('', null),
  metaDescription: Joi.string().max(160).allow('', null),
});

// Update category schema
export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).trim(),
  slug: Joi.string()
    .lowercase()
    .trim()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: Joi.string().max(500).trim().allow('', null),
  image: Joi.object({
    url: Joi.string().uri().allow('', null),
    publicId: Joi.string().allow('', null),
  }).allow(null),
  parent: Joi.string().allow(null, ''),
  status: Joi.string().valid('active', 'inactive'),
  order: Joi.number(),
  metaTitle: Joi.string().max(60).allow('', null),
  metaDescription: Joi.string().max(160).allow('', null),
});

// Query parameters schema
export const categoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('active', 'inactive'),
  parent: Joi.string().allow(null, ''),
  search: Joi.string().trim(),
  sort: Joi.string().valid('name_asc', 'name_desc', 'order_asc', 'order_desc', 'newest').default('order_asc'),
});


