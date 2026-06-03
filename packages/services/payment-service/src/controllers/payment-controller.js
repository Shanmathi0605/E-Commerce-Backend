const Payment = require('../models/payment');
const stripe = require('stripe');
const Razorpay = require('razorpay');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');
const {
  paymentSuccessfulPublisher,
  paymentFailedPublisher,
  refundProcessedPublisher
} = require('../events/publishers');

// Initialize gateway clients dynamically
const stripeClient = process.env.STRIPE_SECRET_KEY ? stripe(process.env.STRIPE_SECRET_KEY) : null;
const razorpayClient = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// Process a payment
const processPayment = async (req, res) => {
  const { orderId, amount, paymentMethod, paymentToken } = req.body;
  const userId = req.currentUser.id;

  let transactionId = 'TXN-' + Math.random().toString(36).substring(2, 11).toUpperCase();
  let paymentStatus = 'success';

  try {
    if (paymentMethod === 'stripe') {
      if (stripeClient) {
        // Execute real Stripe charge
        const charge = await stripeClient.charges.create({
          amount: Math.round(amount * 100), // in cents
          currency: 'usd',
          source: paymentToken || 'tok_visa', // visa sandbox token
          description: `E-Commerce Order: ${orderId}`
        });
        transactionId = charge.id;
        paymentStatus = charge.status === 'succeeded' ? 'success' : 'failed';
      } else {
        console.log('[Payment Service] Stripe credentials not set. Simulating Stripe Sandbox Succeeded.');
      }
    } else if (paymentMethod === 'razorpay') {
      if (razorpayClient) {
        // Execute real Razorpay capture
        const capture = await razorpayClient.payments.capture(paymentToken, Math.round(amount * 100), 'INR');
        transactionId = capture.id;
        paymentStatus = capture.status === 'captured' ? 'success' : 'failed';
      } else {
        console.log('[Payment Service] Razorpay credentials not set. Simulating Razorpay Sandbox Succeeded.');
      }
    } else if (paymentMethod === 'wallet') {
      // Wallet payments deduction logic is processed in User Wallet controller
      console.log('[Payment Service] Wallet payment approved.');
    } else if (paymentMethod === 'cod') {
      console.log('[Payment Service] COD payment pending delivery.');
      paymentStatus = 'pending';
    }

    const payment = new Payment({
      orderId,
      userId,
      amount,
      method: paymentMethod,
      transactionId,
      status: paymentStatus
    });

    await payment.save();

    if (paymentStatus === 'success') {
      // Publish PAYMENT_SUCCESSFUL
      await paymentSuccessfulPublisher.publish({
        orderId,
        amount,
        userId,
        transactionId
      });
    } else if (paymentStatus === 'failed') {
      // Publish PAYMENT_FAILED
      await paymentFailedPublisher.publish({
        orderId,
        userId
      });
    }

    res.status(200).send(payment);

  } catch (err) {
    console.error('[Payment Process Error]', err.message);
    
    // Log failed record
    const payment = new Payment({
      orderId,
      userId,
      amount,
      method: paymentMethod,
      transactionId,
      status: 'failed'
    });
    await payment.save();

    await paymentFailedPublisher.publish({
      orderId,
      userId
    });

    throw new BadRequestError('Payment processing failed: ' + err.message);
  }
};

// Process Refund (Admin only)
const processRefund = async (req, res) => {
  const { orderId, refundReason } = req.body;

  const payment = await Payment.findOne({ orderId, status: 'success' });
  if (!payment) {
    throw new NotFoundError();
  }

  let refundTxId = 'RFD-' + Math.random().toString(36).substring(2, 11).toUpperCase();

  try {
    if (payment.method === 'stripe' && stripeClient) {
      const refund = await stripeClient.refunds.create({
        charge: payment.transactionId
      });
      refundTxId = refund.id;
    } else if (payment.method === 'razorpay' && razorpayClient) {
      const refund = await razorpayClient.payments.refund(payment.transactionId, {
        amount: Math.round(payment.amount * 100)
      });
      refundTxId = refund.id;
    }

    payment.status = 'refunded';
    payment.refundDetails = {
      refundTransactionId: refundTxId,
      refundAmount: payment.amount,
      refundReason: refundReason || 'Customer cancellation refund',
      refundedAt: new Date()
    };

    await payment.save();

    // Broadcast REFUND_PROCESSED
    await refundProcessedPublisher.publish({
      orderId,
      amount: payment.amount,
      userId: payment.userId,
      refundTransactionId: refundTxId
    });

    res.status(200).send(payment);

  } catch (err) {
    console.error('[Payment Refund Error]', err.message);
    throw new BadRequestError('Failed to process refund: ' + err.message);
  }
};

module.exports = {
  processPayment,
  processRefund
};
