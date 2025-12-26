import React from 'react';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

interface ProductCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for ProductCard
 * Provides visual feedback during loading
 */
const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden',
        'flex flex-col h-full animate-pulse',
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {/* Image Skeleton */}
      <div className="relative w-full aspect-square bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        {/* Category */}
        <Skeleton variant="text" className="w-20 h-3" />

        {/* Title */}
        <Skeleton variant="text" className="w-3/4 h-4" />
        <Skeleton variant="text" className="w-1/2 h-4" />

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Skeleton variant="text" className="w-20 h-4" />
        </div>

        {/* Price */}
        <Skeleton variant="text" className="w-24 h-6 mt-auto" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;



