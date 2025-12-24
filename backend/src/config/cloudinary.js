import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.util.js';
import config from './index.js';

if (!config.cloudinary.cloudName) {
  logger.warn('Cloudinary not configured. Image uploads will fail.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} folder - Folder path in Cloudinary
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with url and publicId
 */
export const uploadImage = async (fileBuffer, folder = 'products', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(new Error(`Image upload failed: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of public IDs
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    logger.error('Cloudinary bulk delete error:', error);
    throw new Error(`Bulk image deletion failed: ${error.message}`);
  }
};

export default cloudinary;


