const { BasePublisher, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');

class PaymentSuccessfulPublisher extends BasePublisher {
  get topic() {
    return Topics.PAYMENT_SUCCESSFUL;
  }
}

class PaymentFailedPublisher extends BasePublisher {
  get topic() {
    return Topics.PAYMENT_FAILED;
  }
}

class RefundProcessedPublisher extends BasePublisher {
  get topic() {
    return Topics.REFUND_PROCESSED;
  }
}

module.exports = {
  paymentSuccessfulPublisher: new PaymentSuccessfulPublisher(kafka),
  paymentFailedPublisher: new PaymentFailedPublisher(kafka),
  refundProcessedPublisher: new RefundProcessedPublisher(kafka)
};
