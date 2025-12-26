import bcrypt from 'bcryptjs';
import { logger } from './logger.util.js';

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} { valid: Boolean, errors: Array<String> }
 */
export const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Hash password with bcrypt
 * @param {String} password - Plain text password
 * @param {Number} saltRounds - Number of salt rounds (default: 12)
 * @returns {Promise<String>} Hashed password
 */
export const hashPassword = async (password, saltRounds = 12) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Promise<Boolean>} True if passwords match
 */
export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Password comparison error:', error);
    return false;
  }
};

/**
 * Check if password needs rehashing (if salt rounds changed)
 * @param {String} hash - Hashed password
 * @param {Number} currentSaltRounds - Current salt rounds
 * @returns {Boolean} True if password needs rehashing
 */
export const needsRehash = (hash, currentSaltRounds = 12) => {
  // Extract salt rounds from bcrypt hash
  const rounds = parseInt(hash.split('$')[2]);
  return rounds < currentSaltRounds;
};



