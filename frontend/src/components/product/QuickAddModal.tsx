'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/api/products.api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { cn } from '@/lib/utils';

interface QuickAddModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedVariants {
  [variantName: string]: string; // e.g., { "Size": "M", "Color": "Green" }
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ product, isOpen, onClose }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToCart, isUpdating } = useCart();
  const { success: showSuccess, error: showError } = useToast();
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  // Initialize selected variants with first available option for each variant
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const initial: SelectedVariants = {};
      product.variants.forEach((variant) => {
        const firstAvailable = variant.options.find((opt) => (opt.stock || 0) > 0);
        if (firstAvailable) {
          initial[variant.name] = firstAvailable.value;
        }
      });
      setSelectedVariants(initial);
    }
  }, [product]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      setError(null);
      // Reset selected variants to first available
      if (product.variants && product.variants.length > 0) {
        const initial: SelectedVariants = {};
        product.variants.forEach((variant) => {
          const firstAvailable = variant.options.find((opt) => (opt.stock || 0) > 0);
          if (firstAvailable) {
            initial[variant.name] = firstAvailable.value;
          }
        });
        setSelectedVariants(initial);
      }
    }
  }, [isOpen, product]);

  // Get available stock for selected variant combination
  const getAvailableStock = (): number => {
    if (!product.variants || product.variants.length === 0) {
      return product.stock || 0;
    }

    // Find the stock for the selected variant combination
    for (const variant of product.variants) {
      const selectedValue = selectedVariants[variant.name];
      if (selectedValue) {
        const option = variant.options.find((opt) => opt.value === selectedValue);
        if (option && option.stock !== undefined) {
          return option.stock;
        }
      }
    }
    return 0;
  };

  const availableStock = getAvailableStock();
  const isOutOfStock = availableStock === 0;

  const handleVariantChange = (variantName: string, value: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: value,
    }));
    setError(null);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
      setError(null);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Validate variant selection
    if (product.variants && product.variants.length > 0) {
      const missingVariants = product.variants.filter(
        (variant) => !selectedVariants[variant.name]
      );
      if (missingVariants.length > 0) {
        const errorMsg = `Please select ${missingVariants.map((v) => v.name).join(' and ')}`;
        setError(errorMsg);
        showError(errorMsg);
        return;
      }
    }

    if (quantity > availableStock) {
      const errorMsg = `Only ${availableStock} available in stock`;
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    setError(null);

    const selectedVariantsArray = Object.entries(selectedVariants).map(([name, value]) => ({
      variantName: name,
      optionValue: value,
    }));

    const success = await addToCart(product._id, quantity, selectedVariantsArray);

    if (success) {
      showSuccess(`${product.name} added to cart!`, 2000);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      const errorMsg = 'Failed to add item to cart. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Quick Add</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {primaryImage?.url ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
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
            </div>

            {/* Product Info & Options */}
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="ml-2 text-lg text-gray-500 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Variant Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-4 mb-6">
                  {product.variants.map((variant) => (
                    <div key={variant.name}>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {variant.name}:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {variant.options.map((option) => {
                          const isSelected = selectedVariants[variant.name] === option.value;
                          const isOutOfStock = (option.stock || 0) === 0;
                          const isAvailable = !isOutOfStock;

                          return (
                            <button
                              key={option.value}
                              onClick={() => isAvailable && handleVariantChange(variant.name, option.value)}
                              disabled={!isAvailable}
                              className={cn(
                                'px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all',
                                isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400',
                                !isAvailable && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {option.value}
                              {!isAvailable && ' (Out of Stock)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Quantity:
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-gray-300 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= availableStock}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                {availableStock > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    {availableStock} available in stock
                  </p>
                )}
              </div>

              {/* Error Messages */}
              {error && (
                <Alert variant="error" className="mb-4">
                  {error}
                </Alert>
              )}

              {/* Add to Cart Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isOutOfStock || isUpdating}
                isLoading={isUpdating}
                onClick={handleAddToCart}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;

