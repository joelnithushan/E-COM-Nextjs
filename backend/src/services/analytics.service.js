import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { PAYMENT_STATUS, ORDER_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';
import featureToggleService from './feature-toggle.service.js';
import { FEATURE_FLAGS } from '../config/feature-flags.js';

/**
 * Analytics Service
 * Provides efficient analytics queries for admin dashboard
 * 
 * Strategy:
 * - Use MongoDB aggregation pipelines for efficient queries
 * - Leverage indexes for fast lookups
 * - Cache-friendly data structure
 * - Minimal data transfer
 */
class AnalyticsService {
  /**
   * Check if analytics feature is enabled
   */
  async checkFeatureEnabled(clientId = null) {
    const isEnabled = await featureToggleService.isFeatureEnabled(
      clientId,
      FEATURE_FLAGS.DASHBOARD_ANALYTICS
    );
    
    if (!isEnabled) {
      const error = new Error('Analytics feature is not enabled');
      error.statusCode = 403;
      throw error;
    }
    
    return true;
  }

  /**
   * Get total revenue
   * @param {Object} options - Query options (dateRange, status filter)
   * @returns {Promise<Object>} Revenue statistics
   */
  async getTotalRevenue(options = {}) {
    const { startDate, endDate, status = PAYMENT_STATUS.PAID } = options;

    const matchStage = {
      'payment.status': status,
    };

    if (startDate || endDate) {
      matchStage.paidAt = {};
      if (startDate) {
        matchStage.paidAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.paidAt.$lte = new Date(endDate);
      }
    }

    const result = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        totalRevenue: 0,
        orderCount: 0,
        averageOrderValue: 0,
        currency: 'USD',
      };
    }

    return {
      totalRevenue: result[0].totalRevenue || 0,
      orderCount: result[0].orderCount || 0,
      averageOrderValue: Math.round(result[0].averageOrderValue || 0),
      currency: 'USD',
    };
  }

  /**
   * Get orders per day (for chart)
   * @param {Object} options - Query options (days, startDate, endDate)
   * @returns {Promise<Array>} Orders per day data
   */
  async getOrdersPerDay(options = {}) {
    const { days = 30, startDate, endDate } = options;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else {
      // Default to last N days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      dateFilter = {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      };
    }

    const result = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format for chart
    return result.map((item) => ({
      date: item._id,
      orders: item.orderCount,
      revenue: item.revenue,
    }));
  }

  /**
   * Get top products by sales
   * @param {Object} options - Query options (limit, startDate, endDate)
   * @returns {Promise<Array>} Top products
   */
  async getTopProducts(options = {}) {
    const { limit = 10, startDate, endDate } = options;

    const matchStage = {
      'payment.status': PAYMENT_STATUS.PAID,
    };

    if (startDate || endDate) {
      matchStage.paidAt = {};
      if (startDate) {
        matchStage.paidAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.paidAt.$lte = new Date(endDate);
      }
    }

    const result = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    // Populate product details
    const productIds = result.map((item) => item._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug images stock')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    return result.map((item) => {
      const product = productMap.get(item._id.toString());
      return {
        productId: item._id,
        productName: item.productName,
        slug: product?.slug,
        image: product?.images?.find((img) => img.isPrimary) || product?.images?.[0],
        totalQuantity: item.totalQuantity,
        totalRevenue: item.totalRevenue,
        orderCount: item.orderCount,
      };
    });
  }

  /**
   * Get recent customers
   * @param {Object} options - Query options (limit, days)
   * @returns {Promise<Array>} Recent customers
   */
  async getRecentCustomers(options = {}) {
    const { limit = 10, days = 30 } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$user',
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
      { $sort: { lastOrderDate: -1 } },
      { $limit: limit },
    ]);

    // Populate user details
    const userIds = result.map((item) => item._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email createdAt')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return result.map((item) => {
      const user = userMap.get(item._id.toString());
      return {
        userId: item._id,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        firstOrderDate: item.firstOrderDate,
        lastOrderDate: item.lastOrderDate,
        orderCount: item.orderCount,
        totalSpent: item.totalSpent,
      };
    });
  }

  /**
   * Get dashboard overview (all metrics in one call)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Complete dashboard data
   */
  async getDashboardOverview(options = {}) {
    await this.checkFeatureEnabled();

    const {
      days = 30,
      startDate,
      endDate,
      topProductsLimit = 10,
      recentCustomersLimit = 10,
    } = options;

    try {
      // Execute all queries in parallel for efficiency
      const [
        totalRevenue,
        ordersPerDay,
        topProducts,
        recentCustomers,
      ] = await Promise.all([
        this.getTotalRevenue({ startDate, endDate }),
        this.getOrdersPerDay({ days, startDate, endDate }),
        this.getTopProducts({ limit: topProductsLimit, startDate, endDate }),
        this.getRecentCustomers({ limit: recentCustomersLimit, days }),
      ]);

      return {
        revenue: totalRevenue,
        ordersPerDay,
        topProducts,
        recentCustomers,
        period: {
          days,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get revenue trends (for comparison)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Revenue comparison
   */
  async getRevenueTrends(options = {}) {
    const { days = 30 } = options;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days * 2); // Get 2x period for comparison

    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

    // Current period
    const currentPeriod = await this.getTotalRevenue({
      startDate: currentPeriodStart,
      endDate,
    });

    // Previous period
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days * 2);
    const previousPeriod = await this.getTotalRevenue({
      startDate: previousPeriodStart,
      endDate: currentPeriodStart,
    });

    const revenueChange = currentPeriod.totalRevenue - previousPeriod.totalRevenue;
    const revenueChangePercent =
      previousPeriod.totalRevenue > 0
        ? ((revenueChange / previousPeriod.totalRevenue) * 100).toFixed(2)
        : 0;

    return {
      current: currentPeriod,
      previous: previousPeriod,
      change: revenueChange,
      changePercent: parseFloat(revenueChangePercent),
      trend: revenueChange >= 0 ? 'up' : 'down',
    };
  }

  /**
   * Get order status breakdown
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Order status statistics
   */
  async getOrderStatusBreakdown(options = {}) {
    const { startDate, endDate } = options;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    const result = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return result.map((item) => ({
      status: item._id,
      count: item.count,
      totalRevenue: item.totalRevenue,
    }));
  }
}

export default new AnalyticsService();



