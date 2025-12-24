'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getProduct, Product } from '@/lib/api/products.api';
import { formatCurrency } from '@/lib/utils';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Badge from '@/components/ui/Badge';
import { addToCart } from '@/lib/api/cart.api';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getProduct(productId);
        
        if (response.success) {
          setProduct(response.data.product);
        } else {
          setError('Failed to load product');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message || 
          err.message || 
          'An error occurred while loading the product'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    setAddToCartError(null);

    try {
      await addToCart({
        productId: product._id,
        quantity,
        selectedVariants: [], // TODO: Get from variant selection
      });
      router.push('/cart');
    } catch (err: any) {
      setAddToCartError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to add item to cart'
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Alert variant="error" title="Error">
          {error || 'Product not found'}
        </Alert>
      </div>
    );
  }

  const primaryImage = product.images[selectedImageIndex] || product.images[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const isOutOfStock = product.stock === 0;

  return (
    <Section padding="lg">
      <Container>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt || product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-gray-400"
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

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index
                          ? 'border-primary-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Category */}
              {product.category && (
                <span className="text-sm text-primary-600 font-medium mb-2">
                  {product.category.name}
                </span>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              {product.ratings.count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(product.ratings.average)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-2xl text-gray-500 line-through">
                        {formatCurrency(product.compareAtPrice!)}
                      </span>
                      <span className="bg-red-100 text-red-800 text-sm font-semibold px-2 py-1 rounded">
                        Save {Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {isOutOfStock ? (
                  <p className="text-red-600 font-medium">Out of Stock</p>
                ) : product.stock < 10 ? (
                  <p className="text-orange-600 font-medium">
                    Only {product.stock} left in stock
                  </p>
                ) : (
                  <p className="text-green-600 font-medium">In Stock</p>
                )}
              </div>

              {/* Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={isOutOfStock || isAddingToCart}
                  isLoading={isAddingToCart}
                  onClick={handleAddToCart}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>

              {/* Additional Info */}
              <div className="border-t border-gray-200 pt-6 space-y-2 text-sm text-gray-600">
                {product.category && (
                  <p>
                    <span className="font-medium">Category:</span> {product.category.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {addToCartError && (
          <Alert variant="error" className="mt-6">
            {addToCartError}
          </Alert>
        )}
      </Container>
    </Section>
  );
}

