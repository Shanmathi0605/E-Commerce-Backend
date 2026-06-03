const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_order';
    await mongoose.connect(mongoURI);
    console.log('[Order Service] Connected to MongoDB');
  } catch (err) {
    console.error('[Order Service] MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
