const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  quantity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const inventorySchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  variantId: {
    type: String,
    default: '', // empty if base product stock
    index: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  reservations: [reservationSchema]
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

// Compound unique index for product variant stock levels
inventorySchema.index({ productId: 1, variantId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
