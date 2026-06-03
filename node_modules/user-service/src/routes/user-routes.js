const express = require('express');
const { currentUser, requireAuth, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/profile-controller');
const { getWallet, addFunds, payWithWallet } = require('../controllers/wallet-controller');
const { getReferralStats, applyReferralCode } = require('../controllers/referral-controller');

const router = express.Router();

// Apply auth middlewares
router.use(currentUser);
router.use(requireAuth);

// Profile
router.get('/profile', getProfile);
router.put('/profile', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty')
], validateRequest, updateProfile);

// Shipping & Billing Addresses
router.post('/addresses', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('street').trim().notEmpty().withMessage('Street address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('country').trim().notEmpty().withMessage('Country is required')
], validateRequest, addAddress);

router.put('/addresses/:addressId', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('street').optional().trim().notEmpty().withMessage('Street address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('zipCode').optional().trim().notEmpty().withMessage('Zip code cannot be empty'),
  body('country').optional().trim().notEmpty().withMessage('Country cannot be empty')
], validateRequest, updateAddress);

router.delete('/addresses/:addressId', deleteAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

// Wallet Operations
router.get('/wallet', getWallet);
router.post('/wallet/add-funds', [
  body('amount').isFloat({ min: 1 }).withMessage('Deposit amount must be at least 1'),
  body('description').optional().trim()
], validateRequest, addFunds);
router.post('/wallet/pay', [
  body('amount').isFloat({ min: 1 }).withMessage('Payment amount must be at least 1'),
  body('description').optional().trim()
], validateRequest, payWithWallet);

// Referral Program
router.get('/referrals', getReferralStats);
router.post('/referrals/apply', [
  body('code').trim().notEmpty().withMessage('Referral code is required')
], validateRequest, applyReferralCode);

module.exports = router;
