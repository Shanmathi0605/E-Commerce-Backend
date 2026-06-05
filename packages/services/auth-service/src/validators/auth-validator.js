const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().withMessage('Email must be valid'),
  body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['customer', 'vendor', 'admin']).withMessage('Role must be customer, vendor, or admin')
];

const loginValidator = [
  body('email').isEmail().withMessage('Email must be valid'),
  body('password').trim().notEmpty().withMessage('Password must be supplied'),
  body('recaptchaToken').trim().notEmpty().withMessage('reCAPTCHA verification is required')
];

const verifyEmailValidator = [
  body('email').isEmail().withMessage('Email must be valid'),
  body('token').trim().notEmpty().withMessage('Token must be supplied')
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Email must be valid')
];

const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Token must be supplied'),
  body('newPassword').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const changePasswordValidator = [
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),
  body('newPassword').trim().isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator
};
