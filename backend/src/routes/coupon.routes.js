import express from 'express';
import couponController from '../controllers/coupon.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { optionalFeature } from '../middleware/feature-toggle.middleware.js';
import { FEATURE_FLAGS } from '../config/feature-flags.js';

const router = express.Router();

/**
 * Coupon Routes
 * Public routes for validation, admin routes for management
 */

// Public route: Validate coupon (with optional feature check)
router.post(
  '/validate',
  optionalFeature(FEATURE_FLAGS.COUPONS),
  validate(validateCouponSchema),
  couponController.validateCoupon
);

// Admin-only routes (require authentication and admin role)
router.use(authenticate);
router.use(adminOnly);

// Get all coupons
router.get(
  '/',
  validate(couponQuerySchema, 'query'),
  couponController.getAllCoupons
);

// Get coupon by code
router.get('/code/:code', couponController.getCouponByCode);

// Get coupon by ID
router.get('/:id', couponController.getCouponById);

// Create coupon
router.post(
  '/',
  validate(createCouponSchema),
  couponController.createCoupon
);

// Update coupon
router.put(
  '/:id',
  validate(updateCouponSchema),
  couponController.updateCoupon
);

// Delete coupon
router.delete('/:id', couponController.deleteCoupon);

export default router;

