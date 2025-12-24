import apiClient from './client';

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    image?: {
      url: string;
      alt?: string;
    };
  };
  quantity: number;
  selectedVariants: Array<{
    variantName: string;
    optionValue: string;
  }>;
  price: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  total: number;
  itemCount: number;
  validationWarnings?: Array<{
    productId: string;
    reason: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  success: boolean;
  data: {
    cart: Cart;
  };
}

export interface CartSummary {
  items: Array<{
    _id: string;
    product: {
      _id: string;
      name: string;
      slug: string;
      image?: {
        url: string;
        alt?: string;
      };
    };
    quantity: number;
    selectedVariants: Array<{
      variantName: string;
      optionValue: string;
    }>;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  itemCount: number;
  validationWarnings?: Array<{
    productId: string;
    reason: string;
  }>;
}

export interface CartSummaryResponse {
  success: boolean;
  data: CartSummary;
}

/**
 * Get user's cart
 */
export const getCart = async (): Promise<CartResponse> => {
  return apiClient.get('/cart');
};

/**
 * Add item to cart
 */
export const addToCart = async (data: {
  productId: string;
  quantity: number;
  selectedVariants?: Array<{
    variantName: string;
    optionValue: string;
  }>;
}): Promise<CartResponse> => {
  return apiClient.post('/cart/items', data);
};

/**
 * Update item quantity
 */
export const updateCartItem = async (
  itemId: string,
  quantity: number
): Promise<CartResponse> => {
  return apiClient.put(`/cart/items/${itemId}`, { quantity });
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (itemId: string): Promise<CartResponse> => {
  return apiClient.delete(`/cart/items/${itemId}`);
};

/**
 * Clear cart
 */
export const clearCart = async (): Promise<CartResponse> => {
  return apiClient.delete('/cart');
};

/**
 * Get cart summary for checkout
 */
export const getCartSummary = async (): Promise<CartSummaryResponse> => {
  return apiClient.get('/cart/summary');
};


