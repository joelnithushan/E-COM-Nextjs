import mongoSanitize from 'express-mongo-sanitize';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Sanitize MongoDB queries to prevent NoSQL injection
 * Removes $ and . operators from user input
 */
export const sanitizeMongo = mongoSanitize({
  replaceWith: '_', // Replace dangerous characters with underscore
  onSanitize: ({ req, key }) => {
    // Log sanitization attempts (security monitoring)
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want to log this to a security monitoring service
      console.warn(`Sanitized MongoDB injection attempt: ${key} in ${req.path}`);
    }
  },
});

/**
 * Validate MongoDB ObjectId format
 */
export const validateObjectId = (field = 'id') => {
  return param(field).isMongoId().withMessage(`Invalid ${field} format`);
};

/**
 * Sanitize and validate ObjectId from query params
 */
export const sanitizeObjectId = (field = 'id') => {
  return [
    query(field).optional().isMongoId().withMessage(`Invalid ${field} format`),
    sanitizeMongo,
  ];
};

/**
 * Sanitize string inputs (remove HTML, trim, escape)
 */
export const sanitizeString = (field, options = {}) => {
  const { min, max, optional = false } = options;
  let validator = body(field);

  if (optional) {
    validator = validator.optional();
  }

  validator = validator
    .trim()
    .escape() // Escape HTML entities
    .stripLow() // Remove control characters
    .blacklist('<>'); // Remove HTML tags

  if (min !== undefined) {
    validator = validator.isLength({ min }).withMessage(`${field} must be at least ${min} characters`);
  }

  if (max !== undefined) {
    validator = validator.isLength({ max }).withMessage(`${field} must be at most ${max} characters`);
  }

  return validator;
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (field = 'email', optional = false) => {
  let validator = body(field);

  if (optional) {
    validator = validator.optional();
  }

  return validator
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email format')
    .isLength({ max: 255 })
    .withMessage('Email must be at most 255 characters');
};

/**
 * Sanitize password input
 */
export const sanitizePassword = (field = 'password', options = {}) => {
  const { min = 8, max = 128, requireUppercase = true, requireLowercase = true, requireNumbers = true } = options;

  let validator = body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`Password must be between ${min} and ${max} characters`);

  if (requireUppercase) {
    validator = validator.matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter');
  }

  if (requireLowercase) {
    validator = validator.matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter');
  }

  if (requireNumbers) {
    validator = validator.matches(/\d/)
      .withMessage('Password must contain at least one number');
  }

  validator = validator.matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character');

  return validator;
};

/**
 * Sanitize numeric inputs
 */
export const sanitizeNumber = (field, options = {}) => {
  const { min, max, optional = false, isInt = false } = options;
  let validator = body(field);

  if (optional) {
    validator = validator.optional();
  }

  if (isInt) {
    validator = validator.isInt().withMessage(`${field} must be an integer`);
  } else {
    validator = validator.isFloat().withMessage(`${field} must be a number`);
  }

  if (min !== undefined) {
    validator = validator.custom((value) => {
      if (value < min) {
        throw new Error(`${field} must be at least ${min}`);
      }
      return true;
    });
  }

  if (max !== undefined) {
    validator = validator.custom((value) => {
      if (value > max) {
        throw new Error(`${field} must be at most ${max}`);
      }
      return true;
    });
  }

  return validator;
};

/**
 * Sanitize pagination parameters
 */
export const sanitizePagination = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ];
};

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      const field = error.path || error.param;
      acc[field] = error.msg;
      return acc;
    }, {});

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formattedErrors,
      },
    });
  }
  next();
};

/**
 * Prevent information disclosure in error messages
 */
export const sanitizeError = (error, isProduction = false) => {
  // In production, don't expose internal error details
  if (isProduction) {
    // Generic error messages
    if (error.name === 'ValidationError') {
      return { message: 'Validation error', statusCode: 400 };
    }
    if (error.name === 'CastError') {
      return { message: 'Invalid data format', statusCode: 400 };
    }
    if (error.code === 11000) {
      return { message: 'Duplicate entry', statusCode: 409 };
    }
    // Default production error
    return { message: 'An error occurred', statusCode: 500 };
  }

  // In development, show more details
  return {
    message: error.message || 'Internal server error',
    statusCode: error.statusCode || 500,
    stack: error.stack,
  };
};


