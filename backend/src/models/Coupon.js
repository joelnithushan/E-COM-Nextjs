import mongoose from 'mongoose';

/**
 * Coupon Model
 * Handles discount codes for the e-commerce platform
 */
const couponSchema = new mongoose.Schema(
  {
    // Coupon code (unique, uppercase)
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [50, 'Coupon code cannot exceed 50 characters'],
      match: [/^[A-Z0-9_-]+$/, 'Coupon code can only contain letters, numbers, hyphens, and underscores'],
      index: true,
    },
    
    // Discount type
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    
    // Discount value
    // For percentage: 0-100 (e.g., 10 = 10% off)
    // For fixed: amount in cents (e.g., 1000 = $10.00 off)
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
      validate: {
        validator: function(value) {
          if (this.discountType === 'percentage') {
            return value >= 0 && value <= 100;
          }
          return value >= 0;
        },
        message: 'Percentage discount must be between 0 and 100',
      },
    },
    
    // Minimum order value (in cents)
    minimumOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order value cannot be negative'],
    },
    
    // Maximum discount amount (for percentage discounts, in cents)
    // If set, percentage discount is capped at this amount
    maxDiscountAmount: {
      type: Number,
      min: [0, 'Maximum discount amount cannot be negative'],
    },
    
    // Expiry date
    expiresAt: {
      type: Date,
      index: true, // Index for querying active coupons
    },
    
    // Start date (coupon becomes active on this date)
    startsAt: {
      type: Date,
      default: Date.now,
    },
    
    // Usage limits
    usageLimit: {
      type: Number,
      min: [0, 'Usage limit cannot be negative'],
      // null = unlimited
    },
    
    // Current usage count
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
    
    // Per-user usage limit (how many times a single user can use this coupon)
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per user limit must be at least 1'],
    },
    
    // Applicable to specific products/categories
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    
    // Excluded products/categories
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    
    excludedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Description
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    
    // Created by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Notes (internal)
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Compound index for active coupons query
couponSchema.index({ isActive: 1, expiresAt: 1, startsAt: 1 });

// Index for code lookup (already unique, but explicit for clarity)
couponSchema.index({ code: 1 }, { unique: true });

// Index for expiry date (for cleanup queries)
couponSchema.index({ expiresAt: 1 });

// ============================================
// VIRTUALS
// ============================================

// Check if coupon is currently valid (not expired, active, within date range)
couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    return false;
  }
  
  // Check if started
  if (this.startsAt && this.startsAt > now) {
    return false;
  }
  
  // Check if expired
  if (this.expiresAt && this.expiresAt < now) {
    return false;
  }
  
  // Check usage limit
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
    return false;
  }
  
  return true;
});

// Check if coupon has reached usage limit
couponSchema.virtual('isUsageLimitReached').get(function () {
  if (this.usageLimit === null) {
    return false;
  }
  return this.usageCount >= this.usageLimit;
});

// ============================================
// METHODS
// ============================================

/**
 * Calculate discount amount for an order
 * @param {Number} orderTotal - Order total in cents
 * @param {Array} items - Order items (for product/category validation)
 * @returns {Object} Discount calculation result
 */
couponSchema.methods.calculateDiscount = function (orderTotal, items = []) {
  // Validate minimum order value
  if (orderTotal < this.minimumOrderValue) {
    return {
      valid: false,
      error: `Minimum order value of $${(this.minimumOrderValue / 100).toFixed(2)} required`,
      discountAmount: 0,
    };
  }
  
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    // Calculate percentage discount
    discountAmount = Math.round((orderTotal * this.discountValue) / 100);
    
    // Apply maximum discount cap if set
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    // Fixed discount (cannot exceed order total)
    discountAmount = Math.min(this.discountValue, orderTotal);
  }
  
  return {
    valid: true,
    discountAmount,
    discountType: this.discountType,
    discountValue: this.discountValue,
  };
};

/**
 * Check if coupon is applicable to specific products
 * @param {Array} productIds - Product IDs to check
 * @param {Array} categoryIds - Category IDs to check
 * @returns {Boolean}
 */
couponSchema.methods.isApplicableToProducts = function (productIds = [], categoryIds = []) {
  // If no restrictions, applicable to all
  if (
    (!this.applicableProducts || this.applicableProducts.length === 0) &&
    (!this.applicableCategories || this.applicableCategories.length === 0)
  ) {
    // Check exclusions
    if (this.excludedProducts && this.excludedProducts.length > 0) {
      const hasExcludedProduct = productIds.some((id) =>
        this.excludedProducts.some((excludedId) => excludedId.toString() === id.toString())
      );
      if (hasExcludedProduct) {
        return false;
      }
    }
    
    if (this.excludedCategories && this.excludedCategories.length > 0) {
      const hasExcludedCategory = categoryIds.some((id) =>
        this.excludedCategories.some((excludedId) => excludedId.toString() === id.toString())
      );
      if (hasExcludedCategory) {
        return false;
      }
    }
    
    return true;
  }
  
  // Check if product is in applicable list
  if (this.applicableProducts && this.applicableProducts.length > 0) {
    const hasApplicableProduct = productIds.some((id) =>
      this.applicableProducts.some((applicableId) => applicableId.toString() === id.toString())
    );
    if (hasApplicableProduct) {
      return true;
    }
  }
  
  // Check if category is in applicable list
  if (this.applicableCategories && this.applicableCategories.length > 0) {
    const hasApplicableCategory = categoryIds.some((id) =>
      this.applicableCategories.some((applicableId) => applicableId.toString() === id.toString())
    );
    if (hasApplicableCategory) {
      return true;
    }
  }
  
  return false;
};

/**
 * Increment usage count
 */
couponSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  await this.save();
};

// Ensure virtuals are included in JSON
couponSchema.set('toJSON', { virtuals: true });
couponSchema.set('toObject', { virtuals: true });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;



