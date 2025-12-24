import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPayload,
  verifyToken,
} from '../utils/jwt.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} User object and tokens
 */
export const register = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = HTTP_STATUS.CONFLICT;
    throw error;
  }

  // Create new user
  const user = await User.create({
    name: userData.name,
    email: userData.email.toLowerCase(),
    password: userData.password,
    role: userData.role || 'customer',
    phone: userData.phone || null,
  });

  // Generate tokens
  const tokenPayload = generateTokenPayload(user);
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove sensitive data
  const userObject = user.toJSON();

  return {
    user: userObject,
    accessToken,
    refreshToken,
  };
};

/**
 * Login user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} User object and tokens
 */
export const login = async (email, password) => {
  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    throw error;
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    throw error;
  }

  // Update last login
  user.lastLogin = new Date();

  // Generate tokens
  const tokenPayload = generateTokenPayload(user);
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove password from user object
  const userObject = user.toJSON();

  return {
    user: userObject,
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} New access token
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token required');
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    throw error;
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch (error) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = HTTP_STATUS.UNAUTHORIZED;
    throw err;
  }

  // Find user and verify refresh token matches
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    const error = new Error('Invalid refresh token');
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    throw error;
  }

  // Generate new access token
  const tokenPayload = generateTokenPayload(user);
  const accessToken = generateAccessToken(tokenPayload);

  return {
    accessToken,
  };
};

/**
 * Logout user
 * @param {String} userId - User ID
 */
export const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 },
  });
};

/**
 * Get current user
 * @param {String} userId - User ID
 * @returns {Object} User object
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = HTTP_STATUS.NOT_FOUND;
    throw error;
  }

  return user.toJSON();
};

