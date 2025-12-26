/**
 * Payment Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import paymentService from '../../../src/services/payment/payment.service.js';
import { mockStripe } from '../../mocks/stripe.mock.js';
import Order from '../../../src/models/Order.js';
import { createTestOrder } from '../../helpers/testHelpers.js';
import { PAYMENT_STATUS, ORDER_STATUS } from '../../../src/config/constants.js';

// Mock Stripe
jest.mock('../../../src/config/stripe.js', () => ({
  stripe: mockStripe,
}));

describe('PaymentService', () => {
  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const order = await createTestOrder();
      const amount = 10000; // $100.00 in cents

      const result = await paymentService.createPaymentIntent({
        orderId: order._id.toString(),
        amount,
        currency: 'usd',
      });

      expect(result).toHaveProperty('clientSecret');
      expect(result).toHaveProperty('paymentIntentId');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount,
          currency: 'usd',
          metadata: expect.objectContaining({
            orderId: order._id.toString(),
          }),
        })
      );
    });

    it('should include order metadata', async () => {
      const order = await createTestOrder();

      await paymentService.createPaymentIntent({
        orderId: order._id.toString(),
        amount: 10000,
        currency: 'usd',
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            orderId: order._id.toString(),
          }),
        })
      );
    });
  });

  describe('verifyPayment', () => {
    it('should verify successful payment', async () => {
      const order = await createTestOrder();
      const paymentIntentId = 'pi_test_123';

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: paymentIntentId,
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        metadata: {
          orderId: order._id.toString(),
        },
      });

      const result = await paymentService.verifyPayment(paymentIntentId);

      expect(result).toHaveProperty('verified', true);
      expect(result).toHaveProperty('status', 'succeeded');
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(paymentIntentId);
    });

    it('should handle failed payment', async () => {
      const paymentIntentId = 'pi_test_123';

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: paymentIntentId,
        status: 'payment_failed',
        amount: 10000,
        currency: 'usd',
      });

      const result = await paymentService.verifyPayment(paymentIntentId);

      expect(result).toHaveProperty('verified', false);
      expect(result).toHaveProperty('status', 'payment_failed');
    });

    it('should throw error if payment intent not found', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('Payment intent not found')
      );

      await expect(
        paymentService.verifyPayment('invalid_id')
      ).rejects.toThrow();
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const order = await createTestOrder();
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            amount: 10000,
            currency: 'usd',
            metadata: {
              orderId: order._id.toString(),
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const result = await paymentService.handleWebhook('signature', 'payload');

      expect(result).toHaveProperty('processed', true);
      expect(result).toHaveProperty('eventType', 'payment_intent.succeeded');
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const order = await createTestOrder();
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'payment_failed',
            amount: 10000,
            currency: 'usd',
            metadata: {
              orderId: order._id.toString(),
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const result = await paymentService.handleWebhook('signature', 'payload');

      expect(result).toHaveProperty('processed', true);
      expect(result).toHaveProperty('eventType', 'payment_intent.payment_failed');
    });

    it('should throw error for invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        paymentService.handleWebhook('invalid_signature', 'payload')
      ).rejects.toThrow('Invalid signature');
    });
  });
});



