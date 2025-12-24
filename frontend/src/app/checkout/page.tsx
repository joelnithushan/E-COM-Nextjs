'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getCartSummary, CartSummary } from '@/lib/api/cart.api';
import { createOrder } from '@/lib/api/orders.api';
import { formatCurrency } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import config from '@/config';

const stripePromise = loadStripe(config.stripe.publishableKey);

interface CheckoutFormData {
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  useShippingForBilling: boolean;
  shippingMethod: string;
  shippingCost: number;
  tax: number;
  notes: string;
}

const CheckoutForm: React.FC<{
  cartSummary: CartSummary;
  onOrderCreated: (orderId: string) => void;
}> = ({ cartSummary, onOrderCreated }) => {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    shippingAddress: {
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phone: '',
    },
    billingAddress: {
      name: '',
      street: '',
      city: '',
      zipCode: '',
      country: 'US',
      phone: '',
    },
    useShippingForBilling: true,
    shippingMethod: 'standard',
    shippingCost: 10.0,
    tax: cartSummary.subtotal * 0.08, // 8% tax
    notes: '',
  });

  const handleInputChange = (
    field: string,
    value: string,
    section: 'shippingAddress' | 'billingAddress'
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderData = {
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.useShippingForBilling
          ? formData.shippingAddress
          : formData.billingAddress,
        shippingMethod: formData.shippingMethod,
        shippingCost: formData.shippingCost,
        tax: formData.tax,
        notes: formData.notes || undefined,
      };

      const orderResponse = await createOrder(orderData);

      if (!orderResponse.success) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResponse.data.order._id;

      // Redirect to order confirmation (payment will be handled separately)
      router.push(`/orders/${orderId}/confirm`);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to process order. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const total = cartSummary.subtotal + formData.shippingCost + formData.tax;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Shipping Address */}
      <Card padding="lg">
        <Card.Header>
          <Card.Title>Shipping Address</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.shippingAddress.name}
              onChange={(e) =>
                handleInputChange('name', e.target.value, 'shippingAddress')
              }
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.shippingAddress.phone}
              onChange={(e) =>
                handleInputChange('phone', e.target.value, 'shippingAddress')
              }
              required
            />
            <Input
              label="Street Address"
              value={formData.shippingAddress.street}
              onChange={(e) =>
                handleInputChange('street', e.target.value, 'shippingAddress')
              }
              required
              className="md:col-span-2"
            />
            <Input
              label="City"
              value={formData.shippingAddress.city}
              onChange={(e) =>
                handleInputChange('city', e.target.value, 'shippingAddress')
              }
              required
            />
            <Input
              label="State"
              value={formData.shippingAddress.state}
              onChange={(e) =>
                handleInputChange('state', e.target.value, 'shippingAddress')
              }
              required
            />
            <Input
              label="ZIP Code"
              value={formData.shippingAddress.zipCode}
              onChange={(e) =>
                handleInputChange('zipCode', e.target.value, 'shippingAddress')
              }
              required
            />
            <Input
              label="Country"
              value={formData.shippingAddress.country}
              onChange={(e) =>
                handleInputChange('country', e.target.value, 'shippingAddress')
              }
              required
            />
          </div>
        </Card.Content>
      </Card>

      {/* Billing Address */}
      <Card padding="lg">
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Billing Address</Card.Title>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.useShippingForBilling}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    useShippingForBilling: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Same as shipping address
              </span>
            </label>
          </div>
        </Card.Header>
        {!formData.useShippingForBilling && (
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.billingAddress.name}
                onChange={(e) =>
                  handleInputChange('name', e.target.value, 'billingAddress')
                }
                required
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.billingAddress.phone}
                onChange={(e) =>
                  handleInputChange('phone', e.target.value, 'billingAddress')
                }
                required
              />
              <Input
                label="Street Address"
                value={formData.billingAddress.street}
                onChange={(e) =>
                  handleInputChange('street', e.target.value, 'billingAddress')
                }
                required
                className="md:col-span-2"
              />
              <Input
                label="City"
                value={formData.billingAddress.city}
                onChange={(e) =>
                  handleInputChange('city', e.target.value, 'billingAddress')
                }
                required
              />
              <Input
                label="ZIP Code"
                value={formData.billingAddress.zipCode}
                onChange={(e) =>
                  handleInputChange('zipCode', e.target.value, 'billingAddress')
                }
                required
              />
              <Input
                label="Country"
                value={formData.billingAddress.country}
                onChange={(e) =>
                  handleInputChange('country', e.target.value, 'billingAddress')
                }
                required
              />
            </div>
          </Card.Content>
        )}
      </Card>

      {/* Order Summary */}
      <Card padding="lg">
        <Card.Header>
          <Card.Title>Order Summary</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {cartSummary.items.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-start"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
            <div className="divider" />
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatCurrency(formData.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatCurrency(formData.tax)}</span>
              </div>
              <div className="divider" />
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isProcessing}
          disabled={!stripe || isProcessing}
        >
          Place Order
        </Button>
      </div>
    </form>
  );
};

export default function CheckoutPage() {
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCartSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getCartSummary();

        if (response.success) {
          if (response.data.items.length === 0) {
            setError('Your cart is empty');
          } else {
            setCartSummary(response.data);
          }
        } else {
          setError('Failed to load cart');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            'An error occurred while loading your cart'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartSummary();
  }, []);

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

  if (error || !cartSummary) {
    return (
      <Section padding="lg">
        <Container>
          <Alert variant="error" title="Error">
            {error || 'Failed to load checkout information'}
          </Alert>
        </Container>
      </Section>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <Section padding="lg">
      <Container size="lg">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Checkout
          </h1>
          <p className="text-gray-600">
            Complete your order below
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            cartSummary={cartSummary}
            onOrderCreated={(orderId) => {
              // Handled in CheckoutForm
            }}
          />
        </Elements>
      </Container>
    </Section>
    </ProtectedRoute>
  );
}

