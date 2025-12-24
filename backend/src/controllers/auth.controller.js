import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'User registered successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Register error:', error);
    sendError(
      res,
      error.message || 'Registration failed',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Login successful'
    );
  } catch (error) {
    logger.error('Login error:', error);
    sendError(
      res,
      error.message || 'Login failed',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const result = await authService.refreshAccessToken(refreshToken);

    sendSuccess(res, result, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Refresh token error:', error);
    sendError(
      res,
      error.message || 'Token refresh failed',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    if (req.user?.id) {
      await authService.logout(req.user.id);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', error);
    sendError(
      res,
      error.message || 'Logout failed',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, { user }, 'User retrieved successfully');
  } catch (error) {
    logger.error('Get current user error:', error);
    sendError(
      res,
      error.message || 'Failed to get user',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};


