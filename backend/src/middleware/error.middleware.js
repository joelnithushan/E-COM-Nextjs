import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import { sanitizeError } from './security.middleware.js';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Global error handling middleware
 * Prevents information disclosure in production
 */
export const errorHandler = (err, req, res, next) => {
  // Log full error details (server-side only)
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).reduce((acc, e) => {
      acc[e.path] = e.message;
      return acc;
    }, {});
    return sendError(res, 'Validation error', HTTP_STATUS.BAD_REQUEST, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendError(
      res,
      isProduction ? 'Duplicate entry' : `${field} already exists`,
      HTTP_STATUS.CONFLICT
    );
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return sendError(
      res,
      isProduction ? 'Invalid data format' : `Invalid ${err.path}: ${err.value}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'NotBeforeError') {
    return sendError(res, 'Token not active yet', HTTP_STATUS.UNAUTHORIZED);
  }

  // MongoDB connection errors
  if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    return sendError(
      res,
      isProduction ? 'Database error' : err.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  // Rate limit errors (handled by rate limiter, but catch here as fallback)
  if (err.statusCode === 429) {
    return sendError(res, 'Too many requests', HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  // Use sanitized error in production
  const sanitized = sanitizeError(err, isProduction);
  const statusCode = err.statusCode || sanitized.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = isProduction ? sanitized.message : (err.message || 'Internal server error');

  sendError(res, message, statusCode);
};

/**
 * Handle 404 errors
 */
export const notFound = (req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);
};


