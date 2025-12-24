import Coupon from '../models/Coupon.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import featureToggleService from './feature-toggle.service.js';
import { FEATURE_FLAGS } from '../config/feature-flags.js';

/**
 * Coupon Service
 * Handles coupon validation, discount calculation, and usage tracking
 */
class CouponService {
  /**
   * Check if coupons feature is enabled
   */
  async checkFeatureEnabled(clientId = null) {
    const isEnabled = await featureToggleService.isFeatureEnabled(
      clientId,
      FEATURE_FLAGS.COUPONS
    );
    
    if (!isEnabled) {
      const error = new Error('Coupons feature is not enabled');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }
    
    return true;
  }

  /**
   * Validate and apply coupon
   * @param {String} code - Coupon code
   * @param {Number} orderTotal - Order total in cents
   * @param {String} userId - User ID (for per-user limit check)
   * @param {Array} items - Order items (for product/category validation)
   * @returns {Promise<Object>} Discount calculation result
   */
  async validateAndApplyCoupon(code, orderTotal, userId = null, items = []) {
    // Check if feature is enabled
    await this.checkFeatureEnabled();

    if (!code || typeof code !== 'string') {
      const error = new Error('Coupon code is required');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Find coupon by code
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      const error = new Error('Invalid coupon code');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Check if coupon is valid (not expired, active, etc.)
    if (!coupon.isValid) {
      if (!coupon.isActive) {
        const error = new Error('Coupon is not active');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        const error = new Error('Coupon has expired');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      if (coupon.startsAt && coupon.startsAt > new Date()) {
        const error = new Error('Coupon is not yet active');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      if (coupon.isUsageLimitReached) {
        const error = new Error('Coupon usage limit reached');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
    }

    // Check per-user limit (if user is provided)
    if (userId) {
      // This would require tracking user coupon usage
      // For now, we'll check in order creation
      // TODO: Implement user coupon usage tracking
    }

    // Extract product and category IDs from items
    const productIds = items.map((item) => item.product?._id || item.product).filter(Boolean);
    const categoryIds = items
      .map((item) => item.product?.category || item.category)
      .filter(Boolean);

    // Check if coupon is applicable to these products
    if (!coupon.isApplicableToProducts(productIds, categoryIds)) {
      const error = new Error('Coupon is not applicable to items in your cart');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Calculate discount
    const discountResult = coupon.calculateDiscount(orderTotal, items);

    if (!discountResult.valid) {
      const error = new Error(discountResult.error);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    return {
      coupon: {
        id: coupon._id.toString(),
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
      discountAmount: discountResult.discountAmount,
      discountType: discountResult.discountType,
      discountValue: discountResult.discountValue,
      finalAmount: orderTotal - discountResult.discountAmount,
    };
  }

  /**
   * Get all coupons (admin)
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} Coupons with pagination
   */
  async getAllCoupons(query = {}) {
    await this.checkFeatureEnabled();

    const {
      page = 1,
      limit = 20,
      isActive,
      search,
      discountType,
      expired,
    } = query;

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (discountType) {
      filter.discountType = discountType;
    }

    if (expired === 'true' || expired === true) {
      filter.expiresAt = { $lt: new Date() };
    } else if (expired === 'false' || expired === false) {
      filter.$or = [
        { expiresAt: { $gte: new Date() } },
        { expiresAt: null },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .populate('createdBy', 'name email')
        .populate('applicableProducts', 'name')
        .populate('applicableCategories', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    return {
      coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + coupons.length < total,
        hasPrev: Number(page) > 1,
      },
    };
  }

  /**
   * Get coupon by ID
   * @param {String} couponId - Coupon ID
   * @returns {Promise<Object>} Coupon
   */
  async getCouponById(couponId) {
    await this.checkFeatureEnabled();

    const coupon = await Coupon.findById(couponId)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name')
      .populate('excludedProducts', 'name')
      .populate('excludedCategories', 'name');

    if (!coupon) {
      const error = new Error('Coupon not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return coupon;
  }

  /**
   * Get coupon by code
   * @param {String} code - Coupon code
   * @returns {Promise<Object>} Coupon
   */
  async getCouponByCode(code) {
    await this.checkFeatureEnabled();

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() })
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');

    if (!coupon) {
      const error = new Error('Coupon not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return coupon;
  }

  /**
   * Create coupon
   * @param {Object} couponData - Coupon data
   * @param {String} userId - Admin user ID
   * @returns {Promise<Object>} Created coupon
   */
  async createCoupon(couponData, userId) {
    await this.checkFeatureEnabled();

    // Normalize code
    if (couponData.code) {
      couponData.code = couponData.code.toUpperCase().trim();
    }

    // Validate discount value
    if (couponData.discountType === 'percentage') {
      if (couponData.discountValue < 0 || couponData.discountValue > 100) {
        const error = new Error('Percentage discount must be between 0 and 100');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: couponData.code });
    if (existingCoupon) {
      const error = new Error('Coupon code already exists');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const coupon = await Coupon.create({
      ...couponData,
      createdBy: userId,
    });

    logger.info(`Coupon created: ${coupon.code} by user: ${userId}`);

    return await this.getCouponById(coupon._id);
  }

  /**
   * Update coupon
   * @param {String} couponId - Coupon ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated coupon
   */
  async updateCoupon(couponId, updateData) {
    await this.checkFeatureEnabled();

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      const error = new Error('Coupon not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Normalize code if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().trim();
      
      // Check if new code conflicts with existing coupon
      if (updateData.code !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: updateData.code });
        if (existingCoupon) {
          const error = new Error('Coupon code already exists');
          error.statusCode = HTTP_STATUS.CONFLICT;
          throw error;
        }
      }
    }

    // Validate discount value if updating
    if (updateData.discountType === 'percentage' || coupon.discountType === 'percentage') {
      const discountValue = updateData.discountValue ?? coupon.discountValue;
      if (discountValue < 0 || discountValue > 100) {
        const error = new Error('Percentage discount must be between 0 and 100');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
    }

    Object.assign(coupon, updateData);
    await coupon.save();

    logger.info(`Coupon updated: ${coupon.code}`);

    return await this.getCouponById(coupon._id);
  }

  /**
   * Delete coupon
   * @param {String} couponId - Coupon ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCoupon(couponId) {
    await this.checkFeatureEnabled();

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      const error = new Error('Coupon not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    await Coupon.findByIdAndDelete(couponId);

    logger.info(`Coupon deleted: ${coupon.code}`);

    return { success: true, message: 'Coupon deleted successfully' };
  }

  /**
   * Increment coupon usage (called after successful order)
   * @param {String} couponId - Coupon ID
   * @returns {Promise<Object>} Updated coupon
   */
  async incrementCouponUsage(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      logger.warn(`Attempted to increment usage for non-existent coupon: ${couponId}`);
      return null;
    }

    await coupon.incrementUsage();
    return coupon;
  }

  /**
   * Validate coupon code (public endpoint)
   * @param {String} code - Coupon code
   * @param {Number} orderTotal - Order total in cents
   * @param {Array} items - Order items
   * @returns {Promise<Object>} Validation result
   */
  async validateCoupon(code, orderTotal, items = []) {
    await this.checkFeatureEnabled();

    try {
      const result = await this.validateAndApplyCoupon(code, orderTotal, null, items);
      return {
        valid: true,
        coupon: result.coupon,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

export default new CouponService();

