/**
 * Frontend Configuration
 * Centralized configuration with environment-based defaults
 * 
 * Note: Only NEXT_PUBLIC_* variables are exposed to the browser
 * All other environment variables are server-side only
 */

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
const isStaging = NODE_ENV === 'staging';
const isProduction = NODE_ENV === 'production';

/**
 * Validate required environment variables
 */
const validateEnv = () => {
  // Only require API URL and version - Stripe is optional
  const required = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_API_VERSION',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables:`);
    missing.forEach((key) => console.error(`   - ${key}`));
    if (isProduction) {
      // In production, log error but don't throw to allow graceful degradation
      console.error('⚠️  Missing required environment variables - some features may not work');
    } else {
      console.warn('⚠️  Continuing with missing variables (not recommended)');
    }
  }
  
  // Warn about optional but recommended variables
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set - payment features will not work');
  }
};

// Validate on module load
if (typeof window === 'undefined') {
  // Only validate on server-side
  validateEnv();
}

/**
 * Application Configuration
 */
const config = {
  // Environment
  env: NODE_ENV,
  isDevelopment,
  isStaging,
  isProduction,

  // API Configuration
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10), // 30 seconds
  },

  // Stripe Configuration
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },

  // Frontend URL
  frontend: {
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableErrorTracking: process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING === 'true',
    enableDebugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || isDevelopment,
  },

  // Analytics (if enabled)
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || '',
    mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
  },

  // Error Tracking (if enabled)
  errorTracking: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  },

  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'E-Commerce',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Single-vendor e-commerce platform',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
};

// Validate production settings
if (isProduction) {
  if (!config.stripe.publishableKey || !config.stripe.publishableKey.startsWith('pk_live_')) {
    console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a live key in production');
  }

  if (!config.api.url.startsWith('https://')) {
    console.error('❌ NEXT_PUBLIC_API_URL must use HTTPS in production');
  }
}

export default config;

// Export individual config sections for convenience
export const { api, stripe, frontend, features, analytics, errorTracking, app } = config;



