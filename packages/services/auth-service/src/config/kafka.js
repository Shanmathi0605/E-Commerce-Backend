const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    retries: 0
  },
  connectionTimeout: 1000
});

module.exports = kafka;
