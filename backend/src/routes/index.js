import express from 'express';
import authRoutes from './auth.routes.js';

const router = express.Router();

const API_VERSION = process.env.API_VERSION || 'v1';

// Health check route (enhanced for Docker health checks)
router.get('/health', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const dbStatus = mongoose.connection.readyState;
    const dbConnected = dbStatus === 1; // 1 = connected

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        api: 'running',
      },
    };

    const statusCode = dbConnected ? 200 : 503;
    res.status(statusCode).json({
      success: dbConnected,
      data: health,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error.message,
      },
    });
  }
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

// Cloudinary routes
import cloudinaryRoutes from './cloudinary.routes.js';
router.use(`/cloudinary`, cloudinaryRoutes);

// Feature toggle routes
import featureToggleRoutes from './feature-toggle.routes.js';
router.use(`/features`, featureToggleRoutes);

// Coupon routes
import couponRoutes from './coupon.routes.js';
router.use(`/coupons`, couponRoutes);

// Analytics routes
import analyticsRoutes from './analytics.routes.js';
router.use(`/analytics`, analyticsRoutes);

// Admin routes
import adminRoutes from './admin.routes.js';
router.use(`/admin`, adminRoutes);

export default router;

