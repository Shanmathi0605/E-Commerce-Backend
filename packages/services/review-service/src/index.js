const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const reviewRoutes = require('./routes/review-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Serve uploaded review images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount review routes
app.use('/api/reviews', reviewRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 8010;
  app.listen(PORT, () => {
    console.log(`[Review Service] Listening on port ${PORT}`);
  });
};

start();
