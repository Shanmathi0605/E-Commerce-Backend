const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { checkElasticsearch } = require('./config/elasticsearch');
const { startConsumers } = require('./events/consumers');
const productRoutes = require('./routes/product-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Serve uploaded product assets statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount product routes
app.use('/api/products', productRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to databases & cache
  await connectDB();
  await connectRedis();
  await checkElasticsearch();

  // Start Kafka consumers to sync MongoDB changes to Elasticsearch
  await startConsumers();

  const PORT = process.env.PORT || 8004;
  app.listen(PORT, () => {
    console.log(`[Product Service] Listening on port ${PORT}`);
  });
};

start();
