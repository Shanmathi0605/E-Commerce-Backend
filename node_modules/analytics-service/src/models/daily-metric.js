const mongoose = require('mongoose');

const dailyMetricSchema = new mongoose.Schema({
  date: {
    type: String, // format YYYY-MM-DD
    required: true,
    unique: true
  },
  totalOrders: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  newVendors: { type: Number, default: 0 },
  newProducts: { type: Number, default: 0 }
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

module.exports = mongoose.model('DailyMetric', dailyMetricSchema);
