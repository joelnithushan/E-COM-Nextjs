/**
 * Stripe Mock
 * Mocks Stripe API for testing
 */

export const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    confirm: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },
};

// Default mock implementations
mockStripe.paymentIntents.create.mockResolvedValue({
  id: 'pi_test_123',
  client_secret: 'pi_test_123_secret',
  amount: 10000,
  currency: 'usd',
  status: 'requires_payment_method',
});

mockStripe.paymentIntents.retrieve.mockResolvedValue({
  id: 'pi_test_123',
  amount: 10000,
  currency: 'usd',
  status: 'succeeded',
  metadata: {
    orderId: 'test-order-id',
  },
});

mockStripe.paymentIntents.update.mockResolvedValue({
  id: 'pi_test_123',
  amount: 10000,
  currency: 'usd',
  status: 'requires_payment_method',
});

mockStripe.paymentIntents.confirm.mockResolvedValue({
  id: 'pi_test_123',
  amount: 10000,
  currency: 'usd',
  status: 'succeeded',
});

mockStripe.webhooks.constructEvent.mockReturnValue({
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_123',
      amount: 10000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        orderId: 'test-order-id',
      },
    },
  },
});

mockStripe.customers.create.mockResolvedValue({
  id: 'cus_test_123',
  email: 'test@example.com',
});

mockStripe.customers.retrieve.mockResolvedValue({
  id: 'cus_test_123',
  email: 'test@example.com',
});

mockStripe.customers.update.mockResolvedValue({
  id: 'cus_test_123',
  email: 'test@example.com',
});

export default mockStripe;









