const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });
require('dotenv').config();
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 8001;
  app.listen(PORT, () => {
    console.log(`[Auth Service] Listening on port ${PORT}`);
  });
};

start();
