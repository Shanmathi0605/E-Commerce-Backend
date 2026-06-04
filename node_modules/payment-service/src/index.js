const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const paymentRoutes = require('./routes/payment-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount payment routes
app.use('/api/payments', paymentRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 8009;
  app.listen(PORT, () => {
    console.log(`[Payment Service] Listening on port ${PORT}`);
  });
};

start();
