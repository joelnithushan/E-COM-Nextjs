'use client';

import React, { lazy, Suspense } from 'react';
import { Product } from '@/lib/api/products.api';
import { cn } from '@/lib/utils';
import ProductCardSkeleton from './ProductCardSkeleton';

// Lazy load ProductCard for code splitting
const ProductCard = lazy(() => import('./ProductCard.optimized'));

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  className?: string;
  priorityCount?: number; // Number of products to load with priority (above-fold)
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  className,
  priorityCount = 4, // First 4 products get priority loading
}) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
          className
        )}
      >
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12" role="status" aria-live="polite">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
        className
      )}
      role="list"
    >
      {products.map((product, index) => (
        <Suspense
          key={product._id}
          fallback={<ProductCardSkeleton />}
        >
          <div role="listitem">
            <ProductCard
              product={product}
              priority={index < priorityCount}
            />
          </div>
        </Suspense>
      ))}
    </div>
  );
};

export default ProductGrid;



