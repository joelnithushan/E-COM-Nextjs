import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from './logger.util.js';

/**
 * Token configuration
 */
export const TOKEN_CONFIG = {
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'ecommerce-api',
  audience: process.env.JWT_AUDIENCE || 'ecommerce-client',
};

/**
 * Generate cryptographically secure random token
 * @param {Number} length - Token length in bytes (default: 32)
 * @returns {String} Random token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate access token with enhanced security
 * @param {Object} payload - Token payload
 * @returns {String} Access token
 */
export const generateAccessToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const tokenPayload = {
    ...payload,
    type: 'access',
    iat: Math.floor(Date.now() / 1000), // Issued at
    jti: generateSecureToken(16), // JWT ID for token revocation
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: TOKEN_CONFIG.accessTokenExpiry,
    issuer: TOKEN_CONFIG.issuer,
    audience: TOKEN_CONFIG.audience,
    algorithm: 'HS256', // Explicitly set algorithm
  });
};

/**
 * Generate refresh token with enhanced security
 * @param {Object} payload - Token payload
 * @returns {String} Refresh token
 */
export const generateRefreshToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const tokenPayload = {
    ...payload,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    jti: generateSecureToken(16),
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: TOKEN_CONFIG.refreshTokenExpiry,
    issuer: TOKEN_CONFIG.issuer,
    audience: TOKEN_CONFIG.audience,
    algorithm: 'HS256',
  });
};

/**
 * Verify JWT token with enhanced validation
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
export const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: TOKEN_CONFIG.issuer,
      audience: TOKEN_CONFIG.audience,
      algorithms: ['HS256'], // Only accept HS256
    });

    // Additional validation
    if (!decoded.id || !decoded.type) {
      throw new Error('Invalid token structure');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active yet');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging only)
 * @param {String} token - JWT token
 * @returns {Object} Decoded token (not verified)
 */
export const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

/**
 * Check if token is expired
 * @param {String} token - JWT token
 * @returns {Boolean} True if expired
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 * @param {String} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

