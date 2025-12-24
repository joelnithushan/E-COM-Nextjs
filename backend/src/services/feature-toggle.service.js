import FeatureToggle from '../models/FeatureToggle.js';
import { FEATURE_FLAGS, FEATURE_METADATA } from '../config/feature-flags.js';
import { logger } from '../utils/logger.util.js';

/**
 * Feature Toggle Service
 * Business logic for managing feature flags
 */
class FeatureToggleService {
  /**
   * Get feature status for a client
   * @param {String|ObjectId|null} clientId - Client ID (null for global)
   * @param {String} featureKey - Feature key
   * @returns {Promise<Object>}
   */
  async getFeature(clientId, featureKey) {
    try {
      // Validate feature key
      if (!Object.values(FEATURE_FLAGS).includes(featureKey)) {
        throw new Error(`Invalid feature key: ${featureKey}`);
      }

      const toggle = await FeatureToggle.getFeature(clientId, featureKey);
      const metadata = FEATURE_METADATA[featureKey];

      return {
        featureKey,
        name: metadata?.name || featureKey,
        description: metadata?.description || '',
        category: metadata?.category || 'other',
        enabled: toggle.enabled,
        config: toggle.config || {},
        metadata: metadata || null,
      };
    } catch (error) {
      logger.error('Error getting feature:', error);
      throw error;
    }
  }

  /**
   * Check if feature is enabled
   * @param {String|ObjectId|null} clientId - Client ID
   * @param {String} featureKey - Feature key
   * @returns {Promise<Boolean>}
   */
  async isFeatureEnabled(clientId, featureKey) {
    try {
      return await FeatureToggle.isFeatureEnabled(clientId, featureKey);
    } catch (error) {
      logger.error('Error checking feature:', error);
      // Default to false on error
      return false;
    }
  }

  /**
   * Get all features with their status
   * @param {String|ObjectId|null} clientId - Client ID
   * @returns {Promise<Array>}
   */
  async getAllFeatures(clientId) {
    try {
      return await FeatureToggle.getAllFeatures(clientId);
    } catch (error) {
      logger.error('Error getting all features:', error);
      throw error;
    }
  }

  /**
   * Get enabled features only
   * @param {String|ObjectId|null} clientId - Client ID
   * @returns {Promise<Array>}
   */
  async getEnabledFeatures(clientId) {
    try {
      return await FeatureToggle.getEnabledFeatures(clientId);
    } catch (error) {
      logger.error('Error getting enabled features:', error);
      throw error;
    }
  }

  /**
   * Enable a feature
   * @param {String|ObjectId|null} clientId - Client ID
   * @param {String} featureKey - Feature key
   * @param {ObjectId} userId - User enabling the feature
   * @param {Object} config - Optional configuration
   * @param {String} notes - Optional notes
   * @returns {Promise<Object>}
   */
  async enableFeature(clientId, featureKey, userId, config = {}, notes = null) {
    try {
      // Validate feature key
      if (!Object.values(FEATURE_FLAGS).includes(featureKey)) {
        throw new Error(`Invalid feature key: ${featureKey}`);
      }

      const toggle = await FeatureToggle.enableFeature(
        clientId,
        featureKey,
        userId,
        config,
        notes
      );

      logger.info(`Feature enabled: ${featureKey} for client: ${clientId || 'global'}`);

      return toggle;
    } catch (error) {
      logger.error('Error enabling feature:', error);
      throw error;
    }
  }

  /**
   * Disable a feature
   * @param {String|ObjectId|null} clientId - Client ID
   * @param {String} featureKey - Feature key
   * @param {ObjectId} userId - User disabling the feature
   * @param {String} notes - Optional notes
   * @returns {Promise<Object>}
   */
  async disableFeature(clientId, featureKey, userId, notes = null) {
    try {
      // Validate feature key
      if (!Object.values(FEATURE_FLAGS).includes(featureKey)) {
        throw new Error(`Invalid feature key: ${featureKey}`);
      }

      const toggle = await FeatureToggle.disableFeature(
        clientId,
        featureKey,
        userId,
        notes
      );

      logger.info(`Feature disabled: ${featureKey} for client: ${clientId || 'global'}`);

      return toggle;
    } catch (error) {
      logger.error('Error disabling feature:', error);
      throw error;
    }
  }

  /**
   * Toggle a feature (enable if disabled, disable if enabled)
   * @param {String|ObjectId|null} clientId - Client ID
   * @param {String} featureKey - Feature key
   * @param {ObjectId} userId - User toggling the feature
   * @param {String} notes - Optional notes
   * @returns {Promise<Object>}
   */
  async toggleFeature(clientId, featureKey, userId, notes = null) {
    try {
      const isEnabled = await this.isFeatureEnabled(clientId, featureKey);

      if (isEnabled) {
        return await this.disableFeature(clientId, featureKey, userId, notes);
      } else {
        return await this.enableFeature(clientId, featureKey, userId, {}, notes);
      }
    } catch (error) {
      logger.error('Error toggling feature:', error);
      throw error;
    }
  }

  /**
   * Update feature configuration
   * @param {String|ObjectId|null} clientId - Client ID
   * @param {String} featureKey - Feature key
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>}
   */
  async updateFeatureConfig(clientId, featureKey, config) {
    try {
      // Validate feature key
      if (!Object.values(FEATURE_FLAGS).includes(featureKey)) {
        throw new Error(`Invalid feature key: ${featureKey}`);
      }

      const toggle = await FeatureToggle.updateFeatureConfig(
        clientId,
        featureKey,
        config
      );

      logger.info(`Feature config updated: ${featureKey} for client: ${clientId || 'global'}`);

      return toggle;
    } catch (error) {
      logger.error('Error updating feature config:', error);
      throw error;
    }
  }

  /**
   * Batch enable/disable features
   * @param {String|ObjectId|null} clientId - Client ID
   * @param {Array} features - Array of {featureKey, enabled, config, notes}
   * @param {ObjectId} userId - User making the changes
   * @returns {Promise<Object>}
   */
  async batchUpdateFeatures(clientId, features, userId) {
    try {
      const results = {
        enabled: [],
        disabled: [],
        errors: [],
      };

      for (const feature of features) {
        try {
          if (feature.enabled) {
            const toggle = await this.enableFeature(
              clientId,
              feature.featureKey,
              userId,
              feature.config || {},
              feature.notes || null
            );
            results.enabled.push(toggle);
          } else {
            const toggle = await this.disableFeature(
              clientId,
              feature.featureKey,
              userId,
              feature.notes || null
            );
            results.disabled.push(toggle);
          }
        } catch (error) {
          results.errors.push({
            featureKey: feature.featureKey,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error batch updating features:', error);
      throw error;
    }
  }

  /**
   * Get features by category
   * @param {String|ObjectId|null} clientId - Client ID
   * @param {String} category - Category name
   * @returns {Promise<Array>}
   */
  async getFeaturesByCategory(clientId, category) {
    try {
      const allFeatures = await this.getAllFeatures(clientId);
      return allFeatures.filter((f) => f.category === category);
    } catch (error) {
      logger.error('Error getting features by category:', error);
      throw error;
    }
  }
}

export default new FeatureToggleService();

