/**
 * Feature Toggle API
 * Client-side API for feature flag management
 */

import apiClient from './client';

export interface FeatureToggle {
  featureKey: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  config: Record<string, any>;
  notes?: string | null;
  updatedAt?: string | null;
}

export interface FeatureToggleResponse {
  success: boolean;
  data: {
    features?: FeatureToggle[];
    feature?: FeatureToggle;
    enabledFeatures?: string[];
    results?: {
      enabled: FeatureToggle[];
      disabled: FeatureToggle[];
      errors: Array<{ featureKey: string; error: string }>;
    };
  };
  message?: string;
}

/**
 * Get all features with their status
 */
export const getAllFeatures = async (): Promise<FeatureToggle[]> => {
  const response = await apiClient.get<FeatureToggleResponse>('/features');
  return response.data.data.features || [];
};

/**
 * Get a specific feature
 */
export const getFeature = async (featureKey: string): Promise<FeatureToggle> => {
  const response = await apiClient.get<FeatureToggleResponse>(`/features/${featureKey}`);
  return response.data.data.feature!;
};

/**
 * Get enabled features only
 */
export const getEnabledFeatures = async (): Promise<string[]> => {
  const response = await apiClient.get<FeatureToggleResponse>('/features/enabled');
  return response.data.data.enabledFeatures || [];
};

/**
 * Get features by category
 */
export const getFeaturesByCategory = async (category: string): Promise<FeatureToggle[]> => {
  const response = await apiClient.get<FeatureToggleResponse>(`/features/category/${category}`);
  return response.data.data.features || [];
};

/**
 * Enable a feature (admin only)
 */
export const enableFeature = async (
  featureKey: string,
  config?: Record<string, any>,
  notes?: string
): Promise<FeatureToggle> => {
  const response = await apiClient.post<FeatureToggleResponse>(
    `/features/${featureKey}/enable`,
    { config, notes }
  );
  return response.data.data.feature!;
};

/**
 * Disable a feature (admin only)
 */
export const disableFeature = async (
  featureKey: string,
  notes?: string
): Promise<FeatureToggle> => {
  const response = await apiClient.post<FeatureToggleResponse>(
    `/features/${featureKey}/disable`,
    { notes }
  );
  return response.data.data.feature!;
};

/**
 * Toggle a feature (admin only)
 */
export const toggleFeature = async (
  featureKey: string,
  notes?: string
): Promise<FeatureToggle> => {
  const response = await apiClient.post<FeatureToggleResponse>(
    `/features/${featureKey}/toggle`,
    { notes }
  );
  return response.data.data.feature!;
};

/**
 * Update feature configuration (admin only)
 */
export const updateFeatureConfig = async (
  featureKey: string,
  config: Record<string, any>
): Promise<FeatureToggle> => {
  const response = await apiClient.put<FeatureToggleResponse>(
    `/features/${featureKey}/config`,
    { config }
  );
  return response.data.data.feature!;
};

/**
 * Batch update features (admin only)
 */
export const batchUpdateFeatures = async (
  features: Array<{
    featureKey: string;
    enabled: boolean;
    config?: Record<string, any>;
    notes?: string;
  }>
) => {
  const response = await apiClient.post<FeatureToggleResponse>('/features/batch', { features });
  return response.data.data.results!;
};



