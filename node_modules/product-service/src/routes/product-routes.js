const express = require('express');
const { currentUser, requireAuth, requireRole, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const upload = require('../utils/uploader');
const {
  createCategory,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  adminApproveProduct,
  getProductDetails,
  getProducts,
  searchProducts
} = require('../controllers/product-controller');

const router = express.Router();

// Public Routes
router.get('/categories', getCategories);
router.get('/search', searchProducts);
router.get('/details/:productId', getProductDetails);
router.get('/', getProducts);

// Admin Category Routes
router.post('/categories', currentUser, requireAuth, requireRole('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required')
], validateRequest, createCategory);

// Vendor Product Routes
router.post('/', currentUser, requireAuth, requireRole('vendor'), upload.array('images', 5), [
  body('title').trim().notEmpty().withMessage('Product title is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('category').trim().notEmpty().withMessage('Category ID is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required')
], validateRequest, createProduct);

router.put('/:productId', currentUser, requireAuth, requireRole('vendor'), upload.array('images', 5), updateProduct);
router.delete('/:productId', currentUser, requireAuth, deleteProduct);

// Admin Review Routes
router.patch('/:productId/approve', currentUser, requireAuth, requireRole('admin'), [
  body('status').isIn(['active', 'rejected', 'suspended']).withMessage('Invalid status')
], validateRequest, adminApproveProduct);

module.exports = router;
