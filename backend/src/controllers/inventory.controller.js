import productService from '../services/product.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.util.js';

/**
 * Get inventory status
 * GET /api/v1/admin/inventory
 */
export const getInventoryStatus = async (req, res) => {
  try {
    const { lowStock, outOfStock } = req.query;
    
    // Build filter for inventory query
    const filter = {};
    
    if (lowStock === 'true') {
      filter.$or = [
        { stock: { $gt: 0, $lt: 10 } },
        { 'variants.options.stock': { $gt: 0, $lt: 10 } },
      ];
    }
    
    if (outOfStock === 'true') {
      filter.$or = [
        { stock: 0 },
        { 'variants.options.stock': 0 },
        { stock: { $exists: false } },
      ];
    }
    
    // Get all products (for admin, no pagination limit)
    const result = await productService.getProducts({
      ...req.query,
      limit: 10000, // Get all products for inventory view
    });
    
    // Calculate inventory stats
    const products = result.products || [];
    const lowStockProducts = products.filter((p) => {
      if (p.variants && p.variants.length > 0) {
        return p.variants.some((v) =>
          v.options.some((opt) => (opt.stock || 0) > 0 && (opt.stock || 0) < 10)
        );
      }
      return (p.stock || 0) > 0 && (p.stock || 0) < 10;
    });
    
    const outOfStockProducts = products.filter((p) => {
      if (p.variants && p.variants.length > 0) {
        return p.variants.every((v) =>
          v.options.every((opt) => (opt.stock || 0) === 0)
        );
      }
      return (p.stock || 0) === 0;
    });
    
    // Filter products based on query params
    let filteredProducts = products;
    if (lowStock === 'true') {
      filteredProducts = lowStockProducts;
    } else if (outOfStock === 'true') {
      filteredProducts = outOfStockProducts;
    }
    
    sendSuccess(
      res,
      {
        products: filteredProducts,
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      'Inventory status retrieved successfully'
    );
  } catch (error) {
    logger.error('Get inventory status error:', error);
    sendError(
      res,
      error.message || 'Failed to retrieve inventory status',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

