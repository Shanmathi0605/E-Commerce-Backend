const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        return false; // Stop retrying, fail connection to allow startup fallback
      }
      return 1000; // Retry after 1s
    }
  }
});

// Avoid throwing errors when Redis is offline by checking isOpen status first
const originalGet = redisClient.get.bind(redisClient);
const originalSet = redisClient.set.bind(redisClient);
const originalSetEx = redisClient.setEx.bind(redisClient);
const originalDel = redisClient.del.bind(redisClient);

redisClient.get = async (...args) => {
  if (!redisClient.isOpen) return null;
  return originalGet(...args);
};

redisClient.set = async (...args) => {
  if (!redisClient.isOpen) return null;
  return originalSet(...args);
};

redisClient.setEx = async (...args) => {
  if (!redisClient.isOpen) return null;
  return originalSetEx(...args);
};

redisClient.del = async (...args) => {
  if (!redisClient.isOpen) return null;
  return originalDel(...args);
};

redisClient.on('error', (err) => {
  // Only log non-connection errors or connection errors once to prevent flooding
  if (err.code !== 'ECONNREFUSED') {
    console.error('[Cart Service] Redis Client Error', err);
  }
});
redisClient.on('connect', () => console.log('[Cart Service] Connected to Redis'));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error('[Cart Service] Redis connection failed (running without cache)');
  }
};

module.exports = {
  redisClient,
  connectRedis
};
