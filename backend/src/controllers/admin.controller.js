import orderService from '../services/order.service.js';
import productService from '../services/product.service.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Admin Controller
 * Handles admin-specific operations
 */
class AdminController {
  /**
   * Get dashboard statistics
   * GET /api/v1/admin/dashboard/stats
   */
  getDashboardStats = async (req, res) => {
    try {
      // Get date ranges for comparison (current period vs previous period)
      const now = new Date();
      const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentPeriodEnd = now;
      const previousPeriodStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch all data in parallel
      const [
        currentOrders,
        previousOrders,
        allOrders,
        allProducts,
        allUsers,
        lowStockProducts,
      ] = await Promise.all([
        // Current period orders
        orderService.getAllOrders({
          startDate: currentPeriodStart.toISOString(),
          endDate: currentPeriodEnd.toISOString(),
        }),
        // Previous period orders
        orderService.getAllOrders({
          startDate: previousPeriodStart.toISOString(),
          endDate: previousPeriodEnd.toISOString(),
        }),
        // All orders (for recent orders)
        orderService.getAllOrders({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        // All products
        productService.getProducts({ limit: 10000 }),
        // All users
        User.find({ role: 'CUSTOMER' }).select('name email createdAt').lean(),
        // Low stock products (stock < 10)
        productService.getProducts({ limit: 10000 }),
      ]);

      // Calculate revenue
      const currentRevenue = currentOrders.orders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );
      const previousRevenue = previousOrders.orders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );
      const revenueChange =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : currentRevenue > 0
          ? 100
          : 0;

      // Calculate orders change
      const currentOrdersCount = currentOrders.orders.length;
      const previousOrdersCount = previousOrders.orders.length;
      const ordersChange =
        previousOrdersCount > 0
          ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
          : currentOrdersCount > 0
          ? 100
          : 0;

      // Calculate products change (simplified - compare current vs 30 days ago)
      const productsChange = 0; // Can be enhanced with historical data

      // Calculate customers change
      const currentCustomersCount = allUsers.length;
      const customersChange = 0; // Can be enhanced with historical data

      // Get recent orders (last 10)
      const recentOrders = allOrders.orders.slice(0, 10).map((order) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        user: {
          name: order.user?.name || 'Guest',
          email: order.user?.email || '',
        },
        createdAt: order.createdAt,
      }));

      // Get low stock products (stock < 10)
      const lowStock = allProducts.products
        .filter((product) => product.stock !== undefined && product.stock < 10)
        .slice(0, 10)
        .map((product) => ({
          _id: product._id,
          name: product.name,
          stock: product.stock,
        }));

      const stats = {
        totalRevenue: currentRevenue,
        totalOrders: currentOrdersCount,
        totalProducts: allProducts.products.length,
        totalCustomers: currentCustomersCount,
        revenueChange: parseFloat(revenueChange.toFixed(2)),
        ordersChange: parseFloat(ordersChange.toFixed(2)),
        productsChange: parseFloat(productsChange.toFixed(2)),
        customersChange: parseFloat(customersChange.toFixed(2)),
        recentOrders,
        lowStockProducts: lowStock,
      };

      sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      sendError(
        res,
        error.message || 'Failed to retrieve dashboard statistics',
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default new AdminController();

