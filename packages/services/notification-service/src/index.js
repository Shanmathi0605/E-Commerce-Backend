const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const { initSocket } = require('./sockets/socket');
const { startConsumers } = require('./events/consumers');
const { errorHandler } = require('@ecommerce/common');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Notification service doesn't mount REST endpoints but runs HTTP Socket.IO & Kafka listeners
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK', service: 'Notification Service' });
});

app.use(errorHandler);

const server = http.createServer(app);

const start = async () => {
  // Initialize Socket.io
  initSocket(server);

  // Start Kafka consumers to listen to alerts and verification requests
  await startConsumers();

  const PORT = process.env.PORT || 8012;
  server.listen(PORT, () => {
    console.log(`[Notification Service] Running on port ${PORT}`);
  });
};

start();
