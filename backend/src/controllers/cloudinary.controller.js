import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import cloudinary from '../config/cloudinary.js';
import crypto from 'crypto';

/**
 * Generate Cloudinary upload signature
 * This allows secure direct uploads from the frontend
 */
export const generateSignature = async (req, res) => {
  try {
    const { folder = 'products', timestamp } = req.body;

    if (!process.env.CLOUDINARY_API_SECRET) {
      const error = new Error('Cloudinary API secret not configured');
      error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw error;
    }

    // Generate signature for unsigned upload
    // Frontend will use this signature to upload directly to Cloudinary
    const params = {
      folder,
      timestamp: timestamp || Math.round(Date.now() / 1000),
    };

    // Create signature string
    const signatureString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    // Generate signature using HMAC-SHA1
    const signature = crypto
      .createHmac('sha1', process.env.CLOUDINARY_API_SECRET)
      .update(signatureString)
      .digest('hex');

    sendSuccess(res, {
      signature,
      timestamp: params.timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    logger.error('Generate signature error:', error);
    sendError(
      res,
      error.message || 'Failed to generate upload signature',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

