import multer from 'multer';
import { logger } from '../utils/logger.util.js';

// Configure multer for memory storage (required for Cloudinary)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10, // Max 10 files
  },
});

/**
 * Middleware for single image upload
 */
export const uploadSingle = (fieldName = 'image') => {
  return upload.single(fieldName);
};

/**
 * Middleware for multiple image uploads
 */
export const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Error handler for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File size too large. Maximum size is 5MB',
        },
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Too many files. Maximum is 10 files',
        },
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Unexpected file field',
        },
      });
    }
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message,
      },
    });
  }

  next(err);
};


