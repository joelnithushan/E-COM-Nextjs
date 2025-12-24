import apiClient from './client';
import { Product, ProductsResponse } from './products.api';
import { Order, OrdersResponse } from './orders.api';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  productsChange: number;
  customersChange: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

export interface UpdateOrderStatusData {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  adminNotes?: string;
}

export interface UpdateShippingData {
  trackingNumber?: string;
  carrier?: string;
  method?: string;
}

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  return apiClient.get('/admin/dashboard/stats');
};

/**
 * Get all products (admin)
 */
export const getAdminProducts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const url = `/admin/products${queryString ? `?${queryString}` : ''}`;

  return apiClient.get(url);
};

/**
 * Create product (admin)
 * Note: Images are uploaded directly to Cloudinary, so we send JSON with image URLs
 */
export const createProduct = async (data: any): Promise<{
  success: boolean;
  data: { product: Product };
}> => {
  return apiClient.post('/products', data);
};

/**
 * Update product (admin)
 * Note: Images are uploaded directly to Cloudinary, so we send JSON with image URLs
 */
export const updateProduct = async (
  id: string,
  data: any
): Promise<{
  success: boolean;
  data: { product: Product };
}> => {
  return apiClient.put(`/products/${id}`, data);
};

/**
 * Delete product (admin)
 */
export const deleteProduct = async (id: string): Promise<{
  success: boolean;
}> => {
  return apiClient.delete(`/admin/products/${id}`);
};

/**
 * Get all orders (admin)
 */
export const getAdminOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}): Promise<OrdersResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `/admin/orders${queryString ? `?${queryString}` : ''}`;

  return apiClient.get(url);
};

/**
 * Update order status (admin)
 */
export const updateOrderStatus = async (
  id: string,
  data: UpdateOrderStatusData
): Promise<{
  success: boolean;
  data: { order: Order };
}> => {
  return apiClient.put(`/admin/orders/${id}/status`, data);
};

/**
 * Update shipping info (admin)
 */
export const updateShippingInfo = async (
  id: string,
  data: UpdateShippingData
): Promise<{
  success: boolean;
  data: { order: Order };
}> => {
  return apiClient.put(`/admin/orders/${id}/shipping`, data);
};

/**
 * Get inventory status
 */
export const getInventoryStatus = async (params?: {
  lowStock?: boolean;
  outOfStock?: boolean;
}): Promise<{
  success: boolean;
  data: {
    products: Product[];
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.lowStock) queryParams.append('lowStock', 'true');
  if (params?.outOfStock) queryParams.append('outOfStock', 'true');

  const queryString = queryParams.toString();
  const url = `/admin/inventory${queryString ? `?${queryString}` : ''}`;

  return apiClient.get(url);
};


