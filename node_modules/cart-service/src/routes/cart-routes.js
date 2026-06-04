const express = require('express');
const { currentUser, requireAuth, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  toggleSaveForLater,
  clearCart
} = require('../controllers/cart-controller');

const router = express.Router();

// Enforce authentication
router.use(currentUser);
router.use(requireAuth);

router.get('/', getCart);

router.post('/', [
  body('productId').trim().notEmpty().withMessage('Product ID is required'),
  body('title').trim().notEmpty().withMessage('Product title is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], validateRequest, addToCart);

router.put('/:itemId', [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], validateRequest, updateCartItemQuantity);

// IMPORTANT: /clear/active MUST be registered before /:itemId
// Otherwise Express matches "clear" as itemId and calls removeFromCart instead
router.delete('/clear/active', clearCart);

router.delete('/:itemId', removeFromCart);

router.patch('/:itemId/save-for-later', toggleSaveForLater);

module.exports = router;
