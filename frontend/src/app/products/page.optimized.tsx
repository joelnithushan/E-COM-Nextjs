'use client';

import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, Product, ProductsQueryParams } from '@/lib/api/products.api';
import ProductGrid from '@/components/product/ProductGrid.optimized';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import ProductCardSkeleton from '@/components/product/ProductCardSkeleton';

// Lazy load filter components
const ProductFilters = lazy(() => import('@/components/product/ProductFilters'));

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<ProductsQueryParams>({
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
    sort: (searchParams.get('sort') as ProductsQueryParams['sort']) || 'newest',
    category: searchParams.get('category') || undefined,
    featured: searchParams.get('featured') === 'true' ? true : undefined,
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProducts(filters);
      
      if (response.success) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load products');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.message || 
        'An error occurred while loading products'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (sort: ProductsQueryParams['sort']) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }));
  };

  return (
    <Section padding="lg">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-600">
            Discover our collection of quality products
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Suspense fallback={<div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />}>
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </Suspense>

          <div className="flex items-center gap-4">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sort"
              value={filters.sort || 'newest'}
              onChange={(e) => handleSortChange(e.target.value as ProductsQueryParams['sort'])}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>

          {pagination.total > 0 && (
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} products
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Error">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProducts}
                className="mt-4"
              >
                Try Again
              </Button>
            </Alert>
          </div>
        )}

        {/* Products Grid */}
        <ProductGrid 
          products={products} 
          isLoading={isLoading}
          priorityCount={8} // First 8 products get priority loading
        />

        {/* Pagination */}
        {!isLoading && pagination.pages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {[...Array(pagination.pages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.pages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        pagination.page === page
                          ? 'bg-black text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                      aria-label={`Go to page ${page}`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === pagination.page - 2 ||
                  page === pagination.page + 2
                ) {
                  return <span key={page} className="px-2" aria-hidden="true">...</span>;
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        )}
      </Container>
    </Section>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <Section padding="lg">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </Container>
      </Section>
    }>
      <ProductsContent />
    </Suspense>
  );
}



