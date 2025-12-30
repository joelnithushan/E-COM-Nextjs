import express from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = express.Router();

/**
 * Admin Routes
 * All routes require admin authentication
 */

// All routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;

