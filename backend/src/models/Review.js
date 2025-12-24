import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Link to order to verify purchase
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
    // Review images
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: String,
      },
    ],
    // Verified purchase badge
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // Helpful votes
    helpful: {
      count: {
        type: Number,
        default: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    // Moderation status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'spam'],
      default: 'pending',
      index: true,
    },
    // Admin moderation
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: Date,
    moderationNotes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ rating: 1 });
reviewSchema.index({ verifiedPurchase: 1 });
reviewSchema.index({ 'helpful.count': -1 }); // Sort by helpful

// Virtual for is helpful (check if user has voted)
reviewSchema.virtual('isHelpful').get(function (userId) {
  if (!userId) return false;
  return this.helpful.users.some(
    (id) => id.toString() === userId.toString()
  );
});

// Method to mark as helpful
reviewSchema.methods.markHelpful = function (userId) {
  const userIndex = this.helpful.users.findIndex(
    (id) => id.toString() === userId.toString()
  );

  if (userIndex === -1) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to unmark as helpful
reviewSchema.methods.unmarkHelpful = function (userId) {
  const userIndex = this.helpful.users.findIndex(
    (id) => id.toString() === userId.toString()
  );

  if (userIndex > -1) {
    this.helpful.users.splice(userIndex, 1);
    this.helpful.count = Math.max(0, this.helpful.count - 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to update product ratings after review
reviewSchema.statics.updateProductRatings = async function (productId) {
  const Product = mongoose.model('Product');
  const reviews = await this.find({
    product: productId,
    status: 'approved',
  });

  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': 0,
      'ratings.count': 0,
      'ratings.breakdown.5': 0,
      'ratings.breakdown.4': 0,
      'ratings.breakdown.3': 0,
      'ratings.breakdown.2': 0,
      'ratings.breakdown.1': 0,
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = totalRating / reviews.length;

  const breakdown = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  await Product.findByIdAndUpdate(productId, {
    'ratings.average': Math.round(average * 10) / 10, // Round to 1 decimal
    'ratings.count': reviews.length,
    'ratings.breakdown': breakdown,
  });
};

// Post-save hook to update product ratings
reviewSchema.post('save', async function () {
  if (this.status === 'approved') {
    await this.constructor.updateProductRatings(this.product);
  }
});

// Post-remove hook to update product ratings
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.status === 'approved') {
    await doc.constructor.updateProductRatings(doc.product);
  }
});

// Ensure virtuals are included in JSON
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

