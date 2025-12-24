import Joi from 'joi';

// Variant option schema
const variantOptionSchema = Joi.object({
  value: Joi.string().required().messages({
    'string.empty': 'Variant option value is required',
  }),
  price: Joi.number().default(0),
  sku: Joi.string().allow('', null),
  stock: Joi.number().min(0).default(0),
  image: Joi.string().uri().allow('', null),
});

// Variant schema
const variantSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Variant name is required',
  }),
  options: Joi.array().items(variantOptionSchema).min(1).required(),
});

// Image schema
const imageSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().allow('', null),
  alt: Joi.string().allow('', null),
  isPrimary: Joi.boolean().default(false),
  order: Joi.number().default(0),
});

// Create product schema
export const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).trim().required().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name cannot exceed 100 characters',
  }),
  slug: Joi.string()
    .lowercase()
    .trim()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .messages({
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  description: Joi.string().min(10).required().messages({
    'string.empty': 'Product description is required',
    'string.min': 'Description must be at least 10 characters',
  }),
  shortDescription: Joi.string().max(200).allow('', null),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
  }),
  compareAtPrice: Joi.number().min(0).allow(null),
  category: Joi.string().required().messages({
    'string.empty': 'Category is required',
  }),
  images: Joi.array().items(imageSchema).min(1).messages({
    'array.min': 'At least one image is required',
  }),
  variants: Joi.array().items(variantSchema).allow(null),
  stock: Joi.number().min(0).default(0),
  trackInventory: Joi.boolean().default(true),
  allowBackorder: Joi.boolean().default(false),
  sku: Joi.string().trim().allow('', null),
  weight: Joi.number().min(0).allow(null),
  dimensions: Joi.object({
    length: Joi.number().min(0).allow(null),
    width: Joi.number().min(0).allow(null),
    height: Joi.number().min(0).allow(null),
  }).allow(null),
  status: Joi.string().valid('active', 'inactive', 'draft').default('active'),
  featured: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string().trim().lowercase()).allow(null),
  metaTitle: Joi.string().max(60).allow('', null),
  metaDescription: Joi.string().max(160).allow('', null),
});

// Update product schema (all fields optional)
export const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).trim(),
  slug: Joi.string()
    .lowercase()
    .trim()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: Joi.string().min(10),
  shortDescription: Joi.string().max(200).allow('', null),
  price: Joi.number().min(0),
  compareAtPrice: Joi.number().min(0).allow(null),
  category: Joi.string(),
  images: Joi.array().items(imageSchema),
  variants: Joi.array().items(variantSchema).allow(null),
  stock: Joi.number().min(0),
  trackInventory: Joi.boolean(),
  allowBackorder: Joi.boolean(),
  sku: Joi.string().trim().allow('', null),
  weight: Joi.number().min(0).allow(null),
  dimensions: Joi.object({
    length: Joi.number().min(0).allow(null),
    width: Joi.number().min(0).allow(null),
    height: Joi.number().min(0).allow(null),
  }).allow(null),
  status: Joi.string().valid('active', 'inactive', 'draft'),
  featured: Joi.boolean(),
  tags: Joi.array().items(Joi.string().trim().lowercase()).allow(null),
  metaTitle: Joi.string().max(60).allow('', null),
  metaDescription: Joi.string().max(160).allow('', null),
});

// Query parameters schema
export const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
  category: Joi.string(),
  search: Joi.string().trim(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  status: Joi.string().valid('active', 'inactive', 'draft'),
  featured: Joi.boolean(),
  sort: Joi.string().valid('price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest').default('newest'),
  inStock: Joi.boolean(),
});


