import jwt from 'jsonwebtoken';

/**
 * Generate access token
 * @param {Object} payload - User data to encode
 * @returns {String} Access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode
 * @returns {String} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
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


