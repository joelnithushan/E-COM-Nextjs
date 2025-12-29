/**
 * Auth API Integration Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestUser, getAuthHeaders, generateAuthToken } from '../helpers/testHelpers.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: `newuser${Date.now()}@example.com`,
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return 400 if email already exists', async () => {
      const existingUser = await createTestUser();
      const userData = {
        name: 'New User',
        email: existingUser.email,
        password: 'password123',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      const userData = {
        // Missing required fields
        name: 'New User',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'New User',
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should validate password length', async () => {
      const userData = {
        name: 'New User',
        email: `newuser${Date.now()}@example.com`,
        password: '123', // Too short
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const password = 'password123';
      const user = await createTestUser({
        password: await hashPassword(password),
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should set refresh token cookie', async () => {
      const password = 'password123';
      const user = await createTestUser({
        password: await hashPassword(password),
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: password,
        })
        .expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('should return 401 with invalid email', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 with invalid password', async () => {
      const user = await createTestUser();

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createTestUser();
      const refreshToken = generateAuthToken(user);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 with invalid refresh token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });

    it('should return 401 without refresh token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });
});









