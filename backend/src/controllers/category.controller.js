import categoryService from '../services/category.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Get all categories
 */
export const getCategories = async (req, res) => {
  try {
    const result = await categoryService.getCategories(req.query);
    sendSuccess(res, result, 'Categories retrieved successfully');
  } catch (error) {
    logger.error('Get categories error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve categories',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get all categories (no pagination)
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(req.query);
    sendSuccess(res, { categories }, 'Categories retrieved successfully');
  } catch (error) {
    logger.error('Get all categories error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve categories',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get single category
 */
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    sendSuccess(res, { category }, 'Category retrieved successfully');
  } catch (error) {
    logger.error('Get category error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve category',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Create category
 */
export const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const image = req.file;

    const category = await categoryService.createCategory(categoryData, image);

    sendSuccess(
      res,
      { category },
      'Category created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Create category error:', error);
    sendError(
      res,
      error.message || 'Failed to create category',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Update category
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    const newImage = req.file;

    const category = await categoryService.updateCategory(id, categoryData, newImage);
    sendSuccess(res, { category }, 'Category updated successfully');
  } catch (error) {
    logger.error('Update category error:', error);
    sendError(
      res,
      error.message || 'Failed to update category',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    sendSuccess(res, null, 'Category deleted successfully');
  } catch (error) {
    logger.error('Delete category error:', error);
    sendError(
      res,
      error.message || 'Failed to delete category',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};


