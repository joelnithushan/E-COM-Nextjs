/**
 * Product API Integration Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import app from '../../src/app.js';
import { createTestUser, createTestAdmin, createTestCategory, createTestProduct, getAuthHeaders, generateAuthToken } from '../helpers/testHelpers.js';

describe('Product API', () => {
  let adminToken;
  let customerToken;
  let category;
  let admin;

  beforeEach(async () => {
    // Create test users
    admin = await createTestAdmin();
    const customer = await createTestUser();
    adminToken = generateAuthToken(admin);
    customerToken = generateAuthToken(customer);

    // Create test category
    category = await createTestCategory();
  });

  describe('GET /api/v1/products', () => {
    it('should get all products (public)', async () => {
      await createTestProduct(category._id);
      await createTestProduct(category._id);

      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter products by category', async () => {
      const category2 = await createTestCategory({ name: 'Category 2' });
      await createTestProduct(category._id, { name: 'Product 1' });
      await createTestProduct(category2._id, { name: 'Product 2' });

      const response = await request(app)
        .get(`/api/v1/products?category=${category._id}`)
        .expect(200);

      expect(response.body.data.products.length).toBe(1);
      expect(response.body.data.products[0].name).toBe('Product 1');
    });

    it('should paginate products', async () => {
      // Create multiple products
      for (let i = 0; i < 15; i++) {
        await createTestProduct(category._id, { name: `Product ${i}` });
      }

      const response = await request(app)
        .get('/api/v1/products?page=1&limit=10')
        .expect(200);

      expect(response.body.data.products.length).toBe(10);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBe(15);
    });

    it('should sort products by price', async () => {
      await createTestProduct(category._id, { name: 'Product 1', price: 100 });
      await createTestProduct(category._id, { name: 'Product 2', price: 10 });

      const response = await request(app)
        .get('/api/v1/products?sort=price_asc')
        .expect(200);

      expect(response.body.data.products[0].price).toBe(10);
      expect(response.body.data.products[1].price).toBe(100);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should get a single product (public)', async () => {
      const product = await createTestProduct(category._id);

      const response = await request(app)
        .get(`/api/v1/products/${product._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.product._id).toBe(product._id.toString());
      expect(response.body.data.product.name).toBe(product.name);
    });

    it('should return 404 if product not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .get(`/api/v1/products/${fakeId}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a product (admin only)', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 99.99,
        stock: 10,
        category: category._id.toString(),
        status: 'active',
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set(getAuthHeaders(adminToken))
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.product.name).toBe('New Product');
      expect(response.body.data.product.price).toBe(99.99);
    });

    it('should return 403 if not admin', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 99.99,
        stock: 10,
        category: category._id.toString(),
      };

      await request(app)
        .post('/api/v1/products')
        .set(getAuthHeaders(customerToken))
        .send(productData)
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 99.99,
        stock: 10,
        category: category._id.toString(),
      };

      await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const productData = {
        // Missing required fields
        name: 'New Product',
      };

      await request(app)
        .post('/api/v1/products')
        .set(getAuthHeaders(adminToken))
        .send(productData)
        .expect(400);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update a product (admin only)', async () => {
      const product = await createTestProduct(category._id);
      const updateData = {
        name: 'Updated Product Name',
        price: 149.99,
      };

      const response = await request(app)
        .put(`/api/v1/products/${product._id}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(200);

      expect(response.body.data.product.name).toBe('Updated Product Name');
      expect(response.body.data.product.price).toBe(149.99);
    });

    it('should return 403 if not admin', async () => {
      const product = await createTestProduct(category._id);

      await request(app)
        .put(`/api/v1/products/${product._id}`)
        .set(getAuthHeaders(customerToken))
        .send({ name: 'Updated' })
        .expect(403);
    });

    it('should return 404 if product not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .put(`/api/v1/products/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete a product (admin only)', async () => {
      const product = await createTestProduct(category._id);

      await request(app)
        .delete(`/api/v1/products/${product._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      // Verify product is deleted
      const response = await request(app)
        .get(`/api/v1/products/${product._id}`)
        .expect(404);
    });

    it('should return 403 if not admin', async () => {
      const product = await createTestProduct(category._id);

      await request(app)
        .delete(`/api/v1/products/${product._id}`)
        .set(getAuthHeaders(customerToken))
        .expect(403);
    });
  });
});

