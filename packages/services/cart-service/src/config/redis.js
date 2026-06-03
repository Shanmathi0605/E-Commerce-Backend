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

redisClient.on('error', (err) => console.error('[Cart Service] Redis Client Error', err));
redisClient.on('connect', () => console.log('[Cart Service] Connected to Redis'));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error('[Cart Service] Redis connection failed:', err);
  }
};

module.exports = {
  redisClient,
  connectRedis
};
