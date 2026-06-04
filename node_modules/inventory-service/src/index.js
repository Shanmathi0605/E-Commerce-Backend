const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { startConsumers } = require('./events/consumers');
const inventoryRoutes = require('./routes/inventory-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount inventory routes
app.use('/api/inventory', inventoryRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  // Start Kafka Event listeners
  startConsumers(); // Non-blocking: runs in background, app starts regardless of Kafka status

  const PORT = process.env.PORT || 8005;
  app.listen(PORT, () => {
    console.log(`[Inventory Service] Listening on port ${PORT}`);
  });
};

start();
