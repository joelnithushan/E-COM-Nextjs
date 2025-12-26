/**
 * Logging Configuration
 * Centralized logging configuration with environment-based settings
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output (human-readable)
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Custom format for file output (JSON)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

/**
 * Get log level based on environment
 */
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return 'info'; // Only info and above in production
    case 'staging':
      return 'debug'; // More verbose in staging
    case 'development':
      return 'debug'; // Most verbose in development
    default:
      return 'info';
  }
};

/**
 * Get log directory
 */
const getLogDirectory = () => {
  return process.env.LOG_DIR || path.join(__dirname, '../../logs');
};

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const logLevel = getLogLevel();
  const logDir = getLogDirectory();
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Define transports
  const transports = [];

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        isDevelopment ? colorize() : winston.format.uncolorize(),
        consoleFormat
      ),
      handleExceptions: true,
      handleRejections: true,
    })
  );

  // File transports (only in production/staging)
  if (isProduction || process.env.ENABLE_FILE_LOGGING === 'true') {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true,
      })
    );

    // Combined log file (all levels)
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        level: logLevel,
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Access log (HTTP requests)
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'access.log'),
        level: 'info',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  // Create logger
  const logger = winston.createLogger({
    level: logLevel,
    format: fileFormat,
    defaultMeta: {
      service: 'ecommerce-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
    },
    transports,
    exitOnError: false, // Don't exit on handled exceptions
  });

  // Stream for HTTP request logging (morgan integration)
  logger.stream = {
    write: (message) => {
      logger.info(message.trim());
    },
  };

  return logger;
};

// Create and export logger instance
const logger = createLogger();

export default logger;

/**
 * Helper functions for structured logging
 */
export const logHelpers = {
  /**
   * Log API request
   */
  logRequest: (req, res, responseTime) => {
    logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?._id || null,
    });
  },

  /**
   * Log API error
   */
  logError: (error, req = null, additionalContext = {}) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: error.statusCode || 500,
      ...additionalContext,
    };

    if (req) {
      errorInfo.request = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?._id || null,
        body: sanitizeRequestBody(req.body),
        query: req.query,
        params: req.params,
      };
    }

    logger.error('API Error', errorInfo);
  },

  /**
   * Log database operation
   */
  logDatabase: (operation, collection, details = {}) => {
    logger.debug('Database Operation', {
      operation,
      collection,
      ...details,
    });
  },

  /**
   * Log authentication event
   */
  logAuth: (event, userId, details = {}) => {
    logger.info('Authentication Event', {
      event,
      userId,
      ...details,
    });
  },

  /**
   * Log payment event
   */
  logPayment: (event, orderId, details = {}) => {
    logger.info('Payment Event', {
      event,
      orderId,
      ...details,
    });
  },

  /**
   * Log business event
   */
  logBusiness: (event, details = {}) => {
    logger.info('Business Event', {
      event,
      ...details,
    });
  },
};

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
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
  ];

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}



