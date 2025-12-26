/**
 * Request Logger Middleware
 * Logs HTTP requests with timing and context
 */

import logger, { logHelpers } from '../config/logging.config.js';
import errorTrackingService from '../services/error-tracking.service.js';

/**
 * Request logger middleware
 * Logs incoming requests with timing information
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Add request ID for tracking
  req.id = req.headers['x-request-id'] || generateRequestId();

  // Set user context for error tracking
  if (req.user) {
    errorTrackingService.setUserContext(req.user);
  }

  // Add breadcrumb for request
  errorTrackingService.addBreadcrumb(
    `${req.method} ${req.originalUrl}`,
    'http',
    'info',
    {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    }
  );

  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // Log request
    logHelpers.logRequest(req, res, responseTime);

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}



