import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
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

    // Return 503 if database is not connected
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

export default router;



