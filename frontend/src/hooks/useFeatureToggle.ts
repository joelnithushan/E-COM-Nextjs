/**
 * Feature Toggle Hook
 * React hook for checking feature availability
 */

import { useState, useEffect, useCallback } from 'react';
import { getEnabledFeatures, getFeature, type FeatureToggle } from '@/lib/api/feature-toggle.api';

interface UseFeatureToggleReturn {
  isEnabled: (featureKey: string) => boolean;
  isLoading: boolean;
  error: Error | null;
  enabledFeatures: string[];
  refresh: () => Promise<void>;
}

/**
 * Hook to check if features are enabled
 * @param featureKeys - Optional array of feature keys to preload
 * @returns Object with isEnabled function and state
 */
export const useFeatureToggle = (
  featureKeys?: string[]
): UseFeatureToggleReturn => {
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFeatures = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const features = await getEnabledFeatures();
      setEnabledFeatures(features);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load features'));
      // On error, assume all features are disabled
      setEnabledFeatures([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const isEnabled = useCallback(
    (featureKey: string): boolean => {
      return enabledFeatures.includes(featureKey);
    },
    [enabledFeatures]
  );

  return {
    isEnabled,
    isLoading,
    error,
    enabledFeatures,
    refresh: loadFeatures,
  };
};

/**
 * Hook to check a specific feature
 * @param featureKey - Feature key to check
 * @returns Object with enabled status and loading state
 */
export const useFeature = (featureKey: string) => {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const feature = await getFeature(featureKey);
        setEnabled(feature.enabled);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check feature'));
        setEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeature();
  }, [featureKey]);

  return { enabled, isLoading, error };
};

/**
 * Higher-order component to conditionally render based on feature
 */
export const withFeature = <P extends object>(
  Component: React.ComponentType<P>,
  featureKey: string,
  FallbackComponent?: React.ComponentType<P>
) => {
  return (props: P) => {
    const { enabled, isLoading } = useFeature(featureKey);

    if (isLoading) {
      return null; // Or a loading spinner
    }

    if (!enabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }

    return <Component {...props} />;
  };
};



