const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const vendorRoutes = require('./routes/vendor-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Serve uploaded files statically so they can be rendered in the frontend
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount vendor routes
app.use('/api/vendors', vendorRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 8003;
  app.listen(PORT, () => {
    console.log(`[Vendor Service] Listening on port ${PORT}`);
  });
};

start();
