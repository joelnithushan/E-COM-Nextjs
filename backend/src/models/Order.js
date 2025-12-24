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
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: String,
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
    cancelledAt: Date,
    cancelledReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.paymentIntentId': 1 });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const year = new Date().getFullYear();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

