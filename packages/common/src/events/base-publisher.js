class BasePublisher {
  constructor(client) {
    this.client = client;
  }

  get topic() {
    throw new Error('Topic must be implemented');
  }

  async publish(data) {
    const producer = this.client.producer();
    try {
      await producer.connect();
      await producer.send({
        topic: this.topic,
        messages: [
          {
            value: JSON.stringify(data)
          }
        ]
      });
      console.log(`[Kafka] Event published to topic: ${this.topic}`);
    } catch (err) {
      console.error(`[Kafka] Failed to publish to topic: ${this.topic}. Error: ${err.message}. (Kafka is offline, continuing locally).`);
    } finally {
      try {
        await producer.disconnect();
      } catch (disErr) {}
    }
  }
}

module.exports = BasePublisher;
