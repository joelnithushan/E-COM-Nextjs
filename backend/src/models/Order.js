import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true, // Snapshot of product name
        },
        sku: {
          type: String, // Snapshot of SKU
        },
        price: {
          type: Number,
          required: true, // Snapshot of price at time of order
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: {
          type: String, // Snapshot of product image
        },
        // Variant information (snapshot)
        selectedVariants: [
          {
            variantName: String,
            optionValue: String,
          },
        ],
        subtotal: {
          type: Number,
          required: true,
        },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    billingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ['stripe', 'paypal', 'payhere'],
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
        index: true,
      },
      transactionId: String,
      paymentIntentId: String, // Stripe Payment Intent ID
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'usd',
      },
      paidAt: Date,
      refundedAt: Date,
    },
    shipping: {
      method: {
        type: String,
        required: true,
      },
      cost: {
        type: Number,
        required: true,
        min: 0,
      },
      trackingNumber: String,
      carrier: String,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Discount amount cannot be negative'],
      },
      couponCode: {
        type: String,
      },
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
      },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      discountValue: {
        type: Number,
      },
    },
    tax: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    notes: String,
    // Admin notes (internal)
    adminNotes: String,
    cancelledAt: Date,
    cancelledReason: String,
    // Timestamps for order lifecycle
    paidAt: {
      type: Date,
      index: true,
    },
    processingAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

// ============================================
// OPTIMIZED INDEXES FOR PERFORMANCE
// ============================================

// Unique indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });

// Compound indexes for common query patterns
// 1. User + CreatedAt (user's order history - most common)
orderSchema.index({ user: 1, createdAt: -1 });

// 2. Status + CreatedAt (admin order listing by status)
orderSchema.index({ status: 1, createdAt: -1 });

// 3. Payment Status + CreatedAt (payment tracking)
orderSchema.index({ 'payment.status': 1, createdAt: -1 });

// 4. User + Status (user's orders by status)
orderSchema.index({ user: 1, status: 1, createdAt: -1 });

// 5. Status + Payment Status (admin filtering)
orderSchema.index({ status: 1, 'payment.status': 1, createdAt: -1 });

// 6. Payment Intent ID (for webhook lookups)
orderSchema.index({ 'payment.paymentIntentId': 1 }, { sparse: true });

// 7. Transaction ID (for payment lookups)
orderSchema.index({ 'payment.transactionId': 1 }, { sparse: true });

// 8. PaidAt (for revenue reports)
orderSchema.index({ paidAt: -1 });

// 9. CreatedAt (for time-based queries)
orderSchema.index({ createdAt: -1 });

// 10. Text search for order number (already indexed, but explicit)
orderSchema.index({ orderNumber: 'text' });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    // Use a more efficient method: timestamp + random
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
