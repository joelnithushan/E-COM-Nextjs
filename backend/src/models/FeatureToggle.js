import mongoose from 'mongoose';
import { FEATURE_FLAGS, FEATURE_METADATA } from '../config/feature-flags.js';

/**
 * FeatureToggle Model
 * Stores feature flags per client/tenant
 * 
 * For single-vendor: clientId can be null (global settings)
 * For multi-tenant: clientId identifies the tenant
 */
const featureToggleSchema = new mongoose.Schema(
  {
    // Client/Tenant identifier (null for global/single-vendor)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    
    // Feature key (from FEATURE_FLAGS)
    featureKey: {
      type: String,
      required: [true, 'Feature key is required'],
      enum: {
        values: Object.values(FEATURE_FLAGS),
        message: 'Invalid feature key',
      },
      index: true,
    },
    
    // Feature enabled/disabled
    enabled: {
      type: Boolean,
      default: false,
    },
    
    // Optional configuration for the feature
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Metadata
    enabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    enabledAt: {
      type: Date,
    },
    disabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disabledAt: {
      type: Date,
    },
    
    // Notes/description
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Compound index for client + feature lookup
featureToggleSchema.index({ clientId: 1, featureKey: 1 }, { unique: true });

// Index for enabled features query
featureToggleSchema.index({ clientId: 1, enabled: 1 });

// Index for feature key lookup
featureToggleSchema.index({ featureKey: 1, enabled: 1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get feature toggle for a client
 * @param {String|ObjectId|null} clientId - Client ID (null for global)
 * @param {String} featureKey - Feature key
 * @returns {Promise<Object|null>}
 */
featureToggleSchema.statics.getFeature = async function (clientId, featureKey) {
  const toggle = await this.findOne({
    clientId: clientId || null,
    featureKey,
  }).lean();

  // If no toggle exists, return default from metadata
  if (!toggle) {
    const metadata = FEATURE_METADATA[featureKey];
    return {
      featureKey,
      enabled: metadata?.defaultEnabled || false,
      config: {},
    };
  }

  return toggle;
};

/**
 * Check if feature is enabled
 * @param {String|ObjectId|null} clientId - Client ID
 * @param {String} featureKey - Feature key
 * @returns {Promise<Boolean>}
 */
featureToggleSchema.statics.isFeatureEnabled = async function (clientId, featureKey) {
  const toggle = await this.getFeature(clientId, featureKey);
  return toggle.enabled === true;
};

/**
 * Get all enabled features for a client
 * @param {String|ObjectId|null} clientId - Client ID
 * @returns {Promise<Array>}
 */
featureToggleSchema.statics.getEnabledFeatures = async function (clientId) {
  const toggles = await this.find({
    clientId: clientId || null,
    enabled: true,
  })
    .select('featureKey enabled config')
    .lean();

  return toggles.map((t) => t.featureKey);
};

/**
 * Get all features with their status
 * @param {String|ObjectId|null} clientId - Client ID
 * @returns {Promise<Array>}
 */
featureToggleSchema.statics.getAllFeatures = async function (clientId) {
  const toggles = await this.find({
    clientId: clientId || null,
  })
    .select('featureKey enabled config notes updatedAt')
    .lean();

  // Create a map of existing toggles
  const toggleMap = new Map(
    toggles.map((t) => [t.featureKey, t])
  );

  // Return all features with their status
  return Object.values(FEATURE_FLAGS).map((featureKey) => {
    const toggle = toggleMap.get(featureKey);
    const metadata = FEATURE_METADATA[featureKey];

    return {
      featureKey,
      name: metadata?.name || featureKey,
      description: metadata?.description || '',
      category: metadata?.category || 'other',
      enabled: toggle?.enabled ?? (metadata?.defaultEnabled || false),
      config: toggle?.config || {},
      notes: toggle?.notes || null,
      updatedAt: toggle?.updatedAt || null,
    };
  });
};

/**
 * Enable a feature
 * @param {String|ObjectId|null} clientId - Client ID
 * @param {String} featureKey - Feature key
 * @param {ObjectId} userId - User enabling the feature
 * @param {Object} config - Optional configuration
 * @param {String} notes - Optional notes
 * @returns {Promise<Object>}
 */
featureToggleSchema.statics.enableFeature = async function (
  clientId,
  featureKey,
  userId,
  config = {},
  notes = null
) {
  const toggle = await this.findOneAndUpdate(
    {
      clientId: clientId || null,
      featureKey,
    },
    {
      $set: {
        enabled: true,
        config,
        notes,
        enabledBy: userId,
        enabledAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  return toggle;
};

/**
 * Disable a feature
 * @param {String|ObjectId|null} clientId - Client ID
 * @param {String} featureKey - Feature key
 * @param {ObjectId} userId - User disabling the feature
 * @param {String} notes - Optional notes
 * @returns {Promise<Object>}
 */
featureToggleSchema.statics.disableFeature = async function (
  clientId,
  featureKey,
  userId,
  notes = null
) {
  const toggle = await this.findOneAndUpdate(
    {
      clientId: clientId || null,
      featureKey,
    },
    {
      $set: {
        enabled: false,
        disabledBy: userId,
        disabledAt: new Date(),
        notes,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  return toggle;
};

/**
 * Update feature configuration
 * @param {String|ObjectId|null} clientId - Client ID
 * @param {String} featureKey - Feature key
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>}
 */
featureToggleSchema.statics.updateFeatureConfig = async function (
  clientId,
  featureKey,
  config
) {
  const toggle = await this.findOneAndUpdate(
    {
      clientId: clientId || null,
      featureKey,
    },
    {
      $set: { config },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  return toggle;
};

const FeatureToggle = mongoose.model('FeatureToggle', featureToggleSchema);

export default FeatureToggle;



