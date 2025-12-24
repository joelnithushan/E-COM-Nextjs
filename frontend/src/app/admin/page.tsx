'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { getDashboardStats, DashboardStats } from '@/lib/api/admin.api';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/lib/api/orders.api';
import { Product } from '@/lib/api/products.api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getDashboardStats();
        if (response.success) {
          setStats(response.data);
        } else {
          setError('Failed to load dashboard statistics');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            'An error occurred while loading dashboard'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !stats) {
    return (
      <Container>
        <Alert variant="error" title="Error">
          {error || 'Failed to load dashboard'}
        </Alert>
      </Container>
    );
  }

  const StatCard = ({
    title,
    value,
    change,
    icon,
    href,
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    href?: string;
  }) => {
    const content = (
      <Card padding="lg" hover={!!href} className="h-full">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {change !== undefined && (
              <p
                className={`text-sm mt-1 ${
                  change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}% from last period
              </p>
            )}
          </div>
          <div className="p-3 bg-primary-100 rounded-lg">{icon}</div>
        </div>
      </Card>
    );

    if (href) {
      return <Link href={href}>{content}</Link>;
    }

    return content;
  };

  return (
    <Container>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your store's performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            change={stats.revenueChange}
            icon={
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            href="/admin/orders"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            change={stats.ordersChange}
            icon={
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            href="/admin/orders"
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            change={stats.productsChange}
            icon={
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
            href="/admin/products"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            change={stats.customersChange}
            icon={
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Recent Orders & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent orders
                </p>
              ) : (
                stats.recentOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.user.name} • {formatCurrency(order.total)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          order.status === 'delivered'
                            ? 'success'
                            : order.status === 'cancelled'
                            ? 'error'
                            : 'primary'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Low Stock Products */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
              <Link
                href="/admin/inventory"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {stats.lowStockProducts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  All products are well stocked
                </p>
              ) : (
                stats.lowStockProducts.slice(0, 5).map((product) => (
                  <Link
                    key={product._id}
                    href={`/admin/products/${product._id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-warning-300 hover:bg-warning-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-warning-600 mt-1">
                          Only {product.stock} left in stock
                        </p>
                      </div>
                      <Badge variant="warning">Low Stock</Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}

