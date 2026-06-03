const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' }
});

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  products: [wishlistItemSchema]
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

module.exports = mongoose.model('Wishlist', wishlistSchema);
