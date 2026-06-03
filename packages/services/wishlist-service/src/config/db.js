const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_wishlist';
    await mongoose.connect(mongoURI);
    console.log('[Wishlist Service] Connected to MongoDB');
  } catch (err) {
    console.error('[Wishlist Service] MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
