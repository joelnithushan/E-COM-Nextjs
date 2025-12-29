import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    // Variant selection (if product has variants)
    selectedVariants: [
      {
        variantName: {
          type: String,
          required: false, // Optional - products may not have variants
        },
        optionValue: {
          type: String,
          required: false, // Optional - products may not have variants
        },
      },
    ],
    // Price at time of adding to cart (snapshot)
    price: {
      type: Number,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    // Session ID for guest carts (optional)
    sessionId: {
      type: String,
      index: true,
      sparse: true,
    },
    // Expires after 30 days of inactivity
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for cart total
cartSchema.virtual('total').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Virtual for item count
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to add item to cart
cartSchema.methods.addItem = function (productId, quantity, selectedVariants, price) {
  // Check if item already exists with same variants
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.product.toString() === productId.toString() &&
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
  );

  if (existingItemIndex > -1) {
    // Update quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      selectedVariants: selectedVariants || [],
      price,
    });
  }

  // Update expiration
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function (itemId) {
  this.items = this.items.filter(
    (item) => item._id.toString() !== itemId.toString()
  );
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }
    item.quantity = quantity;
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.save();
  }
  throw new Error('Item not found in cart');
};

// Method to clear cart
cartSchema.methods.clear = function () {
  this.items = [];
  return this.save();
};

// Ensure virtuals are included in JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;




