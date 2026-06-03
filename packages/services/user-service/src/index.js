const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user-routes');
const { startConsumers } = require('./events/consumers');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount user routes
app.use('/api/users', userRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  // Start listening to Kafka events (User registered)
  await startConsumers();

  const PORT = process.env.PORT || 8002;
  app.listen(PORT, () => {
    console.log(`[User Service] Listening on port ${PORT}`);
  });
};

start();
