const express = require('express');
const { currentUser, requireAuth, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
} = require('../controllers/wishlist-controller');

const router = express.Router();

// Enforce authentication
router.use(currentUser);
router.use(requireAuth);

router.get('/', getWishlist);

router.post('/', [
  body('productId').trim().notEmpty().withMessage('Product ID is required'),
  body('title').trim().notEmpty().withMessage('Product title is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive')
], validateRequest, addToWishlist);

router.delete('/:productId', removeFromWishlist);

router.post('/:productId/move-to-cart', moveToCart);

module.exports = router;
