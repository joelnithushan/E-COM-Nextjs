import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Validate request against Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        const field = detail.path.join('.');
        acc[field] = detail.message;
        return acc;
      }, {});

      return sendError(
        res,
        'Validation failed',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        errors
      );
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

