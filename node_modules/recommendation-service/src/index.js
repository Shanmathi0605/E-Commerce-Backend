const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const recommendationRoutes = require('./routes/recommendation-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount recommendation routes
app.use('/api/recommendations', recommendationRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 8014;
  app.listen(PORT, () => {
    console.log(`[Recommendation Service] Listening on port ${PORT}`);
  });
};

start();
