const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  price: { type: Number }, // overrides base price if set
  stock: { type: Number, required: true, default: 0 }
});

const productSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String
  }],
  variants: [variantSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending_approval', 'active', 'suspended', 'rejected'],
    default: 'pending_approval'
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

module.exports = mongoose.model('Product', productSchema);
