const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'vendor-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

module.exports = kafka;
