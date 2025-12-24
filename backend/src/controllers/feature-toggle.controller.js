import featureToggleService from '../services/feature-toggle.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Feature Toggle Controller
 * Handles HTTP requests for feature flag management
 */
class FeatureToggleController {
  /**
   * Get all features with their status
   * GET /api/v1/features
   */
  getAllFeatures = async (req, res) => {
    try {
      const clientId = req.user?.clientId || req.clientId || null;
      const features = await featureToggleService.getAllFeatures(clientId);

      return sendSuccessResponse(res, { features }, 200);
    } catch (error) {
      logger.error('Error getting all features:', error);
      return sendErrorResponse(
        res,
        500,
        'Failed to retrieve features',
        'FEATURES_FETCH_ERROR'
      );
    }
  };

  /**
   * Get a specific feature
   * GET /api/v1/features/:featureKey
   */
  getFeature = async (req, res) => {
    try {
      const { featureKey } = req.params;
      const clientId = req.user?.clientId || req.clientId || null;

      const feature = await featureToggleService.getFeature(clientId, featureKey);

      return sendSuccessResponse(res, { feature }, 200);
    } catch (error) {
      logger.error('Error getting feature:', error);
      return sendErrorResponse(
        res,
        error.message.includes('Invalid') ? 400 : 500,
        error.message || 'Failed to retrieve feature',
        'FEATURE_FETCH_ERROR'
      );
    }
  };

  /**
   * Get enabled features only
   * GET /api/v1/features/enabled
   */
  getEnabledFeatures = async (req, res) => {
    try {
      const clientId = req.user?.clientId || req.clientId || null;
      const enabledFeatures = await featureToggleService.getEnabledFeatures(clientId);

      return sendSuccessResponse(res, { enabledFeatures }, 200);
    } catch (error) {
      logger.error('Error getting enabled features:', error);
      return sendErrorResponse(
        res,
        500,
        'Failed to retrieve enabled features',
        'ENABLED_FEATURES_FETCH_ERROR'
      );
    }
  };

  /**
   * Enable a feature
   * POST /api/v1/features/:featureKey/enable
   */
  enableFeature = async (req, res) => {
    try {
      const { featureKey } = req.params;
      const { config, notes } = req.body;
      const clientId = req.user?.clientId || req.clientId || null;
      const userId = req.user?._id;

      if (!userId) {
        return sendErrorResponse(res, 401, 'Authentication required', 'UNAUTHORIZED');
      }

      const toggle = await featureToggleService.enableFeature(
        clientId,
        featureKey,
        userId,
        config || {},
        notes || null
      );

      return sendSuccessResponse(
        res,
        { feature: toggle },
        200,
        `Feature ${featureKey} enabled successfully`
      );
    } catch (error) {
      logger.error('Error enabling feature:', error);
      return sendErrorResponse(
        res,
        error.message.includes('Invalid') ? 400 : 500,
        error.message || 'Failed to enable feature',
        'FEATURE_ENABLE_ERROR'
      );
    }
  };

  /**
   * Disable a feature
   * POST /api/v1/features/:featureKey/disable
   */
  disableFeature = async (req, res) => {
    try {
      const { featureKey } = req.params;
      const { notes } = req.body;
      const clientId = req.user?.clientId || req.clientId || null;
      const userId = req.user?._id;

      if (!userId) {
        return sendErrorResponse(res, 401, 'Authentication required', 'UNAUTHORIZED');
      }

      const toggle = await featureToggleService.disableFeature(
        clientId,
        featureKey,
        userId,
        notes || null
      );

      return sendSuccessResponse(
        res,
        { feature: toggle },
        200,
        `Feature ${featureKey} disabled successfully`
      );
    } catch (error) {
      logger.error('Error disabling feature:', error);
      return sendErrorResponse(
        res,
        error.message.includes('Invalid') ? 400 : 500,
        error.message || 'Failed to disable feature',
        'FEATURE_DISABLE_ERROR'
      );
    }
  };

  /**
   * Toggle a feature (enable if disabled, disable if enabled)
   * POST /api/v1/features/:featureKey/toggle
   */
  toggleFeature = async (req, res) => {
    try {
      const { featureKey } = req.params;
      const { notes } = req.body;
      const clientId = req.user?.clientId || req.clientId || null;
      const userId = req.user?._id;

      if (!userId) {
        return sendErrorResponse(res, 401, 'Authentication required', 'UNAUTHORIZED');
      }

      const toggle = await featureToggleService.toggleFeature(
        clientId,
        featureKey,
        userId,
        notes || null
      );

      return sendSuccessResponse(
        res,
        { feature: toggle },
        200,
        `Feature ${featureKey} toggled successfully`
      );
    } catch (error) {
      logger.error('Error toggling feature:', error);
      return sendErrorResponse(
        res,
        error.message.includes('Invalid') ? 400 : 500,
        error.message || 'Failed to toggle feature',
        'FEATURE_TOGGLE_ERROR'
      );
    }
  };

  /**
   * Update feature configuration
   * PUT /api/v1/features/:featureKey/config
   */
  updateFeatureConfig = async (req, res) => {
    try {
      const { featureKey } = req.params;
      const { config } = req.body;
      const clientId = req.user?.clientId || req.clientId || null;

      if (!config || typeof config !== 'object') {
        return sendErrorResponse(res, 400, 'Config must be an object', 'INVALID_CONFIG');
      }

      const toggle = await featureToggleService.updateFeatureConfig(
        clientId,
        featureKey,
        config
      );

      return sendSuccessResponse(
        res,
        { feature: toggle },
        200,
        `Feature ${featureKey} configuration updated successfully`
      );
    } catch (error) {
      logger.error('Error updating feature config:', error);
      return sendErrorResponse(
        res,
        error.message.includes('Invalid') ? 400 : 500,
        error.message || 'Failed to update feature configuration',
        'FEATURE_CONFIG_UPDATE_ERROR'
      );
    }
  };

  /**
   * Batch update features
   * POST /api/v1/features/batch
   */
  batchUpdateFeatures = async (req, res) => {
    try {
      const { features } = req.body;
      const clientId = req.user?.clientId || req.clientId || null;
      const userId = req.user?._id;

      if (!userId) {
        return sendErrorResponse(res, 401, 'Authentication required', 'UNAUTHORIZED');
      }

      if (!Array.isArray(features) || features.length === 0) {
        return sendErrorResponse(
          res,
          400,
          'Features must be a non-empty array',
          'INVALID_FEATURES'
        );
      }

      const results = await featureToggleService.batchUpdateFeatures(
        clientId,
        features,
        userId
      );

      return sendSuccessResponse(
        res,
        { results },
        200,
        'Features updated successfully'
      );
    } catch (error) {
      logger.error('Error batch updating features:', error);
      return sendErrorResponse(
        res,
        500,
        error.message || 'Failed to batch update features',
        'FEATURE_BATCH_UPDATE_ERROR'
      );
    }
  };

  /**
   * Get features by category
   * GET /api/v1/features/category/:category
   */
  getFeaturesByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      const clientId = req.user?.clientId || req.clientId || null;

      const features = await featureToggleService.getFeaturesByCategory(clientId, category);

      return sendSuccessResponse(res, { features }, 200);
    } catch (error) {
      logger.error('Error getting features by category:', error);
      return sendErrorResponse(
        res,
        500,
        'Failed to retrieve features by category',
        'FEATURES_BY_CATEGORY_ERROR'
      );
    }
  };
}

export default new FeatureToggleController();

