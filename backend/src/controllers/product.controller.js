import productService from '../services/product.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Get all products
 */
export const getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts(req.query);
    sendSuccess(res, result, 'Products retrieved successfully');
  } catch (error) {
    logger.error('Get products error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve products',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get single product
 */
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    sendSuccess(res, { product }, 'Product retrieved successfully');
  } catch (error) {
    logger.error('Get product error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve product',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Create product
 */
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const images = req.files || (req.file ? [req.file] : []);

    // Parse JSON fields if sent as strings (from form-data)
    if (typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }
    if (typeof productData.images === 'string') {
      productData.images = JSON.parse(productData.images);
    }
    if (typeof productData.dimensions === 'string') {
      productData.dimensions = JSON.parse(productData.dimensions);
    }
    if (typeof productData.tags === 'string') {
      productData.tags = JSON.parse(productData.tags);
    }

    const product = await productService.createProduct(
      productData,
      images,
      req.user?.id
    );

    sendSuccess(
      res,
      { product },
      'Product created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Create product error:', error);
    sendError(
      res,
      error.message || 'Failed to create product',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Update product
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const newImages = req.files || (req.file ? [req.file] : []);

    // Parse JSON fields if sent as strings
    if (typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }
    if (typeof productData.images === 'string') {
      productData.images = JSON.parse(productData.images);
    }
    if (typeof productData.dimensions === 'string') {
      productData.dimensions = JSON.parse(productData.dimensions);
    }
    if (typeof productData.tags === 'string') {
      productData.tags = JSON.parse(productData.tags);
    }

    const product = await productService.updateProduct(id, productData, newImages);
    sendSuccess(res, { product }, 'Product updated successfully');
  } catch (error) {
    logger.error('Update product error:', error);
    sendError(
      res,
      error.message || 'Failed to update product',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    logger.error('Delete product error:', error);
    sendError(
      res,
      error.message || 'Failed to delete product',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Delete product image
 */
export const deleteProductImage = async (req, res) => {
  try {
    const { id, imagePublicId } = req.params;
    const product = await productService.deleteProductImage(id, imagePublicId);
    sendSuccess(res, { product }, 'Image deleted successfully');
  } catch (error) {
    logger.error('Delete product image error:', error);
    sendError(
      res,
      error.message || 'Failed to delete image',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};


