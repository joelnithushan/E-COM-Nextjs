/**
 * Analytics API
 * Client-side API for analytics data
 */

import apiClient from './client';

export interface RevenueData {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  currency: string;
}

export interface OrdersPerDayData {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  slug?: string;
  image?: {
    url: string;
    alt?: string;
  };
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface RecentCustomer {
  userId: string;
  name: string;
  email: string;
  firstOrderDate: string;
  lastOrderDate: string;
  orderCount: number;
  totalSpent: number;
}

export interface DashboardOverview {
  revenue: RevenueData;
  ordersPerDay: OrdersPerDayData[];
  topProducts: TopProduct[];
  recentCustomers: RecentCustomer[];
  period: {
    days: number;
    startDate: string | null;
    endDate: string | null;
  };
}

export interface RevenueTrends {
  current: RevenueData;
  previous: RevenueData;
  change: number;
  changePercent: number;
  trend: 'up' | 'down';
}

export interface OrderStatusBreakdown {
  status: string;
  count: number;
  totalRevenue: number;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Get dashboard overview (all metrics)
 */
export const getDashboardOverview = async (
  options?: {
    days?: number;
    startDate?: string;
    endDate?: string;
    topProductsLimit?: number;
    recentCustomersLimit?: number;
  }
): Promise<DashboardOverview> => {
  const params = new URLSearchParams();
  if (options?.days) params.append('days', options.days.toString());
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.topProductsLimit)
    params.append('topProductsLimit', options.topProductsLimit.toString());
  if (options?.recentCustomersLimit)
    params.append('recentCustomersLimit', options.recentCustomersLimit.toString());

  const response = await apiClient.get<AnalyticsResponse<DashboardOverview>>(
    `/analytics/dashboard?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Get total revenue
 */
export const getTotalRevenue = async (options?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<RevenueData> => {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.status) params.append('status', options.status);

  const response = await apiClient.get<AnalyticsResponse<{ revenue: RevenueData }>>(
    `/analytics/revenue?${params.toString()}`
  );
  return response.data.data.revenue;
};

/**
 * Get orders per day
 */
export const getOrdersPerDay = async (options?: {
  days?: number;
  startDate?: string;
  endDate?: string;
}): Promise<OrdersPerDayData[]> => {
  const params = new URLSearchParams();
  if (options?.days) params.append('days', options.days.toString());
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const response = await apiClient.get<AnalyticsResponse<{ data: OrdersPerDayData[] }>>(
    `/analytics/orders-per-day?${params.toString()}`
  );
  return response.data.data.data;
};

/**
 * Get top products
 */
export const getTopProducts = async (options?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<TopProduct[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const response = await apiClient.get<AnalyticsResponse<{ products: TopProduct[] }>>(
    `/analytics/top-products?${params.toString()}`
  );
  return response.data.data.products;
};

/**
 * Get recent customers
 */
export const getRecentCustomers = async (options?: {
  limit?: number;
  days?: number;
}): Promise<RecentCustomer[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.days) params.append('days', options.days.toString());

  const response = await apiClient.get<AnalyticsResponse<{ customers: RecentCustomer[] }>>(
    `/analytics/recent-customers?${params.toString()}`
  );
  return response.data.data.customers;
};

/**
 * Get revenue trends
 */
export const getRevenueTrends = async (options?: {
  days?: number;
}): Promise<RevenueTrends> => {
  const params = new URLSearchParams();
  if (options?.days) params.append('days', options.days.toString());

  const response = await apiClient.get<AnalyticsResponse<{ trends: RevenueTrends }>>(
    `/analytics/revenue-trends?${params.toString()}`
  );
  return response.data.data.trends;
};

/**
 * Get order status breakdown
 */
export const getOrderStatusBreakdown = async (options?: {
  startDate?: string;
  endDate?: string;
}): Promise<OrderStatusBreakdown[]> => {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const response = await apiClient.get<
    AnalyticsResponse<{ breakdown: OrderStatusBreakdown[] }>
  >(`/analytics/order-status?${params.toString()}`);
  return response.data.data.breakdown;
};



