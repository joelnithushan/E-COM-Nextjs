import apiClient from './client';

export interface PaymentIntentResponse {
  success: boolean;
  data: {
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    orderId: string;
    orderNumber: string;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    success: boolean;
    status: string;
    orderId: string;
    orderNumber: string;
    paidAt?: string;
  };
}

/**
 * Create payment intent
 */
export const createPaymentIntent = async (data: {
  orderId: string;
  paymentMethod?: string;
}): Promise<PaymentIntentResponse> => {
  return apiClient.post('/payments/create-intent', data);
};

/**
 * Verify payment
 */
export const verifyPayment = async (data: {
  orderId: string;
  paymentIntentId: string;
}): Promise<VerifyPaymentResponse> => {
  return apiClient.post('/payments/verify', data);
};




