import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    // Base price (used if no variants, or as default variant price)
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
        },
        alt: {
          type: String,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0, // For image ordering
        },
      },
    ],
    // Product variants (size, color, etc.)
    variants: [
      {
        name: {
          type: String,
          required: true, // e.g., "Size", "Color"
        },
        options: [
          {
            value: {
              type: String,
              required: true, // e.g., "Small", "Red"
            },
            price: {
              type: Number,
              default: 0, // Additional price for this variant
            },
            sku: {
              type: String,
            },
            stock: {
              type: Number,
              default: 0,
            },
            image: {
              type: String, // Variant-specific image
            },
          },
        ],
      },
    ],
    // Overall stock (used if no variants)
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    // Track inventory
    trackInventory: {
      type: Boolean,
      default: true,
    },
    // Allow backorders when out of stock
    allowBackorder: {
      type: Boolean,
      default: false,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // Weight and dimensions for shipping
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // SEO fields
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title should not exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description should not exceed 160 characters'],
    },
    // Ratings (calculated from reviews)
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
      breakdown: {
        // Rating distribution
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    // Sales tracking
    salesCount: {
      type: Number,
      default: 0,
    },
    // Created by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Text search
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, featured: 1, createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ sku: 1 }, { sparse: true });
productSchema.index({ tags: 1 });
productSchema.index({ 'ratings.average': -1 }); // For sorting by rating

// Virtual for in-stock status
productSchema.virtual('inStock').get(function () {
  if (this.variants && this.variants.length > 0) {
    // Check if any variant has stock
    return this.variants.some((variant) =>
      variant.options.some((option) => option.stock > 0)
    );
  }
  return this.stock > 0;
});

// Virtual for has variants
productSchema.virtual('hasVariants').get(function () {
  return this.variants && this.variants.length > 0;
});

// Method to get total stock (including variants)
productSchema.methods.getTotalStock = function () {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((total, variant) => {
      return (
        total +
        variant.options.reduce((sum, option) => sum + (option.stock || 0), 0)
      );
    }, 0);
  }
  return this.stock || 0;
};

// Method to get minimum price (including variants)
productSchema.methods.getMinPrice = function () {
  if (this.variants && this.variants.length > 0) {
    const variantPrices = this.variants.map((variant) =>
      variant.options.map((option) => this.price + (option.price || 0))
    );
    // Flatten and get minimum
    const allPrices = variantPrices.flat();
    return Math.min(...allPrices, this.price);
  }
  return this.price;
};

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;

