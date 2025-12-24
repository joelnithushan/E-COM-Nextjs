import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Check if user has required role(s)
 * @param {...String} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        'You do not have permission to access this resource',
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

// Convenience middleware for admin only
export const adminOnly = authorize(USER_ROLES.ADMIN);

// Convenience middleware for customer only
export const customerOnly = authorize(USER_ROLES.CUSTOMER);

