class BaseConsumer {
  constructor(client) {
    this.client = client;
  }

  get topic() {
    throw new Error('Topic must be implemented');
  }

  get groupId() {
    throw new Error('GroupId must be implemented');
  }

  async listen(onMessage) {
    const consumer = this.client.consumer({ groupId: this.groupId });
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: this.topic, fromBeginning: true });
      
      console.log(`[Kafka] Subscribed and listening on topic: ${this.topic} (Group: ${this.groupId})`);
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log(`[Kafka] Received event on ${topic} [partition ${partition}]`);
          try {
            const parsedData = JSON.parse(message.value.toString());
            await onMessage(parsedData, message);
          } catch (err) {
            console.error(`[Kafka] Error processing event in ${this.groupId} for topic ${topic}`, err);
          }
        }
      });
    } catch (err) {
      console.error(`[Kafka] Consumer connection failed for topic: ${this.topic}`, err);
      throw err;
    }
  }
}

module.exports = BaseConsumer;
