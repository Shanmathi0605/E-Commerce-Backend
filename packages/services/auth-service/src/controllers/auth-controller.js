const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { BadRequestError, NotAuthorizedError } = require('@ecommerce/common');
const { emailVerifyPublisher, userRegisteredPublisher } = require('../events/publishers');
const { sendMail } = require('../config/mailer');

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
  const { email, password, registrationSecret } = req.body;

  let userRole = 'customer';
  if (registrationSecret) {
    if (registrationSecret === (process.env.ADMIN_REGISTRATION_KEY || 'admin123')) {
      userRole = 'admin';
    } else if (registrationSecret === (process.env.VENDOR_REGISTRATION_KEY || 'vendor123')) {
      userRole = 'vendor';
    } else {
      throw new BadRequestError('Invalid registration passcode');
    }
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new BadRequestError(`Email already in use`);
  }

  // Generate 6 digit OTP for email verification
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

  const user = new User({
    email,
    password,
    role: userRole,
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

  // Send Welcome & Verification Email directly
  const subject = 'Welcome to E-Commerce Marketplace!';
  const text = `Welcome! Your registration was successful. Please verify your email using this 6-digit OTP code: ${verificationToken}`;
  const html = `<h3>Welcome to E-Commerce Marketplace!</h3>
                <p>Hi there,</p>
                <p>Thank you for registering with us! Your registration was successful.</p>
                <p>Please enter the following 6-digit OTP verification code to complete your signup:</p>
                <h2 style="color: #4f46e5; letter-spacing: 2px;">${verificationToken}</h2>
                <p>Have a great day!</p>`;
  sendMail(user.email, subject, text, html).catch(err => {
    console.error(`[Auth Service] Welcome email error: ${err.message}`);
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
const login = async (req, res, next) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    // Google reCAPTCHA Verification
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnCF6M2vMtjJR18zwYHN';
    try {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
      const recaptchaResponse = await fetch(verifyUrl, { method: 'POST' });
      const recaptchaData = await recaptchaResponse.json();
      
      if (!recaptchaData.success) {
        throw new Error('reCAPTCHA verification failed. Please try again.');
      }
    } catch (err) {
      console.error('reCAPTCHA verification error:', err.message);
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestError(err.message || 'reCAPTCHA verification failed.');
      } else {
        console.log('[Dev Mode] Allowing login despite reCAPTCHA verification error (likely offline/network issue)');
      }
    }

    const users = await User.find({ email: email.toLowerCase() });
    if (!users || users.length === 0) {
      throw new BadRequestError('Invalid credentials (user not found)');
    }

    let matchedUser = null;
    for (const u of users) {
      const isMatch = await u.comparePassword(password);
      if (isMatch) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestError('Invalid credentials (incorrect password)');
    }

    if (matchedUser.isSuspended) {
      throw new BadRequestError('This account is suspended');
    }

    const token = generateToken(matchedUser);
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Send Login notification email directly
    const subject = 'New Login Detected';
    const text = `Hello! A new login was detected on your E-Commerce Marketplace account at ${new Date().toLocaleString()}.`;
    const html = `<h3>New Login Detected</h3>
                  <p>Hello,</p>
                  <p>We detected a new login to your account at <b>${new Date().toLocaleString()}</b>.</p>
                  <p>If this was you, you can safely ignore this email. If this wasn't you, please secure your account immediately by resetting your password.</p>`;
    sendMail(matchedUser.email, subject, text, html).catch(err => {
      console.error(`[Auth Service] Login email error: ${err.message}`);
    });

    res.status(200).send({ user: matchedUser, token });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    next(err);
  }
};

// Verify email address via OTP
const verifyEmail = async (req, res) => {
  const { email, token } = req.body;

  const user = await User.findOne({ email: email.toLowerCase(), verificationToken: token });
  if (!user) {
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

  const users = await User.find({ email: email.toLowerCase() });
  if (!users || users.length === 0) {
    throw new BadRequestError('No account with that email exists');
  }

  // Generate random 6-digit numeric OTP for forgot password reset
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  for (const user of users) {
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();
  }

  // Send Reset Email event
  await emailVerifyPublisher.publish({
    email: email.toLowerCase(),
    token: resetToken,
    type: 'reset-password'
  });

  // Send Forgot Password OTP Email directly
  const subject = 'Password Reset OTP';
  const text = `You requested a password reset. Use this 6-digit OTP code to complete the request: ${resetToken}`;
  const html = `<h3>Password Reset OTP</h3>
                <p>You requested a password reset. Please use the 6-digit OTP code below to reset your password:</p>
                <h2 style="color: #ef4444; letter-spacing: 2px;">${resetToken}</h2>
                <p>This code will expire in 1 hour.</p>
                <p>If you did not request this, you can ignore this email.</p>`;
  sendMail(email.toLowerCase(), subject, text, html).catch(err => {
    console.error(`[Auth Service] Forgot password email error: ${err.message}`);
  });

  res.status(200).send({ message: 'Password reset OTP sent to email' });
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
