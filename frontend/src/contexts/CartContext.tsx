'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeCartItem as removeCartItemApi,
  clearCart as clearCartApi,
  Cart,
  CartItem,
} from '@/lib/api/cart.api';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
  total: number;
  addToCart: (productId: string, quantity: number, selectedVariants?: Array<{ variantName: string; optionValue: string }>) => Promise<boolean>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isUpdating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

const CART_STORAGE_KEY = 'zyra_cart_cache';

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load cart from cache on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CART_STORAGE_KEY);
        if (cached) {
          const parsedCart = JSON.parse(cached);
          setCart(parsedCart);
        }
      } catch (e) {
        // Ignore cache errors
      }
    }
  }, []);

  // Fetch cart from API when authenticated
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getCart();

      if (response.success) {
        const cartData = response.data.cart;
        // Ensure items array exists and has valid structure
        if (cartData && (!cartData.items || !Array.isArray(cartData.items))) {
          cartData.items = [];
        }
        setCart(cartData);
        // Cache cart
        if (typeof window !== 'undefined') {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
        }
      } else {
        setError('Failed to load cart');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cart');
      // Don't clear cart on error - keep cached version
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch cart when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Clear cart when logged out
      setCart(null);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, [isAuthenticated, refreshCart]);

  // Optimistic update helper
  const optimisticUpdate = useCallback((updater: (cart: Cart | null) => Cart | null) => {
    setCart((prevCart) => {
      const updated = updater(prevCart);
      if (updated && typeof window !== 'undefined') {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const addToCart = useCallback(async (
    productId: string,
    quantity: number,
    selectedVariants?: Array<{ variantName: string; optionValue: string }>
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await addToCartApi({
        productId,
        quantity,
        selectedVariants: selectedVariants || [],
      });

      if (response.success) {
        setCart(response.data.cart);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data.cart));
        }
        return true;
      } else {
        setError(response.error?.message || 'Failed to add item to cart');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to add item to cart';
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated]);

  const updateItemQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    if (!isAuthenticated || !cart) {
      return false;
    }

    // Optimistic update
    optimisticUpdate((prevCart) => {
      if (!prevCart) return null;
      const itemIndex = prevCart.items.findIndex((item) => item._id === itemId);
      if (itemIndex === -1) return prevCart;

      const updatedItems = [...prevCart.items];
      if (quantity <= 0) {
        updatedItems.splice(itemIndex, 1);
      } else {
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity };
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    });

    setIsUpdating(true);
    setError(null);

    try {
      const response = await updateCartItemApi(itemId, quantity);
      if (response.success) {
        setCart(response.data.cart);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data.cart));
        }
        return true;
      } else {
        // Revert on error
        refreshCart();
        setError(response.error?.message || 'Failed to update item quantity');
        return false;
      }
    } catch (err: any) {
      // Revert on error
      refreshCart();
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update item quantity';
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated, cart, optimisticUpdate, refreshCart]);

  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!isAuthenticated || !cart) {
      return false;
    }

    // Optimistic update
    optimisticUpdate((prevCart) => {
      if (!prevCart) return null;
      const updatedItems = prevCart.items.filter((item) => item._id !== itemId);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    });

    setIsUpdating(true);
    setError(null);

    try {
      const response = await removeCartItemApi(itemId);
      if (response.success) {
        setCart(response.data.cart);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data.cart));
        }
        return true;
      } else {
        // Revert on error
        refreshCart();
        setError(response.error?.message || 'Failed to remove item');
        return false;
      }
    } catch (err: any) {
      // Revert on error
      refreshCart();
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to remove item';
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated, cart, optimisticUpdate, refreshCart]);

  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await clearCartApi();
      if (response.success) {
        setCart(response.data.cart);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data.cart));
        }
        return true;
      } else {
        setError(response.error?.message || 'Failed to clear cart');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to clear cart';
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated]);

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    itemCount: cart?.itemCount || 0,
    total: cart?.total || 0,
    addToCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    refreshCart,
    isUpdating,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

