const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  searchQueries: [{
    type: String
  }],
  viewedProductIds: [{
    type: String
  }],
  purchaseProductIds: [{
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

module.exports = mongoose.model('UserActivity', userActivitySchema);
