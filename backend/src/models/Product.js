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
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
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
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: String,
        alt: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
    },
    featured: {
      type: Boolean,
      default: false,
    },
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
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;

