const { BaseConsumer, Topics } = require('@ecommerce/common');
const Order = require('../models/order');
const kafka = require('../config/kafka');
const { orderCancelledPublisher } = require('./publishers');

class PaymentSuccessfulConsumer extends BaseConsumer {
  get topic() {
    return Topics.PAYMENT_SUCCESSFUL;
  }
  get groupId() {
    return 'order-payment-success-group';
  }
}

class PaymentFailedConsumer extends BaseConsumer {
  get topic() {
    return Topics.PAYMENT_FAILED;
  }
  get groupId() {
    return 'order-payment-failed-group';
  }
}

const startConsumers = async () => {
  const successConsumer = new PaymentSuccessfulConsumer(kafka);
  const failedConsumer = new PaymentFailedConsumer(kafka);

  try {
    // 1. Payment Successful listener
    await successConsumer.listen(async (data) => {
      const { orderId } = data;
      console.log(`[Order Service] Payment success for Order: ${orderId}`);

      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();
        console.log(`[Order Service] Order status updated to CONFIRMED for: ${orderId}`);
      }
    });

    // 2. Payment Failed listener
    await failedConsumer.listen(async (data) => {
      const { orderId } = data;
      console.log(`[Order Service] Payment failed for Order: ${orderId}`);

      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'failed';
        order.orderStatus = 'cancelled';
        await order.save();

        // Broadcast cancellation event so inventory service knows to release stock
        await orderCancelledPublisher.publish({
          id: order._id,
          items: order.items
        });
        console.log(`[Order Service] Order status updated to CANCELLED for: ${orderId}`);
      }
    });

  } catch (err) {
    console.error('[Order Service Consumers] Kafka consumer setup failure:', err);
  }
};

module.exports = { startConsumers };
