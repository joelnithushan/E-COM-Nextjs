import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Validate request against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} source - 'body', 'query', or 'params' (default: 'body')
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : source === 'params' ? req.params : req.body;
    
    const { error, value } = schema.validate(data, {
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

    // Replace data with validated and sanitized value
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }
    next();
  };
};

