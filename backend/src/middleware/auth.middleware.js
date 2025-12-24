import { verifyToken, generateTokenPayload } from '../utils/jwt.util.js';
import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import User from '../models/User.js';

/**
 * Verify JWT access token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, 'User not found', HTTP_STATUS.UNAUTHORIZED);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return sendError(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
    } else if (error.message === 'Invalid token') {
      return sendError(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }

    return sendError(res, 'Authentication failed', HTTP_STATUS.UNAUTHORIZED);
  }
};


