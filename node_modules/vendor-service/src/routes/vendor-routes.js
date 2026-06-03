const express = require('express');
const { currentUser, requireAuth, requireRole, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const upload = require('../utils/uploader');
const {
  registerVendor,
  getVendorProfile,
  getVendorPublicProfile,
  followVendor,
  updateVendorProfile,
  adminApproveVendor,
  adminManageCommission,
  getAllVendors
} = require('../controllers/vendor-controller');

const router = express.Router();

// Public seller store browsing for consumers
router.get('/store/:vendorId', getVendorPublicProfile);

// Follow a store (Customer authenticated)
router.post('/store/:vendorId/follow', currentUser, requireAuth, followVendor);

// Vendor authenticated routes
router.get('/profile', currentUser, requireAuth, getVendorProfile);

router.post('/register', currentUser, requireAuth, upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), [
  body('storeName').trim().notEmpty().withMessage('Store name is required'),
  body('taxId').trim().notEmpty().withMessage('Tax ID is required')
], validateRequest, registerVendor);

router.put('/profile', currentUser, requireAuth, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), updateVendorProfile);

// Admin-only vendor review routes
router.get('/admin/list', currentUser, requireAuth, requireRole('admin'), getAllVendors);

router.patch('/admin/:vendorId/approve', currentUser, requireAuth, requireRole('admin'), [
  body('status').isIn(['approved', 'rejected', 'suspended']).withMessage('Invalid status')
], validateRequest, adminApproveVendor);

router.patch('/admin/:vendorId/commission', currentUser, requireAuth, requireRole('admin'), [
  body('commissionPercentage').isFloat({ min: 0, max: 100 }).withMessage('Commission must be between 0 and 100')
], validateRequest, adminManageCommission);

module.exports = router;
