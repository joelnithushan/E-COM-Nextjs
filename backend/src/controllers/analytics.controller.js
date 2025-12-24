import analyticsService from '../services/analytics.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Analytics Controller
 * Handles HTTP requests for analytics data
 */
class AnalyticsController {
  /**
   * Get dashboard overview (all metrics)
   * GET /api/v1/analytics/dashboard
   */
  getDashboardOverview = async (req, res) => {
    try {
      const {
        days = 30,
        startDate,
        endDate,
        topProductsLimit = 10,
        recentCustomersLimit = 10,
      } = req.query;

      const overview = await analyticsService.getDashboardOverview({
        days: parseInt(days, 10),
        startDate,
        endDate,
        topProductsLimit: parseInt(topProductsLimit, 10),
        recentCustomersLimit: parseInt(recentCustomersLimit, 10),
      });

      return sendSuccessResponse(res, overview, 200);
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve dashboard overview',
        'ANALYTICS_FETCH_ERROR'
      );
    }
  };

  /**
   * Get total revenue
   * GET /api/v1/analytics/revenue
   */
  getTotalRevenue = async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;

      const revenue = await analyticsService.getTotalRevenue({
        startDate,
        endDate,
        status,
      });

      return sendSuccessResponse(res, { revenue }, 200);
    } catch (error) {
      logger.error('Error getting revenue:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve revenue',
        'REVENUE_FETCH_ERROR'
      );
    }
  };

  /**
   * Get orders per day
   * GET /api/v1/analytics/orders-per-day
   */
  getOrdersPerDay = async (req, res) => {
    try {
      const { days = 30, startDate, endDate } = req.query;

      const data = await analyticsService.getOrdersPerDay({
        days: parseInt(days, 10),
        startDate,
        endDate,
      });

      return sendSuccessResponse(res, { data }, 200);
    } catch (error) {
      logger.error('Error getting orders per day:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve orders per day',
        'ORDERS_PER_DAY_FETCH_ERROR'
      );
    }
  };

  /**
   * Get top products
   * GET /api/v1/analytics/top-products
   */
  getTopProducts = async (req, res) => {
    try {
      const { limit = 10, startDate, endDate } = req.query;

      const products = await analyticsService.getTopProducts({
        limit: parseInt(limit, 10),
        startDate,
        endDate,
      });

      return sendSuccessResponse(res, { products }, 200);
    } catch (error) {
      logger.error('Error getting top products:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve top products',
        'TOP_PRODUCTS_FETCH_ERROR'
      );
    }
  };

  /**
   * Get recent customers
   * GET /api/v1/analytics/recent-customers
   */
  getRecentCustomers = async (req, res) => {
    try {
      const { limit = 10, days = 30 } = req.query;

      const customers = await analyticsService.getRecentCustomers({
        limit: parseInt(limit, 10),
        days: parseInt(days, 10),
      });

      return sendSuccessResponse(res, { customers }, 200);
    } catch (error) {
      logger.error('Error getting recent customers:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve recent customers',
        'RECENT_CUSTOMERS_FETCH_ERROR'
      );
    }
  };

  /**
   * Get revenue trends
   * GET /api/v1/analytics/revenue-trends
   */
  getRevenueTrends = async (req, res) => {
    try {
      const { days = 30 } = req.query;

      const trends = await analyticsService.getRevenueTrends({
        days: parseInt(days, 10),
      });

      return sendSuccessResponse(res, { trends }, 200);
    } catch (error) {
      logger.error('Error getting revenue trends:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve revenue trends',
        'REVENUE_TRENDS_FETCH_ERROR'
      );
    }
  };

  /**
   * Get order status breakdown
   * GET /api/v1/analytics/order-status
   */
  getOrderStatusBreakdown = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const breakdown = await analyticsService.getOrderStatusBreakdown({
        startDate,
        endDate,
      });

      return sendSuccessResponse(res, { breakdown }, 200);
    } catch (error) {
      logger.error('Error getting order status breakdown:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve order status breakdown',
        'ORDER_STATUS_FETCH_ERROR'
      );
    }
  };
}

export default new AnalyticsController();

