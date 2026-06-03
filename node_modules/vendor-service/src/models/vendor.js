const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  kycDocuments: {
    businessLicense: { type: String, default: '' },
    taxId: { type: String, default: '' },
    bankDetails: {
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      routingNumber: { type: String, default: '' }
    }
  },
  commissionPercentage: {
    type: Number,
    default: 10 // default 10% platform commission
  },
  followers: [{
    type: String
  }]
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

module.exports = mongoose.model('Vendor', vendorSchema);
