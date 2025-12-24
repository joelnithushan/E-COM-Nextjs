import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  updateShippingInfoSchema,
  orderQuerySchema,
} from '../validators/order.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/orders
 * @desc    Create order from cart
 * @access  Private
 */
router.post('/', validate(createOrderSchema), orderController.createOrder);

/**
 * @route   GET /api/v1/orders
 * @desc    Get user's orders (or all orders if admin)
 * @access  Private
 */
router.get(
  '/',
  validate(orderQuerySchema, 'query'),
  (req, res, next) => {
    // Route to different handlers based on role
    if (req.user.role === 'admin') {
      return orderController.getAllOrders(req, res, next);
    }
    return orderController.getUserOrders(req, res, next);
  }
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get single order
 * @access  Private (own order or admin)
 */
router.get('/:id', orderController.getOrder);

/**
 * @route   PUT /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin only)
 */
router.put(
  '/:id/status',
  adminOnly,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

/**
 * @route   PUT /api/v1/orders/:id/shipping
 * @desc    Update shipping information
 * @access  Private (Admin only)
 */
router.put(
  '/:id/shipping',
  adminOnly,
  validate(updateShippingInfoSchema),
  orderController.updateShippingInfo
);

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private (own order or admin)
 */
router.post(
  '/:id/cancel',
  validate(cancelOrderSchema),
  orderController.cancelOrder
);

export default router;

