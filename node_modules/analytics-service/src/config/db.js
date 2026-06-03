const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_analytics';
    await mongoose.connect(mongoURI);
    console.log('[Analytics Service] Connected to MongoDB');
  } catch (err) {
    console.error('[Analytics Service] MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
