/**
 * Analytics Dashboard Component
 * Displays key metrics and charts for admin dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { useFeature } from '@/hooks/useFeatureToggle';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import {
  getDashboardOverview,
  type DashboardOverview,
  type RevenueData,
  type OrdersPerDayData,
  type TopProduct,
  type RecentCustomer,
} from '@/lib/api/analytics.api';

// Simple chart components (using CSS for basic visualization)
// For production, consider using recharts or chart.js

const RevenueCard = ({ revenue }: { revenue: RevenueData }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
      <p className="text-3xl font-bold text-gray-900">
        ${(revenue.totalRevenue / 100).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">Orders: {revenue.orderCount}</span>
        <span className="text-gray-500">
          Avg: ${(revenue.averageOrderValue / 100).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

const OrdersChart = ({ data }: { data: OrdersPerDayData[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Orders Per Day</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  const maxOrders = Math.max(...data.map((d) => d.orders));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Orders Per Day (Last 30 Days)</h3>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.date} className="flex items-center gap-4">
            <div className="w-24 text-sm text-gray-600">
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="bg-black h-6 rounded"
                  style={{
                    width: `${(item.orders / maxOrders) * 100}%`,
                    minWidth: item.orders > 0 ? '4px' : '0',
                  }}
                />
                <span className="text-sm font-medium text-gray-700 w-12">
                  {item.orders}
                </span>
                <span className="text-xs text-gray-500">
                  ${(item.revenue / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopProductsList = ({ products }: { products: TopProduct[] }) => {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Products</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Top Products</h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.productId} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
              {index + 1}
            </div>
            {product.image && (
              <img
                src={product.image.url}
                alt={product.image.alt || product.productName}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{product.productName}</p>
              <p className="text-sm text-gray-500">
                {product.totalQuantity} sold • ${(product.totalRevenue / 100).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecentCustomersList = ({ customers }: { customers: RecentCustomer[] }) => {
  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Customers</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Customers</h3>
      <div className="space-y-4">
        {customers.map((customer) => (
          <div key={customer.userId} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{customer.name}</p>
              <p className="text-sm text-gray-500">{customer.email}</p>
              <p className="text-xs text-gray-400">
                {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                ${(customer.totalSpent / 100).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(customer.lastOrderDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnalyticsDashboard = () => {
  const { enabled: analyticsEnabled, isLoading: featureLoading } = useFeature(
    FEATURE_FLAGS.DASHBOARD_ANALYTICS
  );
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analyticsEnabled) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const overview = await getDashboardOverview({ days: 30 });
        setData(overview);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
        console.error('Error loading analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [analyticsEnabled]);

  if (featureLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsEnabled) {
    return (
      <div className="p-6">
        <div className="bg-gray-100 border border-gray-400 rounded-lg p-4">
          <p className="text-black">
            Analytics feature is not enabled. Please enable it in feature settings.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-black border border-black rounded-lg p-4">
          <p className="text-white">Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="text-sm text-gray-500">
          Last {data.period.days} days
        </div>
      </div>

      {/* Revenue Card */}
      <RevenueCard revenue={data.revenue} />

      {/* Orders Per Day Chart */}
      <OrdersChart data={data.ordersPerDay} />

      {/* Top Products and Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsList products={data.topProducts} />
        <RecentCustomersList customers={data.recentCustomers} />
      </div>
    </div>
  );
};

