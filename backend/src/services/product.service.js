import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadImage, deleteImage, deleteImages } from '../config/cloudinary.js';
import { generateSlug, generateUniqueSlug } from '../utils/slug.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Product Service
 * Handles all product-related business logic
 */
class ProductService {
  /**
   * Get all products with pagination and filtering
   */
  async getProducts(query = {}) {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      status,
      featured,
      sort = 'newest',
      inStock,
    } = query;

    // Build filter
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (featured !== undefined) {
      filter.featured = featured === 'true' || featured === true;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (inStock !== undefined) {
      if (inStock === 'true' || inStock === true) {
        filter.$or = [
          { stock: { $gt: 0 } },
          { 'variants.options.stock': { $gt: 0 } },
        ];
      }
    }

    // Build sort
    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + products.length < total,
        hasPrev: Number(page) > 1,
      },
    };
  }

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    const product = await Product.findById(id).populate('category', 'name slug');

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return product;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug) {
    const product = await Product.findOne({ slug }).populate('category', 'name slug');

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return product;
  }

  /**
   * Create new product
   */
  async createProduct(productData, images = [], userId = null) {
    // Verify category exists
    const category = await Category.findById(productData.category);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Generate slug if not provided
    let slug = productData.slug;
    if (!slug) {
      slug = generateSlug(productData.name);
    }

    // Ensure unique slug
    slug = await generateUniqueSlug(slug, async (s) => {
      const exists = await Product.findOne({ slug: s });
      return !!exists;
    });

    // Upload images to Cloudinary (if files are provided)
    const uploadedImages = [];
    if (images && images.length > 0) {
      for (const image of images) {
        // Only upload if it's a file buffer (from multer)
        if (image.buffer) {
          try {
            const result = await uploadImage(image.buffer, 'products', {
              public_id: `product_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            });

            uploadedImages.push({
              url: result.url,
              publicId: result.publicId,
              isPrimary: uploadedImages.length === 0, // First image is primary
              order: uploadedImages.length,
            });
          } catch (error) {
            logger.error('Image upload error:', error);
            // Continue with other images, but log error
          }
        }
      }
    }

    // If images provided in productData (from direct Cloudinary uploads), merge with uploaded images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((img, index) => {
        if (!uploadedImages.find((u) => u.url === img.url)) {
          uploadedImages.push({
            url: img.url,
            publicId: img.publicId || '',
            isPrimary: img.isPrimary !== undefined ? img.isPrimary : uploadedImages.length === 0,
            order: img.order !== undefined ? img.order : uploadedImages.length,
          });
        }
      });
    }

    // If no images were uploaded or provided, use empty array
    const finalImages = uploadedImages.length > 0 ? uploadedImages : [];

    // Create product
    const product = await Product.create({
      ...productData,
      slug,
      images: finalImages,
      createdBy: userId,
    });

    return await this.getProductById(product._id);
  }

  /**
   * Update product
   */
  async updateProduct(id, productData, newImages = []) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Handle category update
    if (productData.category && productData.category !== product.category.toString()) {
      const category = await Category.findById(productData.category);
      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }
    }

    // Handle slug update
    if (productData.name && !productData.slug) {
      const newSlug = generateSlug(productData.name);
      if (newSlug !== product.slug) {
        productData.slug = await generateUniqueSlug(newSlug, async (s) => {
          const exists = await Product.findOne({ slug: s, _id: { $ne: id } });
          return !!exists;
        });
      }
    } else if (productData.slug && productData.slug !== product.slug) {
      productData.slug = await generateUniqueSlug(productData.slug, async (s) => {
        const exists = await Product.findOne({ slug: s, _id: { $ne: id } });
        return !!exists;
      });
    }

    // Handle new image uploads (if files are provided)
    const uploadedNewImages = [];
    if (newImages && newImages.length > 0) {
      for (const image of newImages) {
        // Only upload if it's a file buffer (from multer)
        if (image.buffer) {
          try {
            const result = await uploadImage(image.buffer, 'products');
            uploadedNewImages.push({
              url: result.url,
              publicId: result.publicId,
              isPrimary: false,
              order: product.images.length + uploadedNewImages.length,
            });
          } catch (error) {
            logger.error('Image upload error:', error);
          }
        }
      }
    }

    // Handle images from productData (direct Cloudinary uploads or updates)
    if (productData.images !== undefined) {
      // If images are provided in productData, use them (they're already uploaded to Cloudinary)
      // Merge with any newly uploaded files
      productData.images = [...productData.images, ...uploadedNewImages];
    } else if (uploadedNewImages.length > 0) {
      // If only new files were uploaded, add them to existing images
      productData.images = [...product.images, ...uploadedNewImages];
    }

    // Update product
    Object.assign(product, productData);
    await product.save();

    return await this.getProductById(id);
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Delete images from Cloudinary
    const publicIds = product.images
      .map((img) => img.publicId)
      .filter((id) => id);

    if (publicIds.length > 0) {
      try {
        await deleteImages(publicIds);
      } catch (error) {
        logger.error('Error deleting images from Cloudinary:', error);
        // Continue with product deletion even if image deletion fails
      }
    }

    await Product.findByIdAndDelete(id);
    return { success: true };
  }

  /**
   * Delete product image
   */
  async deleteProductImage(productId, imagePublicId) {
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Find and remove image
    const imageIndex = product.images.findIndex((img) => img.publicId === imagePublicId);
    if (imageIndex === -1) {
      const error = new Error('Image not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Delete from Cloudinary
    try {
      await deleteImage(imagePublicId);
    } catch (error) {
      logger.error('Error deleting image from Cloudinary:', error);
    }

    // Remove from product
    product.images.splice(imageIndex, 1);

    // If deleted image was primary, set first image as primary
    if (product.images.length > 0 && product.images[imageIndex]?.isPrimary) {
      product.images[0].isPrimary = true;
    }

    await product.save();
    return await this.getProductById(productId);
  }
}

export default new ProductService();


