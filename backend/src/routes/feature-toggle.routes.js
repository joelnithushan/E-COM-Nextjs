import express from 'express';
import featureToggleController from '../controllers/feature-toggle.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = express.Router();

/**
 * Feature Toggle Routes
 * All routes require admin authentication
 */

// Get all features (public - for frontend to check)
router.get('/', featureToggleController.getAllFeatures);

// Get enabled features only (public)
router.get('/enabled', featureToggleController.getEnabledFeatures);

// Get features by category (public)
router.get('/category/:category', featureToggleController.getFeaturesByCategory);

// Get specific feature (public)
router.get('/:featureKey', featureToggleController.getFeature);

// Admin-only routes (require authentication and admin role)
router.use(authenticate);
router.use(adminOnly);

// Enable feature
router.post('/:featureKey/enable', featureToggleController.enableFeature);

// Disable feature
router.post('/:featureKey/disable', featureToggleController.disableFeature);

// Toggle feature
router.post('/:featureKey/toggle', featureToggleController.toggleFeature);

// Update feature configuration
router.put('/:featureKey/config', featureToggleController.updateFeatureConfig);

// Batch update features
router.post('/batch', featureToggleController.batchUpdateFeatures);

export default router;

