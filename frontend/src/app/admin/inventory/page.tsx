'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { getInventoryStatus, Product } from '@/lib/api/admin.api';
import { formatCurrency } from '@/lib/utils';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'lowStock' | 'outOfStock'>('all');

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInventoryStatus({
        lowStock: filter === 'lowStock',
        outOfStock: filter === 'outOfStock',
      });

      if (response.success) {
        setProducts(response.data.products);
        setStats({
          totalProducts: response.data.totalProducts,
          lowStockCount: response.data.lowStockCount,
          outOfStockCount: response.data.outOfStockCount,
        });
      } else {
        setError('Failed to load inventory');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'An error occurred while loading inventory'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const StatCard = ({
    title,
    value,
    variant,
  }: {
    title: string;
    value: number;
    variant: 'default' | 'warning' | 'error';
  }) => {
    const variants = {
      default: 'bg-primary-100 text-primary-600',
      warning: 'bg-warning-100 text-warning-600',
      error: 'bg-error-100 text-error-600',
    };

    return (
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${variants[variant]}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Container>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor stock levels and manage inventory
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            variant="default"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStockCount}
            variant="warning"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockCount}
            variant="error"
          />
        </div>

        {/* Filters */}
        <Card padding="md" className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All Products
            </Button>
            <Button
              variant={filter === 'lowStock' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('lowStock')}
            >
              Low Stock
            </Button>
            <Button
              variant={filter === 'outOfStock' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('outOfStock')}
            >
              Out of Stock
            </Button>
          </div>
        </Card>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="text-gray-500">No products found</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const isLowStock = product.stock > 0 && product.stock < 10;
                      const isOutOfStock = product.stock === 0;

                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.images?.[0] && (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden mr-3 bg-gray-100">
                                  <Image
                                    src={product.images[0].url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.category?.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {product.stock} units
                              </div>
                              {isLowStock && (
                                <Badge variant="warning" className="ml-2">
                                  Low Stock
                                </Badge>
                              )}
                              {isOutOfStock && (
                                <Badge variant="error" className="ml-2">
                                  Out of Stock
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(product.price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                product.status === 'active'
                                  ? 'success'
                                  : product.status === 'inactive'
                                  ? 'error'
                                  : 'default'
                              }
                            >
                              {product.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/admin/products/${product._id}`}>
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}


