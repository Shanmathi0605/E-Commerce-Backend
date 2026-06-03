const express = require('express');
const { currentUser, requireAuth, requireRole, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const { processPayment, processRefund } = require('../controllers/payment-controller');

const router = express.Router();

router.use(currentUser);
router.use(requireAuth);

router.post('/charge', [
  body('orderId').trim().notEmpty().withMessage('Order ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('paymentMethod').isIn(['stripe', 'razorpay', 'wallet', 'cod']).withMessage('Invalid payment method')
], validateRequest, processPayment);

router.post('/refund', requireRole('admin'), [
  body('orderId').trim().notEmpty().withMessage('Order ID is required'),
  body('refundReason').optional().trim()
], validateRequest, processRefund);

module.exports = router;
