import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadImage, deleteImage, deleteImages } from '../config/cloudinary.js';
import { generateSlug, generateUniqueSlug } from '../utils/slug.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import { withCache, cacheKey, delCachePattern } from '../utils/cache.util.js';
import { offsetPagination, getCount } from '../utils/pagination.util.js';

/**
 * Product Service (Optimized)
 * Performance optimizations:
 * - Field selection to prevent over-fetching
 * - Caching for frequently accessed data
 * - Optimized pagination
 * - Index-aware queries
 */
class ProductService {
  // Field selections for different use cases
  static LIST_FIELDS = 'name slug price compareAtPrice images stock status featured ratings category createdAt';
  static DETAIL_FIELDS = 'name slug description shortDescription price compareAtPrice images stock variants trackInventory allowBackorder sku weight dimensions status featured tags metaTitle metaDescription ratings salesCount category createdAt';
  static MINIMAL_FIELDS = 'name slug price images status';

  /**
   * Get all products with pagination and filtering (OPTIMIZED)
   * 
   * Optimizations:
   * - Field selection to reduce data transfer
   * - Caching for common queries
   * - Index-aware filtering
   * - Lean queries for better performance
   */
  async getProducts(query = {}) {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      status = 'active', // Default to active for public queries
      featured,
      sort = 'newest',
      inStock,
    } = query;

    // Build cache key
    const cacheKeyStr = cacheKey(
      'products',
      `page:${page}`,
      `limit:${limit}`,
      `category:${category || 'all'}`,
      `status:${status}`,
      `featured:${featured || 'all'}`,
      `sort:${sort}`,
      `search:${search || 'none'}`,
      `minPrice:${minPrice || 'none'}`,
      `maxPrice:${maxPrice || 'none'}`,
      `inStock:${inStock || 'all'}`
    );

    // Try cache first (5 minute TTL for product lists)
    return await withCache(
      cacheKeyStr,
      async () => {
        // Build filter (optimized for index usage)
        const filter = {};

        // Use compound index: category + status
        if (category) {
          filter.category = category;
        }
        filter.status = status; // Always filter by status

        if (featured !== undefined) {
          filter.featured = featured === 'true' || featured === true;
        }

        // Text search (uses text index)
        if (search) {
          filter.$text = { $search: search };
        }

        // Price range (uses status + price index)
        if (minPrice !== undefined || maxPrice !== undefined) {
          filter.price = {};
          if (minPrice !== undefined) {
            filter.price.$gte = Number(minPrice);
          }
          if (maxPrice !== undefined) {
            filter.price.$lte = Number(maxPrice);
          }
        }

        // Stock filter (uses status + stock index)
        if (inStock !== undefined && inStock === 'true') {
          filter.$or = [
            { stock: { $gt: 0 } },
            { 'variants.options.stock': { $gt: 0 } },
          ];
        }

        // Build sort (optimized for index usage)
        const sortOptions = {
          price_asc: { price: 1 }, // Uses status + price index
          price_desc: { price: -1 }, // Uses status + price index
          name_asc: { name: 1 },
          name_desc: { name: -1 },
          newest: { createdAt: -1 }, // Uses category + status + createdAt index
          oldest: { createdAt: 1 },
          rating: { 'ratings.average': -1 }, // Uses status + ratings index
          bestseller: { salesCount: -1 }, // Uses status + salesCount index
        };

        const sortBy = sortOptions[sort] || sortOptions.newest;

        // Optimized pagination
        const { skip, limit: limitNum, page: pageNum } = offsetPagination(page, limit);

        // Field selection to prevent over-fetching
        const selectFields = ProductService.LIST_FIELDS;

        // Execute query with optimizations
        const [products, total] = await Promise.all([
          Product.find(filter)
            .select(selectFields) // Only fetch needed fields
            .populate('category', 'name slug') // Minimal category data
            .sort(sortBy)
            .skip(skip)
            .limit(limitNum)
            .lean(), // Use lean for better performance
          // Use estimated count for large collections (faster)
          getCount(Product, filter, total > 10000),
        ]);

        return {
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
            hasNext: skip + products.length < total,
            hasPrev: pageNum > 1,
          },
        };
      },
      300 // 5 minute cache
    );
  }

  /**
   * Get single product by ID (OPTIMIZED)
   * 
   * Optimizations:
   * - Caching for frequently accessed products
   * - Field selection
   * - Lean query
   */
  async getProductById(id) {
    const cacheKeyStr = cacheKey('product', id);

    return await withCache(
      cacheKeyStr,
      async () => {
        const product = await Product.findById(id)
          .select(ProductService.DETAIL_FIELDS)
          .populate('category', 'name slug description')
          .lean();

        if (!product) {
          const error = new Error('Product not found');
          error.statusCode = HTTP_STATUS.NOT_FOUND;
          throw error;
        }

        return product;
      },
      600 // 10 minute cache for individual products
    );
  }

  /**
   * Get product by slug (OPTIMIZED)
   * 
   * Optimizations:
   * - Caching
   * - Field selection
   * - Uses unique slug index
   */
  async getProductBySlug(slug) {
    const cacheKeyStr = cacheKey('product', 'slug', slug);

    return await withCache(
      cacheKeyStr,
      async () => {
        const product = await Product.findOne({ slug })
          .select(ProductService.DETAIL_FIELDS)
          .populate('category', 'name slug description')
          .lean();

        if (!product) {
          const error = new Error('Product not found');
          error.statusCode = HTTP_STATUS.NOT_FOUND;
          throw error;
        }

        return product;
      },
      600 // 10 minute cache
    );
  }

  /**
   * Get featured products (OPTIMIZED)
   * 
   * Optimizations:
   * - Uses featured + status + createdAt compound index
   * - Caching
   * - Field selection
   */
  async getFeaturedProducts(limit = 10) {
    const cacheKeyStr = cacheKey('products', 'featured', limit);

    return await withCache(
      cacheKeyStr,
      async () => {
        const products = await Product.find({
          status: 'active',
          featured: true,
        })
          .select(ProductService.LIST_FIELDS)
          .populate('category', 'name slug')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();

        return products;
      },
      300 // 5 minute cache
    );
  }

  /**
   * Get products by category (OPTIMIZED)
   * 
   * Optimizations:
   * - Uses category + status + createdAt compound index
   * - Caching
   * - Field selection
   */
  async getProductsByCategory(categoryId, query = {}) {
    const { page = 1, limit = 12, sort = 'newest' } = query;
    const cacheKeyStr = cacheKey('products', 'category', categoryId, page, limit, sort);

    return await withCache(
      cacheKeyStr,
      async () => {
        const filter = {
          category: categoryId,
          status: 'active',
        };

        const sortOptions = {
          newest: { createdAt: -1 },
          price_asc: { price: 1 },
          price_desc: { price: -1 },
          rating: { 'ratings.average': -1 },
        };

        const { skip, limit: limitNum } = offsetPagination(page, limit);

        const [products, total] = await Promise.all([
          Product.find(filter)
            .select(ProductService.LIST_FIELDS)
            .populate('category', 'name slug')
            .sort(sortOptions[sort] || sortOptions.newest)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Product.countDocuments(filter),
        ]);

        return {
          products,
          pagination: {
            page,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
            hasNext: skip + products.length < total,
            hasPrev: page > 1,
          },
        };
      },
      300 // 5 minute cache
    );
  }

  /**
   * Create new product (with cache invalidation)
   */
  async createProduct(productData, images = [], userId = null) {
    // Verify category exists (cached)
    const category = await withCache(
      cacheKey('category', productData.category),
      async () => await Category.findById(productData.category),
      600
    );

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
      const exists = await Product.findOne({ slug: s }).select('_id').lean();
      return !!exists;
    });

    // Upload images to Cloudinary (if files are provided)
    const uploadedImages = [];
    if (images && images.length > 0) {
      for (const image of images) {
        if (image.buffer) {
          try {
            const result = await uploadImage(image.buffer, 'products', {
              public_id: `product_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            });

            uploadedImages.push({
              url: result.url,
              publicId: result.publicId,
              isPrimary: uploadedImages.length === 0,
              order: uploadedImages.length,
            });
          } catch (error) {
            logger.error('Image upload error:', error);
          }
        }
      }
    }

    // Merge images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((img, index) => {
        if (!uploadedImages.find((u) => u.url === img.url)) {
          uploadedImages.push({
            ...img,
            order: uploadedImages.length + index,
          });
        }
      });
    }

    const finalImages = uploadedImages.length > 0 ? uploadedImages : [];

    // Create product
    const product = await Product.create({
      ...productData,
      slug,
      images: finalImages,
      createdBy: userId,
    });

    // Invalidate related caches
    await this.invalidateProductCaches();

    return await this.getProductById(product._id);
  }

  /**
   * Update product (with cache invalidation)
   */
  async updateProduct(id, productData, newImages = []) {
    const product = await Product.findById(id).select('_id category status');
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Handle category update
    if (productData.category && productData.category !== product.category.toString()) {
      const category = await Category.findById(productData.category).select('_id').lean();
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
          const exists = await Product.findOne({ slug: s, _id: { $ne: id } }).select('_id').lean();
          return !!exists;
        });
      }
    } else if (productData.slug && productData.slug !== product.slug) {
      productData.slug = await generateUniqueSlug(productData.slug, async (s) => {
        const exists = await Product.findOne({ slug: s, _id: { $ne: id } }).select('_id').lean();
        return !!exists;
      });
    }

    // Handle image uploads
    const uploadedNewImages = [];
    if (newImages && newImages.length > 0) {
      for (const image of newImages) {
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

    // Handle images from productData
    if (productData.images !== undefined) {
      productData.images = [...productData.images, ...uploadedNewImages];
    } else if (uploadedNewImages.length > 0) {
      productData.images = [...product.images, ...uploadedNewImages];
    }

    // Update product
    Object.assign(product, productData);
    await product.save();

    // Invalidate caches
    await this.invalidateProductCaches(id);

    return await this.getProductById(id);
  }

  /**
   * Delete product (with cache invalidation)
   */
  async deleteProduct(id) {
    const product = await Product.findById(id).select('images');
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
      }
    }

    await Product.findByIdAndDelete(id);

    // Invalidate caches
    await this.invalidateProductCaches(id);

    return { success: true };
  }

  /**
   * Delete product image (with cache invalidation)
   */
  async deleteProductImage(productId, imagePublicId) {
    const product = await Product.findById(productId).select('images');
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const imageIndex = product.images.findIndex((img) => img.publicId === imagePublicId);
    if (imageIndex === -1) {
      const error = new Error('Image not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    try {
      await deleteImage(imagePublicId);
    } catch (error) {
      logger.error('Error deleting image from Cloudinary:', error);
    }

    product.images.splice(imageIndex, 1);

    if (product.images.length > 0 && product.images[imageIndex]?.isPrimary) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    // Invalidate caches
    await this.invalidateProductCaches(productId);

    return await this.getProductById(productId);
  }

  /**
   * Invalidate product-related caches
   */
  async invalidateProductCaches(productId = null) {
    try {
      // Invalidate product list caches
      await delCachePattern('products:*');

      // Invalidate specific product cache
      if (productId) {
        await delCachePattern(`product:${productId}*`);
      }

      // Invalidate featured products cache
      await delCachePattern('products:featured:*');
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }
}

export default new ProductService();



