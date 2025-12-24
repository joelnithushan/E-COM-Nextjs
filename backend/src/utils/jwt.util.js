// Re-export from token.util.js for backward compatibility
// This allows existing code to continue working while using enhanced token utilities
export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateSecureToken,
  isTokenExpired,
  getTokenExpiration,
} from './token.util.js';

/**
 * Generate token payload from user object
 * @param {Object} user - User object
 * @returns {Object} Token payload
 */
export const generateTokenPayload = (user) => {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
};

/**
 * Generate token payload from user object
 * @param {Object} user - User object
 * @returns {Object} Token payload
 */
export const generateTokenPayload = (user) => {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
};


