import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { uploadImage, deleteImage } from '../config/cloudinary.js';
import { generateSlug, generateUniqueSlug } from '../utils/slug.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Category Service
 * Handles all category-related business logic
 */
class CategoryService {
  /**
   * Get all categories with pagination and filtering
   */
  async getCategories(query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      parent,
      search,
      sort = 'order_asc',
    } = query;

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (parent !== undefined && parent !== null && parent !== '') {
      filter.parent = parent;
    } else if (parent === null || parent === '') {
      filter.parent = null; // Root categories
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    const sortOptions = {
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      order_asc: { order: 1, name: 1 },
      order_desc: { order: -1, name: 1 },
      newest: { createdAt: -1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.order_asc;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate('parent', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Category.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + categories.length < total,
        hasPrev: Number(page) > 1,
      },
    };
  }

  /**
   * Get all categories (no pagination) - for dropdowns, etc.
   */
  async getAllCategories(filters = {}) {
    const filter = { status: 'active', ...filters };
    return Category.find(filter)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 })
      .lean();
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(id) {
    const category = await Category.findById(id)
      .populate('parent', 'name slug')
      .populate('productCount');

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug })
      .populate('parent', 'name slug')
      .populate('productCount');

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return category;
  }

  /**
   * Create new category
   */
  async createCategory(categoryData, image = null) {
    // Verify parent category exists if provided
    if (categoryData.parent) {
      const parent = await Category.findById(categoryData.parent);
      if (!parent) {
        const error = new Error('Parent category not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }
    }

    // Generate slug if not provided
    let slug = categoryData.slug;
    if (!slug) {
      slug = generateSlug(categoryData.name);
    }

    // Ensure unique slug
    slug = await generateUniqueSlug(slug, async (s) => {
      const exists = await Category.findOne({ slug: s });
      return !!exists;
    });

    // Upload image to Cloudinary if provided
    let imageData = categoryData.image || null;
    if (image) {
      try {
        const result = await uploadImage(image.buffer, 'categories', {
          public_id: `category_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        });

        imageData = {
          url: result.url,
          publicId: result.publicId,
        };
      } catch (error) {
        logger.error('Image upload error:', error);
        // Continue without image if upload fails
      }
    }

    // Create category
    const category = await Category.create({
      ...categoryData,
      slug,
      image: imageData,
    });

    return await this.getCategoryById(category._id);
  }

  /**
   * Update category
   */
  async updateCategory(id, categoryData, newImage = null) {
    const category = await Category.findById(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Handle parent update
    if (categoryData.parent !== undefined) {
      if (categoryData.parent && categoryData.parent !== category.parent?.toString()) {
        // Prevent setting self as parent
        if (categoryData.parent === id) {
          const error = new Error('Category cannot be its own parent');
          error.statusCode = HTTP_STATUS.BAD_REQUEST;
          throw error;
        }

        const parent = await Category.findById(categoryData.parent);
        if (!parent) {
          const error = new Error('Parent category not found');
          error.statusCode = HTTP_STATUS.NOT_FOUND;
          throw error;
        }
      }
    }

    // Handle slug update
    if (categoryData.name && !categoryData.slug) {
      const newSlug = generateSlug(categoryData.name);
      if (newSlug !== category.slug) {
        categoryData.slug = await generateUniqueSlug(newSlug, async (s) => {
          const exists = await Category.findOne({ slug: s, _id: { $ne: id } });
          return !!exists;
        });
      }
    } else if (categoryData.slug && categoryData.slug !== category.slug) {
      categoryData.slug = await generateUniqueSlug(categoryData.slug, async (s) => {
        const exists = await Category.findOne({ slug: s, _id: { $ne: id } });
        return !!exists;
      });
    }

    // Handle image update
    if (newImage) {
      // Delete old image if exists
      if (category.image?.publicId) {
        try {
          await deleteImage(category.image.publicId);
        } catch (error) {
          logger.error('Error deleting old image:', error);
        }
      }

      // Upload new image
      try {
        const result = await uploadImage(newImage.buffer, 'categories');
        categoryData.image = {
          url: result.url,
          publicId: result.publicId,
        };
      } catch (error) {
        logger.error('Image upload error:', error);
      }
    } else if (categoryData.image === null) {
      // Delete image if explicitly set to null
      if (category.image?.publicId) {
        try {
          await deleteImage(category.image.publicId);
        } catch (error) {
          logger.error('Error deleting image:', error);
        }
      }
      categoryData.image = null;
    }

    // Update category
    Object.assign(category, categoryData);
    await category.save();

    return await this.getCategoryById(id);
  }

  /**
   * Delete category
   */
  async deleteCategory(id) {
    const category = await Category.findById(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      const error = new Error(
        `Cannot delete category with ${productCount} product(s). Please remove or reassign products first.`
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      const error = new Error(
        `Cannot delete category with ${childrenCount} subcategory(ies). Please delete or reassign subcategories first.`
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Delete image from Cloudinary
    if (category.image?.publicId) {
      try {
        await deleteImage(category.image.publicId);
      } catch (error) {
        logger.error('Error deleting image from Cloudinary:', error);
      }
    }

    await Category.findByIdAndDelete(id);
    return { success: true };
  }
}

export default new CategoryService();


