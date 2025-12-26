'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Optimized Image Component
 * 
 * Features:
 * - Automatic format optimization (AVIF/WebP)
 * - Lazy loading by default
 * - Priority loading for above-fold images
 * - Responsive sizing
 * - Blur placeholder support
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  loading = priority ? 'eager' : 'lazy',
  placeholder = 'empty',
  blurDataURL,
}) => {
  // Generate blur placeholder if not provided
  const defaultBlurDataURL =
    blurDataURL ||
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  const imageProps: any = {
    src,
    alt,
    className: cn('object-cover', className),
    quality,
    loading,
    sizes,
    priority,
  };

  if (placeholder === 'blur' && blurDataURL) {
    imageProps.placeholder = 'blur' as const;
    imageProps.blurDataURL = blurDataURL || defaultBlurDataURL;
  }

  if (fill) {
    return <Image {...imageProps} fill />;
  }

  if (!width || !height) {
    console.warn('OptimizedImage: width and height are required when fill is false');
    return null;
  }

  return <Image {...imageProps} width={width} height={height} />;
};

export default OptimizedImage;



