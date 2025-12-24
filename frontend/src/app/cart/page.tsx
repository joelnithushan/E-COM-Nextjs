'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  getCart,
  removeCartItem,
  updateCartItem,
  Cart,
  CartItem,
} from '@/lib/api/cart.api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCart();

      if (response.success) {
        setCart(response.data.cart);
      } else {
        setError('Failed to load cart');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'An error occurred while loading your cart'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      const response = await updateCartItem(itemId, newQuantity);
      if (response.success) {
        setCart(response.data.cart);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to update item quantity'
      );
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      const response = await removeCartItem(itemId);
      if (response.success) {
        setCart(response.data.cart);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to remove item'
      );
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <Section padding="lg">
        <Container>
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </Container>
      </Section>
    );
  }

  if (error && !cart) {
    return (
      <Section padding="lg">
        <Container>
          <Alert variant="error" title="Error">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCart}
              className="mt-4"
            >
              Try Again
            </Button>
          </Alert>
        </Container>
      </Section>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <ProtectedRoute requireAuth>
      <Section padding="lg">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600">
            {isEmpty
              ? 'Your cart is empty'
              : `${cart.itemCount} item${cart.itemCount !== 1 ? 's' : ''} in your cart`}
          </p>
        </div>

        {cart?.validationWarnings && cart.validationWarnings.length > 0 && (
          <Alert variant="warning" className="mb-6">
            <div className="space-y-1">
              {cart.validationWarnings.map((warning, index) => (
                <p key={index} className="text-sm">
                  {warning.reason}
                </p>
              ))}
            </div>
          </Alert>
        )}

        {isEmpty ? (
          <Card padding="lg" className="text-center">
            <div className="py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Start shopping to add items to your cart
              </p>
              <Link href="/products">
                <Button variant="primary" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const isUpdating = updatingItems.has(item._id);
                const productImage =
                  item.product.image?.url ||
                  '/placeholder-product.jpg';

                return (
                  <Card key={item._id} padding="md" hover={false}>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <Link
                        href={`/products/${item.product._id}`}
                        className="relative w-full sm:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                      >
                        <Image
                          src={productImage}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product._id}`}
                          className="block"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>

                        {item.selectedVariants &&
                          item.selectedVariants.length > 0 && (
                            <div className="text-sm text-gray-600 mb-2">
                              {item.selectedVariants.map((variant, idx) => (
                                <span key={idx}>
                                  {variant.variantName}: {variant.optionValue}
                                  {idx < item.selectedVariants.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          )}

                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item._id, item.quantity - 1)
                              }
                              disabled={isUpdating}
                              className="px-3 py-1.5 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="px-4 py-1.5 border-x border-gray-300 min-w-[3rem] text-center">
                              {isUpdating ? (
                                <Spinner size="sm" />
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item._id, item.quantity + 1)
                              }
                              disabled={isUpdating}
                              className="px-3 py-1.5 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.price)} each
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          disabled={isUpdating}
                          className="mt-2 text-sm text-error-600 hover:text-error-700 font-medium disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(cart.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(cart.total)}</span>
                  </div>
                </div>

                <Link href="/checkout" className="block">
                  <Button variant="primary" size="lg" fullWidth>
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link
                  href="/products"
                  className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Continue Shopping
                </Link>
              </Card>
            </div>
          </div>
        )}
      </Container>
    </Section>
    </ProtectedRoute>
  );
}

