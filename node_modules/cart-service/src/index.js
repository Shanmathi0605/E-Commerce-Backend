const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const cartRoutes = require('./routes/cart-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount cart routes
app.use('/api/cart', cartRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database & Cache
  await connectDB();
  await connectRedis();

  const PORT = process.env.PORT || 8006;
  app.listen(PORT, () => {
    console.log(`[Cart Service] Listening on port ${PORT}`);
  });
};

start();
