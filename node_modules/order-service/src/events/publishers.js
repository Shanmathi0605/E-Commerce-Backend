const { BasePublisher, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');

class OrderCreatedPublisher extends BasePublisher {
  get topic() {
    return Topics.ORDER_CREATED;
  }
}

class OrderCancelledPublisher extends BasePublisher {
  get topic() {
    return Topics.ORDER_CANCELLED;
  }
}

class OrderShippedPublisher extends BasePublisher {
  get topic() {
    return Topics.ORDER_SHIPPED;
  }
}

class OrderDeliveredPublisher extends BasePublisher {
  get topic() {
    return Topics.ORDER_DELIVERED;
  }
}

module.exports = {
  orderCreatedPublisher: new OrderCreatedPublisher(kafka),
  orderCancelledPublisher: new OrderCancelledPublisher(kafka),
  orderShippedPublisher: new OrderShippedPublisher(kafka),
  orderDeliveredPublisher: new OrderDeliveredPublisher(kafka)
};
