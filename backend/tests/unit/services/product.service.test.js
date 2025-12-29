/**
 * Product Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import productService from '../../../src/services/product.service.js';
import Product from '../../../src/models/Product.js';
import Category from '../../../src/models/Category.js';
import { createTestCategory, createTestProduct } from '../../helpers/testHelpers.js';
import { HTTP_STATUS } from '../../../src/config/constants.js';

// Mock Cloudinary
jest.mock('../../../src/config/cloudinary.js', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  deleteImages: jest.fn(),
}));

describe('ProductService', () => {
  let category;

  beforeEach(async () => {
    category = await createTestCategory();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      // Create test products
      await createTestProduct(category._id, { name: 'Product 1', price: 10 });
      await createTestProduct(category._id, { name: 'Product 2', price: 20 });

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('pagination');
      expect(result.products).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter products by category', async () => {
      const category2 = await createTestCategory({ name: 'Category 2' });
      await createTestProduct(category._id, { name: 'Product 1' });
      await createTestProduct(category2._id, { name: 'Product 2' });

      const result = await productService.getProducts({
        category: category._id.toString(),
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Product 1');
    });

    it('should filter products by status', async () => {
      await createTestProduct(category._id, { name: 'Active Product', status: 'active' });
      await createTestProduct(category._id, { name: 'Inactive Product', status: 'inactive' });

      const result = await productService.getProducts({
        status: 'active',
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].status).toBe('active');
    });

    it('should filter products by price range', async () => {
      await createTestProduct(category._id, { name: 'Cheap Product', price: 10 });
      await createTestProduct(category._id, { name: 'Expensive Product', price: 100 });

      const result = await productService.getProducts({
        minPrice: 50,
        maxPrice: 150,
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].price).toBe(100);
    });

    it('should sort products by price ascending', async () => {
      await createTestProduct(category._id, { name: 'Product 1', price: 100 });
      await createTestProduct(category._id, { name: 'Product 2', price: 10 });

      const result = await productService.getProducts({
        sort: 'price_asc',
      });

      expect(result.products[0].price).toBe(10);
      expect(result.products[1].price).toBe(100);
    });

    it('should search products by text', async () => {
      await createTestProduct(category._id, { name: 'Laptop Computer', description: 'A great laptop' });
      await createTestProduct(category._id, { name: 'Mouse Pad', description: 'A mouse pad' });

      const result = await productService.getProducts({
        search: 'laptop',
      });

      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products[0].name.toLowerCase()).toContain('laptop');
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      const product = await createTestProduct(category._id);

      const result = await productService.getProductById(product._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(product._id.toString());
      expect(result.name).toBe(product.name);
    });

    it('should throw error if product not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        productService.getProductById(fakeId)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('getProductBySlug', () => {
    it('should return a product by slug', async () => {
      const product = await createTestProduct(category._id, { slug: 'test-product-slug' });

      const result = await productService.getProductBySlug('test-product-slug');

      expect(result).toBeDefined();
      expect(result.slug).toBe('test-product-slug');
    });

    it('should throw error if product not found', async () => {
      await expect(
        productService.getProductBySlug('non-existent-slug')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 99.99,
        stock: 10,
        category: category._id.toString(),
        status: 'active',
      };

      const result = await productService.createProduct(productData);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Product');
      expect(result.price).toBe(99.99);
    });

    it('should generate unique slug if not provided', async () => {
      const productData = {
        name: 'Product With Slug',
        description: 'Description',
        price: 99.99,
        stock: 10,
        category: category._id.toString(),
      };

      const result = await productService.createProduct(productData);

      expect(result.slug).toBeDefined();
      expect(result.slug).toContain('product-with-slug');
    });

    it('should throw error if category not found', async () => {
      const productData = {
        name: 'New Product',
        description: 'Description',
        price: 99.99,
        stock: 10,
        category: '507f1f77bcf86cd799439011',
      };

      await expect(
        productService.createProduct(productData)
      ).rejects.toThrow('Category not found');
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const product = await createTestProduct(category._id);
      const updateData = {
        name: 'Updated Product Name',
        price: 149.99,
      };

      const result = await productService.updateProduct(
        product._id.toString(),
        updateData
      );

      expect(result.name).toBe('Updated Product Name');
      expect(result.price).toBe(149.99);
    });

    it('should throw error if product not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        productService.updateProduct(fakeId, { name: 'Updated' })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const product = await createTestProduct(category._id);
      const productId = product._id.toString();

      const result = await productService.deleteProduct(productId);

      expect(result.success).toBe(true);

      // Verify product is deleted
      const deletedProduct = await Product.findById(productId);
      expect(deletedProduct).toBeNull();
    });

    it('should throw error if product not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        productService.deleteProduct(fakeId)
      ).rejects.toThrow('Product not found');
    });
  });
});









