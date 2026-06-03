const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_auth';
    await mongoose.connect(mongoURI);
    console.log('[Auth Service] Connected to MongoDB');
  } catch (err) {
    console.error('[Auth Service] MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
