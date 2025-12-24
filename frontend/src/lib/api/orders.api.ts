import apiClient from './client';

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
  name: string;
  price: number;
  quantity: number;
  selectedVariants?: Array<{
    variantName: string;
    optionValue: string;
  }>;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
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
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  payment: {
    method: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
    transactionId?: string;
    amount: number;
    currency: string;
    paidAt?: string;
  };
  shipping: {
    method: string;
    cost: number;
    trackingNumber?: string;
    carrier?: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  notes?: string;
  paidAt?: string;
  processingAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;
  data: {
    order: Order;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface CreateOrderData {
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  shippingMethod: string;
  shippingCost: number;
  tax: number;
  notes?: string;
}

/**
 * Create order from cart
 */
export const createOrder = async (data: CreateOrderData): Promise<OrderResponse> => {
  return apiClient.post('/orders', data);
};

/**
 * Get user's orders
 */
export const getOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<OrdersResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const url = `/orders${queryString ? `?${queryString}` : ''}`;

  return apiClient.get(url);
};

/**
 * Get single order
 */
export const getOrder = async (id: string): Promise<OrderResponse> => {
  return apiClient.get(`/orders/${id}`);
};

/**
 * Cancel order
 */
export const cancelOrder = async (id: string, reason?: string): Promise<OrderResponse> => {
  return apiClient.post(`/orders/${id}/cancel`, { reason });
};


