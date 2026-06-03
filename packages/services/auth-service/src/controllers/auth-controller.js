const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { BadRequestError, NotAuthorizedError } = require('@ecommerce/common');
const { emailVerifyPublisher, userRegisteredPublisher } = require('../events/publishers');

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    },
    process.env.JWT_KEY || 'asdfasdf',
    { expiresIn: '24h' }
  );
};

// Register Customer/Vendor/Admin
const register = async (req, res) => {
  const { email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError('Email already in use');
  }

  // Generate 6 digit OTP for email verification
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

  const user = new User({
    email,
    password,
    role: role || 'customer',
    isVerified: false,
    verificationToken
  });

  await user.save();

  // Publish email verification event
  await emailVerifyPublisher.publish({
    email: user.email,
    token: verificationToken,
    type: 'verify-email'
  });

  // Publish registration event to sync to User/Vendor profile microservices
  await userRegisteredPublisher.publish({
    id: user._id,
    email: user.email,
    role: user.role
  });

  const token = generateToken(user);
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.status(201).send({ user, token });
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }

  if (user.isSuspended) {
    throw new BadRequestError('This account is suspended');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new BadRequestError('Invalid credentials');
  }

  const token = generateToken(user);
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.status(200).send({ user, token });
};

// Verify email address via OTP
const verifyEmail = async (req, res) => {
  const { email, token } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError('User not found');
  }

  if (user.verificationToken !== token) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  // Re-generate token with isVerified: true
  const jwtToken = generateToken(user);
  res.cookie('jwt', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.status(200).send({ message: 'Email verified successfully', user, token: jwtToken });
};

// Forgot Password link generation
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError('No account with that email exists');
  }

  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send Reset Email event
  await emailVerifyPublisher.publish({
    email: user.email,
    token: resetToken,
    type: 'reset-password'
  });

  res.status(200).send({ message: 'Password reset link sent to email' });
};

// Reset Password update
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).send({ message: 'Password reset successful' });
};

// Change Password (while authenticated)
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!req.currentUser) {
    throw new NotAuthorizedError();
  }

  const user = await User.findById(req.currentUser.id);
  if (!user) {
    throw new NotAuthorizedError();
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new BadRequestError('Incorrect current password');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).send({ message: 'Password changed successfully' });
};

// Logout user
const logout = async (req, res) => {
  res.clearCookie('jwt');
  res.status(200).send({ message: 'Logged out successfully' });
};

// Get current logged-in user
const getCurrentUser = async (req, res) => {
  res.status(200).send({ currentUser: req.currentUser || null });
};

// Refresh token
const refreshToken = async (req, res) => {
  if (!req.currentUser) {
    return res.status(200).send({ token: null });
  }

  const user = await User.findById(req.currentUser.id);
  if (!user || user.isSuspended) {
    res.clearCookie('jwt');
    throw new NotAuthorizedError();
  }

  const token = generateToken(user);
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.status(200).send({ user, token });
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getCurrentUser,
  refreshToken
};
