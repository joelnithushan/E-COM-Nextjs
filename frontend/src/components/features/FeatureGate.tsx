/**
 * FeatureGate Component
 * Conditionally renders children based on feature availability
 */

'use client';

import { ReactNode } from 'react';
import { useFeature } from '@/hooks/useFeatureToggle';

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
  loadingComponent?: ReactNode;
}

/**
 * FeatureGate - Conditionally render content based on feature flag
 * 
 * @example
 * <FeatureGate featureKey="reviews">
 *   <ReviewSection />
 * </FeatureGate>
 */
export const FeatureGate = ({
  featureKey,
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = null,
}: FeatureGateProps) => {
  const { enabled, isLoading } = useFeature(featureKey);

  if (isLoading && showLoading) {
    return <>{loadingComponent}</>;
  }

  if (isLoading && !showLoading) {
    return null;
  }

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * FeatureGate with multiple features (all must be enabled)
 */
interface MultiFeatureGateProps {
  featureKeys: string[];
  children: ReactNode;
  fallback?: ReactNode;
  mode?: 'all' | 'any'; // 'all' = all features must be enabled, 'any' = at least one
}

export const MultiFeatureGate = ({
  featureKeys,
  children,
  fallback = null,
  mode = 'all',
}: MultiFeatureGateProps) => {
  const features = featureKeys.map((key) => useFeature(key));
  const isLoading = features.some((f) => f.isLoading);
  const allEnabled = features.every((f) => f.enabled);
  const anyEnabled = features.some((f) => f.enabled);

  if (isLoading) {
    return null;
  }

  const shouldRender = mode === 'all' ? allEnabled : anyEnabled;

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};



