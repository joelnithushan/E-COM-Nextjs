import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all products (public)
 * @access  Public
 */
router.get(
  '/',
  validate(productQuerySchema, 'query'),
  productController.getProducts
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get single product (public)
 * @access  Public
 */
router.get('/:id', productController.getProduct);

/**
 * @route   POST /api/v1/products
 * @desc    Create product
 * @access  Private (Admin only)
 * Note: Supports both file uploads (multipart/form-data) and JSON with image URLs
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  // Optional file upload - only processes if Content-Type is multipart/form-data
  (req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return uploadMultiple('images', 10)(req, res, next);
    }
    next();
  },
  handleUploadError,
  validate(createProductSchema),
  productController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 * Note: Supports both file uploads (multipart/form-data) and JSON with image URLs
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  // Optional file upload - only processes if Content-Type is multipart/form-data
  (req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return uploadMultiple('images', 10)(req, res, next);
    }
    next();
  },
  handleUploadError,
  validate(updateProductSchema),
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, adminOnly, productController.deleteProduct);

/**
 * @route   DELETE /api/v1/products/:id/images/:imagePublicId
 * @desc    Delete product image
 * @access  Private (Admin only)
 */
router.delete(
  '/:id/images/:imagePublicId',
  authenticate,
  adminOnly,
  productController.deleteProductImage
);

export default router;


