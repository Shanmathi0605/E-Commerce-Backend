const Coupon = require('../models/coupon');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');

// Create Coupon
const createCoupon = async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, startDate, endDate, usageLimit, vendorId } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new BadRequestError('Coupon code already exists');
  }

  // Security: Vendor can only create vendor-specific coupon for themselves
  let finalVendorId = null;
  if (req.currentUser.role === 'vendor') {
    finalVendorId = req.currentUser.id;
  } else if (req.currentUser.role === 'admin') {
    finalVendorId = vendorId || null;
  }

  const coupon = new Coupon({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    usageLimit: usageLimit || null,
    vendorId: finalVendorId
  });

  await coupon.save();
  res.status(201).send(coupon);
};

// Retrieve coupons (Context dependent)
const getCoupons = async (req, res) => {
  let filter = {};

  if (req.currentUser.role === 'vendor') {
    filter.vendorId = req.currentUser.id;
  } else if (req.currentUser.role === 'customer') {
    // Customers only see active, public coupons
    filter.startDate = { $lte: new Date() };
    filter.endDate = { $gte: new Date() };
  }
  // Admin sees all

  const coupons = await Coupon.find(filter);
  res.status(200).send(coupons);
};

// Delete Coupon
const deleteCoupon = async (req, res) => {
  const { couponId } = req.params;
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new NotFoundError();
  }

  // Security checks
  if (req.currentUser.role === 'vendor' && coupon.vendorId !== req.currentUser.id) {
    throw new BadRequestError('Unauthorized to delete this coupon');
  }

  await Coupon.findByIdAndDelete(couponId);
  res.status(200).send({ message: 'Coupon removed successfully' });
};

// Validate Coupon status and calculate discounts
const validateCoupon = async (req, res) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    throw new BadRequestError('Coupon code is required');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    throw new NotFoundError('Coupon code not found');
  }

  const now = new Date();
  if (now < coupon.startDate) {
    throw new BadRequestError('Coupon is not yet active');
  }

  if (now > coupon.endDate) {
    throw new BadRequestError('Coupon has expired');
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new BadRequestError('Coupon usage limit has been reached');
  }

  if (orderAmount < coupon.minOrderAmount) {
    throw new BadRequestError(`Minimum order amount of $${coupon.minOrderAmount} required for this coupon`);
  }

  // Calculate discount value
  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = Math.min(coupon.discountValue, orderAmount);
  } else if (coupon.discountType === 'percentage') {
    discount = Math.round(orderAmount * (coupon.discountValue / 100) * 100) / 100;
  }

  res.status(200).send({
    valid: true,
    discount,
    coupon
  });
};

// Apply coupon (Redeem / Increment usage count)
const redeemCoupon = async (req, res) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    throw new NotFoundError();
  }

  // Increment usage count
  coupon.usageCount += 1;
  await coupon.save();

  res.status(200).send({ message: 'Coupon redeemed successfully', usageCount: coupon.usageCount });
};

module.exports = {
  createCoupon,
  getCoupons,
  deleteCoupon,
  validateCoupon,
  redeemCoupon
};
