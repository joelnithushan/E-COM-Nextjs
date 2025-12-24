/**
 * Error Tracking Service
 * Centralized error tracking with Sentry integration
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import logger from '../config/logging.config.js';

/**
 * Initialize Sentry error tracking
 */
export const initializeSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.APP_VERSION || '1.0.0';

  // Only initialize in production/staging if DSN is provided
  if (!dsn || environment === 'development') {
    logger.info('Sentry not initialized (development mode or DSN not provided)');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in staging
      
      // Profiling (optional, requires @sentry/profiling-node)
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      integrations: [
        new ProfilingIntegration(),
      ],
      
      // Filter out health check endpoints
      ignoreErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
      ],
      
      // Filter out specific routes
      beforeSend(event, hint) {
        // Don't send events for health checks
        if (event.request?.url?.includes('/health')) {
          return null;
        }
        
        // Sanitize sensitive data
        if (event.request?.data) {
          event.request.data = sanitizeSensitiveData(event.request.data);
        }
        
        return event;
      },
      
      // Additional options
      maxBreadcrumbs: 50,
      attachStacktrace: true,
    });

    logger.info('Sentry initialized successfully', { environment, release });
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error: error.message });
  }
};

/**
 * Capture exception
 */
export const captureException = (error, context = {}) => {
  if (!process.env.SENTRY_DSN) {
    logger.error('Exception (Sentry not configured)', {
      error: error.message,
      stack: error.stack,
      ...context,
    });
    return;
  }

  Sentry.withScope((scope) => {
    // Add context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
};

/**
 * Capture message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!process.env.SENTRY_DSN) {
    logger.log(level, message, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: user._id?.toString() || user.id,
    email: user.email,
    username: user.name,
  });
};

/**
 * Clear user context
 */
export const clearUserContext = () => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message, category, level = 'info', data = {}) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Sanitize sensitive data before sending to Sentry
 */
function sanitizeSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'creditCard',
    'cvv',
    'cardNumber',
    'ssn',
    'apiKey',
    'secret',
    'stripeSecretKey',
    'stripePublishableKey',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  });

  return sanitized;
}

export default {
  initializeSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
};

