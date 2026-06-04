const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { startConsumers } = require('./events/consumers');
const analyticsRoutes = require('./routes/analytics-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount analytics routes
app.use('/api/analytics', analyticsRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  // Start Kafka listeners to log events for charts
  startConsumers(); // Non-blocking: runs in background, app starts regardless of Kafka status

  const PORT = process.env.PORT || 8013;
  app.listen(PORT, () => {
    console.log(`[Analytics Service] Listening on port ${PORT}`);
  });
};

start();
