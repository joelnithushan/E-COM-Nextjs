import express from 'express';
import authRoutes from './auth.routes.js';

const router = express.Router();

const API_VERSION = process.env.API_VERSION || 'v1';

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use(`/auth`, authRoutes);

// Payment routes
import paymentRoutes from './payment.routes.js';
router.use(`/payments`, paymentRoutes);

// Product routes
import productRoutes from './product.routes.js';
router.use(`/products`, productRoutes);

// Category routes
import categoryRoutes from './category.routes.js';
router.use(`/categories`, categoryRoutes);

// Cart routes
import cartRoutes from './cart.routes.js';
router.use(`/cart`, cartRoutes);

// Order routes
import orderRoutes from './order.routes.js';
router.use(`/orders`, orderRoutes);

export default router;

