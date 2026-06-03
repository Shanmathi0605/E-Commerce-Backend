const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const couponRoutes = require('./routes/coupon-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount coupon routes
app.use('/api/coupons', couponRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 8011;
  app.listen(PORT, () => {
    console.log(`[Coupon Service] Listening on port ${PORT}`);
  });
};

start();
