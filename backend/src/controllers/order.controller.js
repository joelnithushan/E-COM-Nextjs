import orderService from '../services/order.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Create order from cart
 */
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;

    const order = await orderService.createOrderFromCart(userId, orderData);

    sendSuccess(
      res,
      { order },
      'Order created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Create order error:', error);
    
    const errorResponse = {
      message: error.message || 'Failed to create order',
    };

    if (error.validationErrors) {
      errorResponse.validationErrors = error.validationErrors;
    }

    sendError(
      res,
      errorResponse.message,
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.validationErrors ? { validationErrors: error.validationErrors } : null
    );
  }
};

/**
 * Get single order
 */
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const order = await orderService.getOrderById(id, userId, isAdmin);

    sendSuccess(res, { order }, 'Order retrieved successfully');
  } catch (error) {
    logger.error('Get order error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve order',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get user's orders
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await orderService.getUserOrders(userId, req.query);

    sendSuccess(res, result, 'Orders retrieved successfully');
  } catch (error) {
    logger.error('Get user orders error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve orders',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);

    sendSuccess(res, result, 'Orders retrieved successfully');
  } catch (error) {
    logger.error('Get all orders error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve orders',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const order = await orderService.updateOrderStatus(id, status, adminNotes);

    sendSuccess(res, { order }, 'Order status updated successfully');
  } catch (error) {
    logger.error('Update order status error:', error);
    sendError(
      res,
      error.message || 'Failed to update order status',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { reason } = req.body;

    const order = await orderService.cancelOrder(id, userId, reason, isAdmin);

    sendSuccess(res, { order }, 'Order cancelled successfully');
  } catch (error) {
    logger.error('Cancel order error:', error);
    sendError(
      res,
      error.message || 'Failed to cancel order',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Update shipping information (Admin only)
 */
export const updateShippingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const shippingData = req.body;

    const order = await orderService.updateShippingInfo(id, shippingData);

    sendSuccess(res, { order }, 'Shipping information updated successfully');
  } catch (error) {
    logger.error('Update shipping info error:', error);
    sendError(
      res,
      error.message || 'Failed to update shipping information',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

