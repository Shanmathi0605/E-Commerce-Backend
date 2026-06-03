const express = require('express');
const { currentUser, requireAuth, requireRole, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const { getStock, updateStock, getLowStockAlerts } = require('../controllers/inventory-controller');

const router = express.Router();

// Apply auth to all routes
router.use(currentUser);
router.use(requireAuth);

// Get stock (Public to logged in users e.g. checkout verification)
router.get('/:productId', getStock);

// Modify stock levels (Vendors & Admins only)
router.post('/:productId', requireRole(['vendor', 'admin']), [
  body('stock').isInt({ min: 0 }).withMessage('Stock must be an integer >= 0'),
  body('variantId').optional().trim(),
  body('lowStockThreshold').optional().isInt({ min: 0 })
], validateRequest, updateStock);

// Get low stock warnings (Vendors & Admins only)
router.get('/alerts/low-stock', requireRole(['vendor', 'admin']), getLowStockAlerts);

module.exports = router;
