import featureToggleService from '../services/feature-toggle.service.js';
import { FEATURE_FLAGS } from '../config/feature-flags.js';
import { sendErrorResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Middleware to check if a feature is enabled
 * Usage: requireFeature('reviews')
 * 
 * @param {String} featureKey - Feature key to check
 * @returns {Function} Express middleware
 */
export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      // Get client ID from request (for multi-tenant, can be from user, subdomain, etc.)
      // For single-vendor, use null (global settings)
      const clientId = req.user?.clientId || req.clientId || null;

      // Check if feature is enabled
      const isEnabled = await featureToggleService.isFeatureEnabled(clientId, featureKey);

      if (!isEnabled) {
        logger.warn(`Feature ${featureKey} is disabled for client: ${clientId || 'global'}`);
        return sendErrorResponse(
          res,
          403,
          `Feature ${featureKey} is not enabled`,
          'FEATURE_DISABLED'
        );
      }

      // Attach feature status to request for use in controllers
      req.featureEnabled = req.featureEnabled || {};
      req.featureEnabled[featureKey] = true;

      next();
    } catch (error) {
      logger.error('Error checking feature:', error);
      return sendErrorResponse(
        res,
        500,
        'Error checking feature availability',
        'FEATURE_CHECK_ERROR'
      );
    }
  };
};

/**
 * Middleware to optionally check feature (doesn't block if disabled)
 * Usage: optionalFeature('reviews')
 * 
 * @param {String} featureKey - Feature key to check
 * @returns {Function} Express middleware
 */
export const optionalFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const clientId = req.user?.clientId || req.clientId || null;
      const isEnabled = await featureToggleService.isFeatureEnabled(clientId, featureKey);

      // Attach feature status to request
      req.featureEnabled = req.featureEnabled || {};
      req.featureEnabled[featureKey] = isEnabled;

      next();
    } catch (error) {
      logger.error('Error checking optional feature:', error);
      // Don't block on error, just mark as disabled
      req.featureEnabled = req.featureEnabled || {};
      req.featureEnabled[featureKey] = false;
      next();
    }
  };
};

/**
 * Middleware to load all enabled features for the client
 * Attaches req.enabledFeatures array
 * 
 * @returns {Function} Express middleware
 */
export const loadEnabledFeatures = () => {
  return async (req, res, next) => {
    try {
      const clientId = req.user?.clientId || req.clientId || null;
      const enabledFeatures = await featureToggleService.getEnabledFeatures(clientId);

      req.enabledFeatures = enabledFeatures;
      next();
    } catch (error) {
      logger.error('Error loading enabled features:', error);
      // Don't block on error, just set empty array
      req.enabledFeatures = [];
      next();
    }
  };
};

/**
 * Helper function to check feature in controllers
 * @param {Object} req - Express request object
 * @param {String} featureKey - Feature key
 * @returns {Boolean}
 */
export const isFeatureEnabled = (req, featureKey) => {
  return req.featureEnabled?.[featureKey] === true || false;
};

/**
 * Helper function to get all enabled features from request
 * @param {Object} req - Express request object
 * @returns {Array}
 */
export const getEnabledFeatures = (req) => {
  return req.enabledFeatures || [];
};

// Export feature flags for convenience
export { FEATURE_FLAGS };

