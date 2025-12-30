'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { cart, isLoading, error, updateItemQuantity, removeItem, clearCart, refreshCart } = useCart();
  const { success: showSuccess, error: showError } = useToast();
  const [updatingItems, setUpdatingItems] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdatingItems((prev) => new Set(prev).add(itemId));
    const success = await updateItemQuantity(itemId, newQuantity);
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

    if (success) {
      showSuccess('Quantity updated', 2000);
    } else {
      showError('Failed to update quantity. Please try again.');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    const success = await removeItem(itemId);
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

    if (success) {
      showSuccess('Item removed from cart', 2000);
    } else {
      showError('Failed to remove item. Please try again.');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) {
      return;
    }

    const success = await clearCart();
    if (success) {
      showSuccess('Cart cleared', 2000);
    } else {
      showError('Failed to clear cart. Please try again.');
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
              onClick={refreshCart}
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {isEmpty ? 'Your cart is empty' : `${cart?.itemCount || 0} item(s) in your cart`}
            </p>
          </div>

          {isEmpty ? (
            <div className="text-center py-20">
              <svg
                className="w-24 h-24 mx-auto text-gray-400 mb-4"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
              <Link href="/products">
                <Button variant="primary" size="lg">
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart?.items && cart.items.length > 0 ? (
                  cart.items.map((item) => {
                    const isUpdating = updatingItems.has(item._id);
                    const productImage = item.product?.images?.find((img) => img.isPrimary) || item.product?.images?.[0];

                  return (
                    <div
                      key={item._id}
                      className={cn(
                        'bg-white border border-gray-200 rounded-lg p-4 md:p-6 transition-opacity',
                        isUpdating && 'opacity-50'
                      )}
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Product Image */}
                        <Link
                          href={`/products/${item.product.slug || item.product._id}`}
                          className="flex-shrink-0 w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden relative group"
                        >
                          {productImage?.url ? (
                            <Image
                              src={productImage.url}
                              alt={productImage.alt || item.product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 100vw, 128px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1">
                            <Link
                              href={`/products/${item.product.slug || item.product._id}`}
                              className="block"
                            >
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-black transition-colors">
                                {item.product.name}
                              </h3>
                            </Link>

                            {/* Selected Variants */}
                            {item.selectedVariants && item.selectedVariants.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.selectedVariants.map((variant, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                  >
                                    {variant.variantName}: {variant.optionValue}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-2">
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="px-4 py-2 min-w-[50px] text-center border-x border-gray-300">
                                {isUpdating ? (
                                  <Spinner size="sm" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                disabled={isUpdating}
                                className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item._id)}
                              disabled={isUpdating}
                              className="p-2 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                              aria-label="Remove item"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Item Subtotal */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                        <div className="text-right">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="ml-2 text-lg font-bold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Clear Cart Button */}
                {cart && cart.items.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearCart}
                      className="text-gray-600"
                    >
                      Clear Cart
                    </Button>
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({cart?.itemCount || 0} items)</span>
                      <span className="font-semibold">{formatCurrency(cart?.total || 0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-semibold">Calculated at checkout</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(cart?.total || 0)}</span>
                    </div>
                  </div>

                  <Link href="/checkout" className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <Link href="/products" className="block mt-3">
                    <Button variant="outline" size="lg" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>

                  {cart?.validationWarnings && cart.validationWarnings.length > 0 && (
                    <Alert variant="warning" className="mt-4">
                      <p className="font-semibold mb-2">Cart Updated:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {cart.validationWarnings.map((warning, idx) => (
                          <li key={idx}>{warning.reason}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>
    </ProtectedRoute>
  );
}
