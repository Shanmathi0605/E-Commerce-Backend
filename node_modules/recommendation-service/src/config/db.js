const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_recommendation';
    await mongoose.connect(mongoURI);
    console.log('[Recommendation Service] Connected to MongoDB');
  } catch (err) {
    console.error('[Recommendation Service] MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
