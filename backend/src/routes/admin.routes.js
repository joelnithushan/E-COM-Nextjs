import express from 'express';
import adminController from '../controllers/admin.controller.js';
import * as productController from '../controllers/product.controller.js';
import * as orderController from '../controllers/order.controller.js';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator.js';
import {
  orderQuerySchema,
  updateOrderStatusSchema,
  updateShippingInfoSchema,
} from '../validators/order.validator.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.middleware.js';

const router = express.Router();

/**
 * Admin Routes
 * All routes require admin authentication
 */

// All routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// Admin Products Routes (aliases for easier frontend integration)
router.get('/products', validate(productQuerySchema, 'query'), productController.getProducts);
router.get('/products/:id', productController.getProduct);
router.post(
  '/products',
  // Optional file upload - only processes if Content-Type is multipart/form-data
  (req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return uploadMultiple('images', 10)(req, res, next);
    }
    next();
  },
  handleUploadError,
  validate(createProductSchema),
  productController.createProduct
);
router.put(
  '/products/:id',
  // Optional file upload - only processes if Content-Type is multipart/form-data
  (req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return uploadMultiple('images', 10)(req, res, next);
    }
    next();
  },
  handleUploadError,
  validate(updateProductSchema),
  productController.updateProduct
);
router.delete('/products/:id', productController.deleteProduct);

// Admin Orders Routes (aliases for easier frontend integration)
router.get('/orders', validate(orderQuerySchema, 'query'), orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrder);
router.put('/orders/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.put('/orders/:id/shipping', validate(updateShippingInfoSchema), orderController.updateShippingInfo);

// Admin Inventory Routes
router.get('/inventory', inventoryController.getInventoryStatus);

export default router;

