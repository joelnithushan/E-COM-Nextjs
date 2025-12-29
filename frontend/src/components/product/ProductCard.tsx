'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/api/products.api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import QuickAddModal from './QuickAddModal';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className={cn(
        'group relative bg-white rounded-lg border border-gray-200 overflow-hidden',
        'hover:shadow-lg transition-all duration-300',
        'flex flex-col h-full',
        isOutOfStock && 'opacity-60',
        className
      )}
    >
      {/* Image Container - Clickable to product page */}
      <Link href={`/products/${product._id}`} className="relative w-full aspect-square bg-gray-100 overflow-hidden block">
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="image-placeholder w-full h-full flex items-center justify-center bg-gray-200" style={{ display: primaryImage?.url ? 'none' : 'flex' }}>
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

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="bg-black text-white text-xs font-semibold px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
          {product.featured && (
            <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-900 font-semibold px-4 py-2 rounded">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Add & View Overlay (on hover) */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsQuickAddOpen(true);
            }}
            className="bg-white text-gray-900 font-medium px-4 py-2 rounded shadow-lg hover:bg-gray-100 transition-colors"
          >
            Quick Add
          </button>
          <Link
            href={`/products/${product._id}`}
            className="bg-white text-gray-900 font-medium px-4 py-2 rounded shadow-lg hover:bg-gray-100 transition-colors"
          >
            View Details
          </Link>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category */}
        {product.category && (
          <span className="text-xs text-gray-500 mb-1">{product.category.name}</span>
        )}

        {/* Title - Clickable to product page */}
        <Link href={`/products/${product._id}`}>
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-black transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.ratings.count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < Math.round(product.ratings.average)
                      ? 'text-black fill-current'
                      : 'text-gray-300'
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.ratings.count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {formatCurrency(product.compareAtPrice!)}
            </span>
          )}
        </div>

        {/* Stock Indicator */}
        {!isOutOfStock && product.stock < 10 && (
          <p className="text-xs text-gray-700 mt-1">
            Only {product.stock} left in stock
          </p>
        )}

        {/* Quick Add Button - Always Visible */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsQuickAddOpen(true);
          }}
          className="mt-3 w-full bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isOutOfStock}
        >
          Quick Add
        </button>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        product={product}
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
};

export default ProductCard;




