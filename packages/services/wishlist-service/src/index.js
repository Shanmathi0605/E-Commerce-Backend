const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const wishlistRoutes = require('./routes/wishlist-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount wishlist routes
app.use('/api/wishlist', wishlistRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 8007;
  app.listen(PORT, () => {
    console.log(`[Wishlist Service] Listening on port ${PORT}`);
  });
};

start();
