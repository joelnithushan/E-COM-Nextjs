'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { getOrder, Order } from '@/lib/api/orders.api';
import { formatCurrency } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getOrder(orderId);

        if (response.success) {
          setOrder(response.data.order);
        } else {
          setError('Failed to load order');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            'An error occurred while loading your order'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

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

  if (error || !order) {
    return (
      <Section padding="lg">
        <Container>
          <Alert variant="error" title="Error">
            {error || 'Order not found'}
          </Alert>
        </Container>
      </Section>
    );
  }

  return (
    <Section padding="lg">
      <Container size="lg">
        <div className="mb-8">
          <Link
            href="/orders"
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-block"
          >
            ← Back to Orders
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Order Details
          </h1>
          <p className="text-gray-600">
            Order Number: <span className="font-semibold">{order.orderNumber}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title>Order Items</Card.Title>
                  <Badge
                    variant={
                      order.status === 'delivered'
                        ? 'success'
                        : order.status === 'cancelled'
                        ? 'error'
                        : 'primary'
                    }
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                    >
                      {item.product.image && (
                        <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product._id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity}
                        </p>
                        {item.selectedVariants &&
                          item.selectedVariants.length > 0 && (
                            <p className="text-sm text-gray-600">
                              {item.selectedVariants.map((v, idx) => (
                                <span key={idx}>
                                  {v.variantName}: {v.optionValue}
                                  {idx < item.selectedVariants.length - 1 && ', '}
                                </span>
                              ))}
                            </p>
                          )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* Shipping Information */}
            <Card padding="lg">
              <Card.Header>
                <Card.Title>Shipping Information</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Shipping Address
                    </h4>
                    <div className="text-gray-700 space-y-1">
                      <p>{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                        {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                    </div>
                  </div>

                  {order.shipping.trackingNumber && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Tracking Information
                      </h4>
                      <div className="text-gray-700 space-y-1">
                        <p>
                          <span className="font-medium">Tracking Number:</span>{' '}
                          {order.shipping.trackingNumber}
                        </p>
                        {order.shipping.carrier && (
                          <p>
                            <span className="font-medium">Carrier:</span>{' '}
                            {order.shipping.carrier}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Method:</span>{' '}
                          {order.shipping.method}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-24">
              <Card.Header>
                <Card.Title>Order Summary</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Status</span>
                    <Badge
                      variant={
                        order.status === 'delivered'
                          ? 'success'
                          : order.status === 'cancelled'
                          ? 'error'
                          : 'primary'
                      }
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Status</span>
                    <Badge
                      variant={
                        order.payment.status === 'paid'
                          ? 'success'
                          : order.payment.status === 'failed'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {order.payment.status.charAt(0).toUpperCase() +
                        order.payment.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/orders">
                    <Button variant="outline" fullWidth>
                      Back to Orders
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="primary" fullWidth>
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}

