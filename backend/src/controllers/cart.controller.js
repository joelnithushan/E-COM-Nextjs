import cartService from '../services/cart.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Get user's cart
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.getOrCreateCart(userId);

    sendSuccess(res, { cart }, 'Cart retrieved successfully');
  } catch (error) {
    logger.error('Get cart error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve cart',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Add item to cart
 */
export const addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, selectedVariants } = req.body;

    const cart = await cartService.addItem(userId, productId, quantity, selectedVariants);

    sendSuccess(
      res,
      { cart },
      'Item added to cart successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Add item to cart error:', error);
    
    // Include available stock in error response if applicable
    const errorResponse = {
      message: error.message || 'Failed to add item to cart',
    };
    
    if (error.availableStock !== undefined) {
      errorResponse.availableStock = error.availableStock;
    }

    sendError(
      res,
      errorResponse.message,
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.availableStock !== undefined ? { availableStock: error.availableStock } : null
    );
  }
};

/**
 * Update item quantity
 */
export const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateItemQuantity(userId, itemId, quantity);

    sendSuccess(res, { cart }, 'Item quantity updated successfully');
  } catch (error) {
    logger.error('Update item quantity error:', error);
    
    const errorResponse = {
      message: error.message || 'Failed to update item quantity',
    };
    
    if (error.availableStock !== undefined) {
      errorResponse.availableStock = error.availableStock;
    }

    sendError(
      res,
      errorResponse.message,
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.availableStock !== undefined ? { availableStock: error.availableStock } : null
    );
  }
};

/**
 * Remove item from cart
 */
export const removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await cartService.removeItem(userId, itemId);

    sendSuccess(res, { cart }, 'Item removed from cart successfully');
  } catch (error) {
    logger.error('Remove item from cart error:', error);
    sendError(
      res,
      error.message || 'Failed to remove item from cart',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Clear cart
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.clearCart(userId);

    sendSuccess(res, { cart }, 'Cart cleared successfully');
  } catch (error) {
    logger.error('Clear cart error:', error);
    sendError(
      res,
      error.message || 'Failed to clear cart',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get cart summary (for checkout)
 * Supports optional coupon code parameter
 */
export const getCartSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode } = req.query; // Get coupon code from query string
    const summary = await cartService.getCartSummary(userId, couponCode || null);

    sendSuccess(res, summary, 'Cart summary retrieved successfully');
  } catch (error) {
    logger.error('Get cart summary error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve cart summary',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};


