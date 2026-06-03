const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

module.exports = kafka;
