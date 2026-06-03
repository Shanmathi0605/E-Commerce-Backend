const express = require('express');
const { currentUser, requireAuth, requireRole } = require('@ecommerce/common');
const { getAdminAnalytics, getVendorAnalytics } = require('../controllers/analytics-controller');

const router = express.Router();

router.use(currentUser);
router.use(requireAuth);

router.get('/admin', requireRole('admin'), getAdminAnalytics);
router.get('/vendor', requireRole('vendor'), getVendorAnalytics);

module.exports = router;
