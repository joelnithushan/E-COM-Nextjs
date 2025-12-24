/**
 * Cart API Integration Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestUser, createTestAdmin, createTestCategory, createTestProduct, getAuthHeaders, generateAuthToken } from '../helpers/testHelpers.js';

describe('Cart API', () => {
  let customerToken;
  let customer;
  let product;
  let category;

  beforeEach(async () => {
    customer = await createTestUser();
    customerToken = generateAuthToken(customer);
    category = await createTestCategory();
    product = await createTestProduct(category._id);
  });

  describe('GET /api/v1/cart', () => {
    it('should get user cart', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set(getAuthHeaders(customerToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('cart');
      expect(response.body.data.cart).toHaveProperty('items');
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/v1/cart')
        .expect(401);
    });
  });

  describe('POST /api/v1/cart/items', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 2,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.cart.items.length).toBe(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
    });

    it('should update quantity if item already exists', async () => {
      // Add item first time
      await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      // Add same item again
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 2,
        })
        .expect(200);

      expect(response.body.data.cart.items.length).toBe(1);
      expect(response.body.data.cart.items[0].quantity).toBe(3); // 1 + 2
    });

    it('should return 400 if product not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: fakeId,
          quantity: 1,
        })
        .expect(400);
    });

    it('should return 400 if insufficient stock', async () => {
      const lowStockProduct = await createTestProduct(category._id, { stock: 1 });

      await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: lowStockProduct._id.toString(),
          quantity: 5,
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/cart/items/:itemId', () => {
    it('should update item quantity', async () => {
      // Add item first
      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const itemId = addResponse.body.data.cart.items[0]._id;

      // Update quantity
      const response = await request(app)
        .put(`/api/v1/cart/items/${itemId}`)
        .set(getAuthHeaders(customerToken))
        .send({
          quantity: 5,
        })
        .expect(200);

      expect(response.body.data.cart.items[0].quantity).toBe(5);
    });

    it('should remove item if quantity is 0', async () => {
      // Add item first
      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const itemId = addResponse.body.data.cart.items[0]._id;

      // Set quantity to 0 (should remove)
      const response = await request(app)
        .put(`/api/v1/cart/items/${itemId}`)
        .set(getAuthHeaders(customerToken))
        .send({
          quantity: 0,
        })
        .expect(200);

      expect(response.body.data.cart.items.length).toBe(0);
    });
  });

  describe('DELETE /api/v1/cart/items/:itemId', () => {
    it('should remove item from cart', async () => {
      // Add item first
      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const itemId = addResponse.body.data.cart.items[0]._id;

      // Remove item
      const response = await request(app)
        .delete(`/api/v1/cart/items/${itemId}`)
        .set(getAuthHeaders(customerToken))
        .expect(200);

      expect(response.body.data.cart.items.length).toBe(0);
    });
  });

  describe('DELETE /api/v1/cart', () => {
    it('should clear cart', async () => {
      // Add items first
      await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      // Clear cart
      const response = await request(app)
        .delete('/api/v1/cart')
        .set(getAuthHeaders(customerToken))
        .expect(200);

      expect(response.body.data.cart.items.length).toBe(0);
    });
  });

  describe('GET /api/v1/cart/summary', () => {
    it('should get cart summary', async () => {
      // Add items first
      await request(app)
        .post('/api/v1/cart/items')
        .set(getAuthHeaders(customerToken))
        .send({
          productId: product._id.toString(),
          quantity: 2,
        });

      const response = await request(app)
        .get('/api/v1/cart/summary')
        .set(getAuthHeaders(customerToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data.subtotal).toBe(product.price * 2);
    });
  });
});

