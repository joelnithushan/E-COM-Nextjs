import express from 'express';
import analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { requireFeature } from '../middleware/feature-toggle.middleware.js';
import { FEATURE_FLAGS } from '../config/feature-flags.js';

const router = express.Router();

/**
 * Analytics Routes
 * All routes require admin authentication and analytics feature
 */

// All routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);
router.use(requireFeature(FEATURE_FLAGS.DASHBOARD_ANALYTICS));

// Get dashboard overview (all metrics)
router.get('/dashboard', analyticsController.getDashboardOverview);

// Get individual metrics
router.get('/revenue', analyticsController.getTotalRevenue);
router.get('/orders-per-day', analyticsController.getOrdersPerDay);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/recent-customers', analyticsController.getRecentCustomers);
router.get('/revenue-trends', analyticsController.getRevenueTrends);
router.get('/order-status', analyticsController.getOrderStatusBreakdown);

export default router;



