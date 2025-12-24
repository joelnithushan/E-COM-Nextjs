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

// Add other routes here
// router.use(`/products`, productRoutes);
// router.use(`/orders`, orderRoutes);

export default router;

