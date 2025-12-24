import express from 'express';
import * as cloudinaryController from '../controllers/cloudinary.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/v1/cloudinary/signature
 * @desc    Generate Cloudinary upload signature for secure direct uploads
 * @access  Private (Admin only)
 */
router.post(
  '/signature',
  authenticate,
  adminOnly,
  cloudinaryController.generateSignature
);

export default router;

