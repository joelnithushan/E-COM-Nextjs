/**
 * Frontend Error Tracking
 * Sentry integration for client-side error tracking
 * 
 * Note: Sentry is optional. If @sentry/nextjs is not installed,
 * this module will gracefully degrade to console logging.
 */

// Lazy-load Sentry (optional dependency)
let Sentry: any = null;
let sentryLoadAttempted = false;

const loadSentry = () => {
  if (sentryLoadAttempted) return Sentry;
  sentryLoadAttempted = true;
  
  try {
    // Try to load Sentry - it's optional
    Sentry = require('@sentry/nextjs');
  } catch {
    // Sentry not installed - that's okay, we'll use console logging
    Sentry = null;
  }
  
  return Sentry;
};

/**
 * Initialize Sentry for frontend
 */
export const initializeSentry = () => {
  const SentryModule = loadSentry();
  if (!SentryModule) {
    console.log('Sentry not initialized (package not installed)');
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

  // Only initialize in production/staging if DSN is provided
  if (!dsn || environment === 'development') {
    console.log('Sentry not initialized (development mode or DSN not provided)');
    return;
  }

  try {
    SentryModule.init({
      dsn,
      environment,
      release,
      
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      
      // Session replay (optional)
      replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      
      // Filter out health checks and static assets
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'NetworkError',
        'Failed to fetch',
      ],
      
      // Filter out specific URLs
      denyUrls: [
        /localhost/i,
        /127\.0\.0\.1/i,
      ],
      
      // Before send hook to sanitize data
      beforeSend(event, hint) {
        // Don't send events for localhost in development
        if (window.location.hostname === 'localhost') {
          return null;
        }
        
        // Sanitize sensitive data
        if (event.request?.cookies) {
          Object.keys(event.request.cookies).forEach((key) => {
            if (key.toLowerCase().includes('token') || key.toLowerCase().includes('session')) {
              event.request.cookies[key] = '[REDACTED]';
            }
          });
        }
        
        return event;
      },
      
      // Additional options
      maxBreadcrumbs: 50,
      attachStacktrace: true,
    });

    console.log('Sentry initialized successfully', { environment, release });
  } catch (error) {
    console.error('Failed to initialize Sentry', error);
  }
};

/**
 * Capture exception
 */
export const captureException = (error: Error, context?: {
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}) => {
  const SentryModule = loadSentry();
  if (!SentryModule || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error('Exception (Sentry not configured):', error, context);
    return;
  }

  SentryModule.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    SentryModule.captureException(error);
  });
};

/**
 * Capture message
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' | 'fatal' | 'debug' = 'info',
  context?: {
    userId?: string;
    tags?: Record<string, string>;
  }
) => {
  const SentryModule = loadSentry();
  if (!SentryModule || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  SentryModule.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    SentryModule.captureMessage(message, level);
  });
};

/**
 * Set user context
 */
export const setUserContext = (user: {
  id?: string;
  email?: string;
  name?: string;
}) => {
  const SentryModule = loadSentry();
  if (!SentryModule || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  SentryModule.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

/**
 * Clear user context
 */
export const clearUserContext = () => {
  const SentryModule = loadSentry();
  if (!SentryModule || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  SentryModule.setUser(null);
};

/**
 * Add breadcrumb
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' | 'fatal' | 'debug' = 'info',
  data?: Record<string, any>
) => {
  const SentryModule = loadSentry();
  if (!SentryModule || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  SentryModule.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export default {
  initializeSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
};



