const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  referredBy: {
    type: String,
    default: null
  },
  referrals: [{
    type: String
  }],
  rewardsEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Referral', referralSchema);
