const Referral = require('../models/referral');
const Wallet = require('../models/wallet');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');

const getOrCreateReferral = async (currentUser) => {
  let referral = await Referral.findOne({ userId: currentUser.id });
  if (!referral) {
    const code = 'REF-' + currentUser.id.substring(currentUser.id.length - 6).toUpperCase();
    referral = new Referral({
      userId: currentUser.id,
      referralCode: code
    });
    await referral.save();
  }
  return referral;
};

// Get referral details
const getReferralStats = async (req, res) => {
  const referral = await getOrCreateReferral(req.currentUser);
  res.status(200).send(referral);
};

// Apply another user's referral code
const applyReferralCode = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    throw new BadRequestError('Referral code is required');
  }

  const referral = await getOrCreateReferral(req.currentUser);

  if (referral.referredBy) {
    throw new BadRequestError('Referral code has already been applied');
  }

  // Find the referrer
  const referrer = await Referral.findOne({ referralCode: code.toUpperCase() });
  if (!referrer) {
    throw new BadRequestError('Invalid referral code');
  }

  if (referrer.userId === req.currentUser.id) {
    throw new BadRequestError('You cannot apply your own referral code');
  }

  // Apply referral mapping
  referral.referredBy = referrer.userId;
  referrer.referrals.push(req.currentUser.id);
  referrer.rewardsEarned += 50; // $50 reward for referring a friend

  await referral.save();
  await referrer.save();

  // Credit Referrer's Wallet
  const referrerWallet = await Wallet.findOne({ userId: referrer.userId });
  if (referrerWallet) {
    referrerWallet.balance += 50;
    referrerWallet.transactions.push({
      amount: 50,
      type: 'credit',
      description: `Referral bonus for inviting user ${req.currentUser.email}`
    });
    await referrerWallet.save();
  }

  // Credit Referred User's Wallet
  const userWallet = await Wallet.findOne({ userId: req.currentUser.id });
  if (userWallet) {
    userWallet.balance += 20; // $20 sign-up bonus
    userWallet.transactions.push({
      amount: 20,
      type: 'credit',
      description: `Sign-up referral bonus using code ${code.toUpperCase()}`
    });
    await userWallet.save();
  }

  res.status(200).send({
    message: 'Referral code applied successfully. Rewards credited!',
    referral
  });
};

module.exports = {
  getReferralStats,
  applyReferralCode
};
