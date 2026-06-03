const express = require('express');
const { currentUser, validateRequest, requireAuth } = require('@ecommerce/common');
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getCurrentUser,
  refreshToken
} = require('../controllers/auth-controller');
const {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator
} = require('../validators/auth-validator');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, register);
router.post('/login', loginValidator, validateRequest, login);
router.post('/logout', logout);
router.post('/verify-email', verifyEmailValidator, validateRequest, verifyEmail);
router.post('/forgot-password', forgotPasswordValidator, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validateRequest, resetPassword);
router.post('/change-password', currentUser, requireAuth, changePasswordValidator, validateRequest, changePassword);
router.get('/currentuser', currentUser, getCurrentUser);
router.post('/refresh-token', currentUser, refreshToken);

module.exports = router;
