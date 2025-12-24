import express from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from '../validators/category.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with pagination (public)
 * @access  Public
 */
router.get(
  '/',
  validate(categoryQuerySchema, 'query'),
  categoryController.getCategories
);

/**
 * @route   GET /api/v1/categories/all
 * @desc    Get all categories without pagination (for dropdowns)
 * @access  Public
 */
router.get('/all', categoryController.getAllCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get single category (public)
 * @access  Public
 */
router.get('/:id', categoryController.getCategory);

/**
 * @route   POST /api/v1/categories
 * @desc    Create category
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  uploadSingle('image'),
  handleUploadError,
  validate(createCategorySchema),
  categoryController.createCategory
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  uploadSingle('image'),
  handleUploadError,
  validate(updateCategorySchema),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, adminOnly, categoryController.deleteCategory);

export default router;

