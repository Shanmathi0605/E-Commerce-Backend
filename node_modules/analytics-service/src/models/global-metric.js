const mongoose = require('mongoose');

const globalMetricSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'global_summary'
  },
  totalUsers: { type: Number, default: 0 },
  totalVendors: { type: Number, default: 0 },
  totalProducts: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 0 }
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

module.exports = mongoose.model('GlobalMetric', globalMetricSchema);
