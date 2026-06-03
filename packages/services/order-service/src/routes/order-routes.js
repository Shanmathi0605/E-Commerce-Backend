const express = require('express');
const { currentUser, requireAuth, requireRole, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const {
  createOrder,
  getOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
  downloadInvoice
} = require('../controllers/order-controller');

const router = express.Router();

// Enforce authentication on all routes
router.use(currentUser);
router.use(requireAuth);

router.post('/', [
  body('items').isArray({ min: 1 }).withMessage('Items list must be supplied'),
  body('shippingAddress').isObject().withMessage('Shipping Address must be supplied'),
  body('paymentMethod').isIn(['stripe', 'razorpay', 'wallet', 'cod']).withMessage('Invalid payment method')
], validateRequest, createOrder);

router.get('/my', getMyOrders);

router.get('/all', requireRole(['admin', 'vendor']), getAllOrders);

router.get('/:orderId', getOrder);

router.post('/:orderId/cancel', cancelOrder);

router.patch('/:orderId/status', requireRole(['admin', 'vendor']), [
  body('status').isIn(['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status')
], validateRequest, updateOrderStatus);

router.get('/:orderId/invoice', downloadInvoice);

module.exports = router;
