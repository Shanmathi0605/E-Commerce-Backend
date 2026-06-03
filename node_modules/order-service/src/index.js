const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { startConsumers } = require('./events/consumers');
const orderRoutes = require('./routes/order-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount order routes
app.use('/api/orders', orderRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  // Start Kafka Event listeners (e.g. payment confirmations)
  await startConsumers();

  const PORT = process.env.PORT || 8008;
  app.listen(PORT, () => {
    console.log(`[Order Service] Listening on port ${PORT}`);
  });
};

start();
