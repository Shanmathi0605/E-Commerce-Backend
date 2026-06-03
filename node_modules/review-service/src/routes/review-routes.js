const express = require('express');
const { currentUser, requireAuth, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const upload = require('../utils/uploader');
const {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews
} = require('../controllers/review-controller');

const router = express.Router();

// Public route to read product reviews
router.get('/product/:productId', getProductReviews);

// Authenticated customer routes
router.use(currentUser);
router.use(requireAuth);

router.post('/', upload.array('images', 3), [
  body('productId').trim().notEmpty().withMessage('Product ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Review comment is required')
], validateRequest, createReview);

router.put('/:reviewId', upload.array('images', 3), updateReview);

router.delete('/:reviewId', deleteReview);

module.exports = router;
