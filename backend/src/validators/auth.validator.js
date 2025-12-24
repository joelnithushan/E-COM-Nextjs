import Joi from 'joi';

// Register validation schema
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  role: Joi.string().valid('admin', 'customer').default('customer'),
  phone: Joi.string().trim().allow('', null),
});

// Login validation schema
export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

// Refresh token validation schema
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(), // Optional if using httpOnly cookie
});

// Change password validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 6 characters',
  }),
});

