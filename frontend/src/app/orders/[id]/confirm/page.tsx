'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { createPaymentIntent, verifyPayment } from '@/lib/api/payments.api';
import { formatCurrency } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const PaymentForm: React.FC<{
  order: Order;
  onPaymentSuccess: () => void;
}> = ({ order, onPaymentSuccess }) => {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const response = await createPaymentIntent({
          orderId: order._id,
          paymentMethod: 'stripe',
        });

        if (response.success) {
          setClientSecret(response.data.clientSecret);
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            'Failed to initialize payment'
        );
      }
    };

    if (order.payment.status === 'pending') {
      initializePayment();
    }
  }, [order._id, order.payment.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Verify payment on backend
      const verifyResponse = await verifyPayment({
        orderId: order._id,
        paymentIntentId: paymentIntent.id,
      });

      if (verifyResponse.success && verifyResponse.data.success) {
        onPaymentSuccess();
        router.push(`/orders/${order._id}?payment=success`);
      } else {
        setError('Payment verification failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Payment processing failed'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (order.payment.status === 'paid') {
    return null; // Payment already completed
  }

  return (
    <Card padding="lg" className="mt-8">
      <Card.Header>
        <Card.Title>Payment Information</Card.Title>
        <Card.Description>
          Complete your payment to finalize your order
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {clientSecret ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>

            <div className="flex justify-between items-center text-lg font-semibold text-gray-900 pt-4 border-t border-gray-200">
              <span>Total Amount</span>
              <span>{formatCurrency(order.total)}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isProcessing}
              disabled={!stripe || isProcessing}
            >
              Pay {formatCurrency(order.total)}
            </Button>
          </form>
        ) : (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getOrder(orderId);

        if (response.success) {
          setOrder(response.data.order);
          if (response.data.order.payment.status === 'paid') {
            setPaymentSuccess(true);
          }
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

  const isPaid = order.payment.status === 'paid';

  return (
    <Section padding="lg">
      <Container size="lg">
        {/* Success Message */}
        {paymentSuccess && (
          <Alert variant="success" className="mb-8">
            <div>
              <h3 className="font-semibold mb-2">Payment Successful!</h3>
              <p>Your order has been confirmed and payment has been processed.</p>
            </div>
          </Alert>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Order Confirmed
          </h1>
          <p className="text-lg text-gray-600">
            Order Number: <span className="font-semibold">{order.orderNumber}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card padding="lg">
              <Card.Header>
                <Card.Title>Order Items</Card.Title>
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
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* Shipping Address */}
            <Card padding="lg">
              <Card.Header>
                <Card.Title>Shipping Address</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="text-gray-700 space-y-1">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
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
                    <span className="text-gray-600">Status</span>
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment</span>
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

                {!isPaid && (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      order={order}
                      onPaymentSuccess={() => {
                        setPaymentSuccess(true);
                        setOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                payment: { ...prev.payment, status: 'paid' },
                                status: 'processing',
                              }
                            : null
                        );
                      }}
                    />
                  </Elements>
                )}

                {isPaid && (
                  <div className="space-y-3">
                    <Link href={`/orders/${order._id}`}>
                      <Button variant="outline" fullWidth>
                        View Order Details
                      </Button>
                    </Link>
                    <Link href="/orders">
                      <Button variant="primary" fullWidth>
                        View All Orders
                      </Button>
                    </Link>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}

