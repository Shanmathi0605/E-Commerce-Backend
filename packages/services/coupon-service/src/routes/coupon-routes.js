const express = require('express');
const { currentUser, requireAuth, requireRole, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  validateCoupon,
  redeemCoupon
} = require('../controllers/coupon-controller');

const router = express.Router();

// Public Coupon validations (Accessible during checkout checkups)
router.post('/validate', currentUser, requireAuth, [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('orderAmount').isFloat({ min: 1 }).withMessage('Valid order amount is required')
], validateRequest, validateCoupon);

router.post('/redeem', currentUser, requireAuth, [
  body('code').trim().notEmpty().withMessage('Coupon code is required')
], validateRequest, redeemCoupon);

// Authenticated lists
router.get('/', currentUser, requireAuth, getCoupons);

// Admin / Vendor creation & deletions
router.post('/', currentUser, requireAuth, requireRole(['admin', 'vendor']), [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'flat']).withMessage('Discount type must be percentage or flat'),
  body('discountValue').isFloat({ min: 0.1 }).withMessage('Discount value must be positive'),
  body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
  body('endDate').isISO8601().withMessage('End date must be a valid ISO date')
], validateRequest, createCoupon);

router.delete('/:couponId', currentUser, requireAuth, requireRole(['admin', 'vendor']), deleteCoupon);

module.exports = router;
