/**
 * Test Helpers
 * Utility functions for testing
 */

import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import Category from '../../src/models/Category.js';
import Cart from '../../src/models/Cart.js';
import Order from '../../src/models/Order.js';
import { generateToken } from '../../src/utils/token.util.js';
import { hashPassword } from '../../src/utils/password.util.js';
import { USER_ROLES } from '../../src/config/constants.js';

/**
 * Create a test user
 */
export async function createTestUser(overrides = {}) {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: await hashPassword('password123'),
    role: USER_ROLES.CUSTOMER,
    isEmailVerified: true,
    isActive: true,
    ...overrides,
  };

  return await User.create(defaultUser);
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(overrides = {}) {
  return await createTestUser({
    role: USER_ROLES.ADMIN,
    email: `admin${Date.now()}@example.com`,
    ...overrides,
  });
}

/**
 * Create a test category
 */
export async function createTestCategory(overrides = {}) {
  const defaultCategory = {
    name: 'Test Category',
    slug: `test-category-${Date.now()}`,
    description: 'Test category description',
    ...overrides,
  };

  return await Category.create(defaultCategory);
}

/**
 * Create a test product
 */
export async function createTestProduct(categoryId, overrides = {}) {
  const defaultProduct = {
    name: 'Test Product',
    slug: `test-product-${Date.now()}`,
    description: 'Test product description',
    shortDescription: 'Short description',
    price: 99.99,
    stock: 10,
    status: 'active',
    category: categoryId,
    images: [
      {
        url: 'https://example.com/image.jpg',
        publicId: 'test-image',
        isPrimary: true,
      },
    ],
    ...overrides,
  };

  return await Product.create(defaultProduct);
}

/**
 * Create a test cart
 */
export async function createTestCart(userId, items = []) {
  const defaultCart = {
    user: userId,
    items,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  return await Cart.create(defaultCart);
}

/**
 * Create a test order
 */
export async function createTestOrder(userId, overrides = {}) {
  const defaultOrder = {
    orderNumber: `ORD-${Date.now()}`,
    user: userId,
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 99.99,
        quantity: 1,
        subtotal: 99.99,
      },
    ],
    shippingAddress: {
      name: 'Test User',
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US',
      phone: '1234567890',
    },
    billingAddress: {
      name: 'Test User',
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US',
      phone: '1234567890',
    },
    payment: {
      method: 'stripe',
      status: 'pending',
      amount: 99.99,
      currency: 'usd',
    },
    shipping: {
      method: 'standard',
      cost: 10,
    },
    status: 'pending',
    subtotal: 99.99,
    tax: 0,
    shippingCost: 10,
    total: 109.99,
    ...overrides,
  };

  return await Order.create(defaultOrder);
}

/**
 * Generate auth token for a user
 */
export function generateAuthToken(user) {
  return generateToken(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    '15m'
  );
}

/**
 * Generate refresh token for a user
 */
export function generateRefreshToken(user) {
  return generateToken(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    '7d'
  );
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Cart.deleteMany({});
  await Order.deleteMany({});
}

/**
 * Wait for async operations
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}









