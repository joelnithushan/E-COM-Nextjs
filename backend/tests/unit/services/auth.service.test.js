/**
 * Auth Service Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import authService from '../../../src/services/auth.service.js';
import User from '../../../src/models/User.js';
import { createTestUser, createTestAdmin } from '../../helpers/testHelpers.js';
import { hashPassword } from '../../../src/utils/password.util.js';
import { USER_ROLES } from '../../../src/config/constants.js';

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: `newuser${Date.now()}@example.com`,
        password: 'password123',
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.role).toBe(USER_ROLES.CUSTOMER);
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'New User',
        email: `newuser${Date.now()}@example.com`,
        password: 'password123',
      };

      const result = await authService.register(userData);
      const user = await User.findById(result.user._id).select('+password');

      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should throw error if email already exists', async () => {
      const existingUser = await createTestUser();
      const userData = {
        name: 'New User',
        email: existingUser.email,
        password: 'password123',
      };

      await expect(
        authService.register(userData)
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const password = 'password123';
      const user = await createTestUser({
        password: await hashPassword(password),
      });

      const result = await authService.login(user.email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(user.email);
    });

    it('should throw error with invalid email', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      const user = await createTestUser();

      await expect(
        authService.login(user.email, 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is inactive', async () => {
      const password = 'password123';
      const user = await createTestUser({
        password: await hashPassword(password),
        isActive: false,
      });

      await expect(
        authService.login(user.email, password)
      ).rejects.toThrow('Account is inactive');
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createTestUser();
      const refreshToken = await authService.generateRefreshToken(user._id.toString());

      const result = await authService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout user and clear refresh token', async () => {
      const user = await createTestUser();
      await authService.generateRefreshToken(user._id.toString());

      await authService.logout(user._id.toString());

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBeNull();
    });
  });
});



