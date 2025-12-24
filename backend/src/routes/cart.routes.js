import express from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  addItemSchema,
  updateItemQuantitySchema,
} from '../validators/cart.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/items',
  validate(addItemSchema),
  cartController.addItem
);

/**
 * @route   PUT /api/v1/cart/items/:itemId
 * @desc    Update item quantity
 * @access  Private
 */
router.put(
  '/items/:itemId',
  validate(updateItemQuantitySchema),
  cartController.updateItemQuantity
);

/**
 * @route   DELETE /api/v1/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/items/:itemId', cartController.removeItem);

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear cart
 * @access  Private
 */
router.delete('/', cartController.clearCart);

/**
 * @route   GET /api/v1/cart/summary
 * @desc    Get cart summary for checkout
 * @access  Private
 */
router.get('/summary', cartController.getCartSummary);

export default router;

