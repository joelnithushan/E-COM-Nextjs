'use client';

import React from 'react';
import { ProductsQueryParams } from '@/lib/api/products.api';

interface ProductFiltersProps {
  filters: ProductsQueryParams;
  onFiltersChange: (filters: ProductsQueryParams) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  // This is a placeholder - implement actual filter UI
  return (
    <div className="flex items-center gap-4">
      {/* Add filter UI here */}
    </div>
  );
};

export default ProductFilters;



