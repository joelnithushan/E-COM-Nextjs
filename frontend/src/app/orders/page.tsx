'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getOrders, Order } from '@/lib/api/orders.api';
import { formatCurrency } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getOrders({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load orders');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'An error occurred while loading your orders'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page]);

  if (isLoading) {
    return (
      <Section padding="lg">
        <Container>
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </Container>
      </Section>
    );
  }

  if (error && orders.length === 0) {
    return (
      <Section padding="lg">
        <Container>
          <Alert variant="error" title="Error">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="mt-4"
            >
              Try Again
            </Button>
          </Alert>
        </Container>
      </Section>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <Section padding="lg">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            My Orders
          </h1>
          <p className="text-gray-600">
            View and track your order history
          </p>
        </div>

        {orders.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start shopping to see your orders here
              </p>
              <Link href="/products">
                <Button variant="primary" size="lg">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} padding="md" hover>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <Link
                        href={`/orders/${order._id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-black transition-colors underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <Badge
                        variant={
                          order.status === 'delivered'
                            ? 'success'
                            : order.status === 'cancelled'
                            ? 'error'
                            : 'primary'
                        }
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed on{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.payment.status === 'paid' ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                    <Link href={`/orders/${order._id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </Container>
    </Section>
    </ProtectedRoute>
  );
}

