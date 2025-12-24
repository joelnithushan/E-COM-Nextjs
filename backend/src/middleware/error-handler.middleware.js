/**
 * Error Handler Middleware
 * Centralized error handling with logging and error tracking
 */

import { HTTP_STATUS } from '../config/constants.js';
import logger, { logHelpers } from '../config/logging.config.js';
import errorTrackingService from '../services/error-tracking.service.js';

/**
 * Error handler middleware
 * Must be used after all routes
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logHelpers.logError(err, req, {
    path: req.path,
    method: req.method,
  });

  // Track error in Sentry
  errorTrackingService.captureException(err, {
    userId: req.user?._id?.toString(),
    tags: {
      route: req.path,
      method: req.method,
    },
    extra: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Add validation errors if present
  if (err.validationErrors) {
    errorResponse.error.validationErrors = err.validationErrors;
  }

  // Add request ID for tracking (if available)
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  error.code = 'ROUTE_NOT_FOUND';

  logHelpers.logError(error, req);
  
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl,
    },
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Unhandled rejection handler
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
    });

    errorTrackingService.captureException(reason, {
      tags: {
        type: 'unhandledRejection',
      },
    });
  });
};

/**
 * Uncaught exception handler
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });

    errorTrackingService.captureException(error, {
      tags: {
        type: 'uncaughtException',
      },
    });

    // Exit process after logging (let process manager restart it)
    process.exit(1);
  });
};

/**
 * Initialize error handlers
 */
export const initializeErrorHandlers = () => {
  handleUnhandledRejection();
  handleUncaughtException();
  logger.info('Error handlers initialized');
};

