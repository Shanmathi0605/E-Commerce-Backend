const Wallet = require('../models/wallet');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');

const getOrCreateWallet = async (currentUser) => {
  let wallet = await Wallet.findOne({ userId: currentUser.id });
  if (!wallet) {
    wallet = new Wallet({ userId: currentUser.id, balance: 0 });
    await wallet.save();
  }
  return wallet;
};

// Get wallet balance and transaction logs
const getWallet = async (req, res) => {
  const wallet = await getOrCreateWallet(req.currentUser);
  res.status(200).send(wallet);
};

// Add mock funds (e.g. credit card deposit, wallet top-up)
const addFunds = async (req, res) => {
  const { amount, description } = req.body;
  if (!amount || amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  const wallet = await getOrCreateWallet(req.currentUser);

  wallet.balance += Number(amount);
  wallet.transactions.push({
    amount: Number(amount),
    type: 'credit',
    description: description || 'Funds added to wallet'
  });

  await wallet.save();
  res.status(200).send(wallet);
};

// Debit payment from wallet
const payWithWallet = async (req, res) => {
  const { amount, description } = req.body;
  if (!amount || amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  const wallet = await getOrCreateWallet(req.currentUser);

  if (wallet.balance < amount) {
    throw new BadRequestError('Insufficient wallet balance');
  }

  wallet.balance -= Number(amount);
  wallet.transactions.push({
    amount: Number(amount),
    type: 'debit',
    description: description || 'Wallet payment transaction'
  });

  await wallet.save();
  res.status(200).send(wallet);
};

module.exports = {
  getWallet,
  addFunds,
  payWithWallet
};
