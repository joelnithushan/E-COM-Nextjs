import couponService from '../services/coupon.service.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Coupon Controller
 * Handles HTTP requests for coupon management
 */
class CouponController {
  /**
   * Validate coupon code (public)
   * POST /api/v1/coupons/validate
   */
  validateCoupon = async (req, res) => {
    try {
      const { code, orderTotal, items } = req.body;

      if (!code) {
        return sendErrorResponse(res, 400, 'Coupon code is required', 'COUPON_CODE_REQUIRED');
      }

      if (!orderTotal || orderTotal <= 0) {
        return sendErrorResponse(
          res,
          400,
          'Valid order total is required',
          'ORDER_TOTAL_REQUIRED'
        );
      }

      const result = await couponService.validateCoupon(code, orderTotal, items || []);

      if (!result.valid) {
        return sendErrorResponse(res, 400, result.error, 'COUPON_INVALID');
      }

      return sendSuccessResponse(res, result, 200);
    } catch (error) {
      logger.error('Error validating coupon:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to validate coupon',
        'COUPON_VALIDATION_ERROR'
      );
    }
  };

  /**
   * Get all coupons (admin)
   * GET /api/v1/coupons
   */
  getAllCoupons = async (req, res) => {
    try {
      const result = await couponService.getAllCoupons(req.query);
      return sendSuccessResponse(res, result, 200);
    } catch (error) {
      logger.error('Error getting coupons:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve coupons',
        'COUPONS_FETCH_ERROR'
      );
    }
  };

  /**
   * Get coupon by ID (admin)
   * GET /api/v1/coupons/:id
   */
  getCouponById = async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id);
      return sendSuccessResponse(res, { coupon }, 200);
    } catch (error) {
      logger.error('Error getting coupon:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve coupon',
        'COUPON_FETCH_ERROR'
      );
    }
  };

  /**
   * Get coupon by code (admin)
   * GET /api/v1/coupons/code/:code
   */
  getCouponByCode = async (req, res) => {
    try {
      const { code } = req.params;
      const coupon = await couponService.getCouponByCode(code);
      return sendSuccessResponse(res, { coupon }, 200);
    } catch (error) {
      logger.error('Error getting coupon:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to retrieve coupon',
        'COUPON_FETCH_ERROR'
      );
    }
  };

  /**
   * Create coupon (admin)
   * POST /api/v1/coupons
   */
  createCoupon = async (req, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return sendErrorResponse(res, 401, 'Authentication required', 'UNAUTHORIZED');
      }

      const coupon = await couponService.createCoupon(req.body, userId);
      return sendSuccessResponse(
        res,
        { coupon },
        201,
        'Coupon created successfully'
      );
    } catch (error) {
      logger.error('Error creating coupon:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to create coupon',
        'COUPON_CREATE_ERROR'
      );
    }
  };

  /**
   * Update coupon (admin)
   * PUT /api/v1/coupons/:id
   */
  updateCoupon = async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await couponService.updateCoupon(id, req.body);
      return sendSuccessResponse(
        res,
        { coupon },
        200,
        'Coupon updated successfully'
      );
    } catch (error) {
      logger.error('Error updating coupon:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to update coupon',
        'COUPON_UPDATE_ERROR'
      );
    }
  };

  /**
   * Delete coupon (admin)
   * DELETE /api/v1/coupons/:id
   */
  deleteCoupon = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await couponService.deleteCoupon(id);
      return sendSuccessResponse(res, result, 200, 'Coupon deleted successfully');
    } catch (error) {
      logger.error('Error deleting coupon:', error);
      return sendErrorResponse(
        res,
        error.statusCode || 500,
        error.message || 'Failed to delete coupon',
        'COUPON_DELETE_ERROR'
      );
    }
  };
}

export default new CouponController();

