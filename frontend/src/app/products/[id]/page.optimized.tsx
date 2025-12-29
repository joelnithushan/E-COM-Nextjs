'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, Product } from '@/lib/api/products.api';
import { formatCurrency } from '@/lib/utils';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { addToCart } from '@/lib/api/cart.api';
import { useAuth } from '@/contexts/AuthContext';
import ProductDetailSkeleton from '@/components/product/ProductDetailSkeleton';
import { generateProductStructuredData } from '@/lib/seo';

// Lazy load heavy components
const Badge = lazy(() => import('@/components/ui/Badge'));

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save the current URL to redirect back after login
      const returnUrl = `/products/${productId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsAddingToCart(true);
    setAddToCartError(null);

    try {
      console.log('Adding to cart:', { productId: product._id, quantity });
      const response = await addToCart({
        productId: product._id,
        quantity,
        selectedVariants: [],
      });
      
      console.log('Add to cart response:', response);
      
      if (response && response.success) {
        // Show success message briefly before redirecting
        router.push('/cart');
      } else {
        const errorMsg = response?.error?.message || 'Failed to add item to cart';
        console.error('Add to cart failed:', errorMsg);
        setAddToCartError(errorMsg);
      }
    } catch (err: any) {
      console.error('Add to cart error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status || err.status,
      });
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.status === 401) {
        setAddToCartError('Please login to add items to cart');
        const returnUrl = `/products/${productId}`;
        setTimeout(() => {
          router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        }, 2000);
      } else if (err.response?.data?.error) {
        // Backend error response format: { success: false, error: { message: "..." } }
        const errorMessage = err.response.data.error.message || 
                            err.response.data.error || 
                            'Failed to add item to cart';
        setAddToCartError(errorMessage);
      } else if (err.message) {
        setAddToCartError(err.message);
      } else {
        setAddToCartError('Failed to add item to cart. Please try again.');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Generate structured data for SEO
  useEffect(() => {
    if (product) {
      const structuredData = generateProductStructuredData({
        name: product.name,
        description: product.description,
        image: product.images[0]?.url || '',
        price: product.price,
        currency: 'USD',
        availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
        sku: (product as any).sku || product._id,
        rating: product.ratings.count > 0 ? {
          average: product.ratings.average,
          count: product.ratings.count,
        } : undefined,
      });

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [product]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
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
                  <OptimizedImage
                    src={primaryImage.url}
                    alt={primaryImage.alt || product.name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={90}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
                          ? 'border-black'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      aria-label={`View image ${index + 1} of ${product.images.length}`}
                    >
                      <OptimizedImage
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
                        loading="lazy"
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
                <span className="text-sm text-black font-medium mb-2">
                  {product.category.name}
                </span>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              {product.ratings.count > 0 && (
                <div className="flex items-center gap-2 mb-4" aria-label={`Rating: ${product.ratings.average} out of 5 stars`}>
                  <div className="flex items-center" role="img">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(product.ratings.average)
                            ? 'text-black fill-current'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
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
                      <span className="text-2xl text-gray-500 line-through" aria-label={`Original price: ${formatCurrency(product.compareAtPrice!)}`}>
                        {formatCurrency(product.compareAtPrice!)}
                      </span>
                      <Suspense fallback={<div className="bg-black text-white text-sm font-semibold px-2 py-1 rounded" />}>
                        <span className="bg-black text-white text-sm font-semibold px-2 py-1 rounded">
                          Save {Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)}%
                        </span>
                      </Suspense>
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
                  <p className="text-black font-medium">Out of Stock</p>
                ) : product.stock < 10 ? (
                  <p className="text-gray-700 font-medium">
                    Only {product.stock} left in stock
                  </p>
                ) : (
                  <p className="text-black font-medium">In Stock</p>
                )}
              </div>

              {/* Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
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



