import React from 'react';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Skeleton from '@/components/ui/Skeleton';

/**
 * Skeleton loader for Product Detail Page
 */
const ProductDetailSkeleton: React.FC = () => {
  return (
    <Section padding="lg">
      <Container>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Gallery Skeleton */}
            <div>
              <Skeleton variant="rectangular" className="w-full aspect-square mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="aspect-square" />
                ))}
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="flex flex-col space-y-6">
              <Skeleton variant="text" className="w-24 h-4" />
              <Skeleton variant="text" className="w-3/4 h-8" />
              <Skeleton variant="text" className="w-32 h-5" />
              <Skeleton variant="text" className="w-40 h-10" />
              
              <div className="space-y-2">
                <Skeleton variant="text" className="w-24 h-5" />
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-2/3 h-4" />
              </div>

              <Skeleton variant="text" className="w-32 h-5" />

              <div className="flex items-center gap-4">
                <Skeleton variant="rectangular" className="w-32 h-12" />
                <Skeleton variant="rectangular" className="flex-1 h-12" />
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-2">
                <Skeleton variant="text" className="w-48 h-4" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default ProductDetailSkeleton;



