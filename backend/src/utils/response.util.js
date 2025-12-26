import { HTTP_STATUS } from '../config/constants.js';

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 */
export const sendSuccess = (res, data = null, message = null, statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 */
export const sendError = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) => {
  const response = {
    success: false,
    error: {
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

// Aliases for backward compatibility
export const sendSuccessResponse = (res, data = null, statusCode = HTTP_STATUS.OK, message = null) => {
  return sendSuccess(res, data, message, statusCode);
};

export const sendErrorResponse = (res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'An error occurred', errorCode = null, details = null) => {
  const errorDetails = details || {};
  if (errorCode) {
    errorDetails.code = errorCode;
  }
  return sendError(res, message, statusCode, Object.keys(errorDetails).length > 0 ? errorDetails : null);
};



