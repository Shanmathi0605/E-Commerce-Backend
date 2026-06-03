const { BaseConsumer, Topics } = require('@ecommerce/common');
const DailyMetric = require('../models/daily-metric');
const GlobalMetric = require('../models/global-metric');
const kafka = require('../config/kafka');

class UserRegisteredConsumer extends BaseConsumer {
  get topic() {
    return Topics.USER_REGISTERED;
  }
  get groupId() {
    return 'analytics-user-registered-group';
  }
}

class ProductCreatedConsumer extends BaseConsumer {
  get topic() {
    return Topics.PRODUCT_CREATED;
  }
  get groupId() {
    return 'analytics-product-created-group';
  }
}

class OrderCreatedConsumer extends BaseConsumer {
  get topic() {
    return Topics.ORDER_CREATED;
  }
  get groupId() {
    return 'analytics-order-created-group';
  }
}

class PaymentSuccessfulConsumer extends BaseConsumer {
  get topic() {
    return Topics.PAYMENT_SUCCESSFUL;
  }
  get groupId() {
    return 'analytics-payment-success-group';
  }
}

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const incDailyMetric = async (updates) => {
  const date = getTodayDateString();
  try {
    await DailyMetric.findOneAndUpdate(
      { date },
      { $inc: updates },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error(`[Analytics] Failed to update daily metric for ${date}:`, err.message);
  }
};

const incGlobalMetric = async (updates) => {
  try {
    await GlobalMetric.findOneAndUpdate(
      { key: 'global_summary' },
      { $inc: updates },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[Analytics] Failed to update global metrics:', err.message);
  }
};

const startConsumers = async () => {
  const userConsumer = new UserRegisteredConsumer(kafka);
  const productConsumer = new ProductCreatedConsumer(kafka);
  const orderConsumer = new OrderCreatedConsumer(kafka);
  const paymentConsumer = new PaymentSuccessfulConsumer(kafka);

  try {
    // 1. User/Vendor Signup incrementer
    await userConsumer.listen(async (data) => {
      const { role } = data;
      console.log(`[Analytics] Logging registration of user role: ${role}`);

      if (role === 'vendor') {
        await incDailyMetric({ newVendors: 1 });
        await incGlobalMetric({ totalVendors: 1 });
      } else {
        await incDailyMetric({ newUsers: 1 });
        await incGlobalMetric({ totalUsers: 1 });
      }
    });

    // 2. Product Created incrementer
    await productConsumer.listen(async (data) => {
      console.log('[Analytics] Logging product creation');
      await incDailyMetric({ newProducts: 1 });
      await incGlobalMetric({ totalProducts: 1 });
    });

    // 3. Order Created incrementer
    await orderConsumer.listen(async (data) => {
      console.log('[Analytics] Logging order creation');
      await incDailyMetric({ totalOrders: 1 });
      await incGlobalMetric({ totalOrders: 1 });
    });

    // 4. Payment Successful sales totals tally
    await paymentConsumer.listen(async (data) => {
      const { amount } = data;
      console.log(`[Analytics] Logging successful payment receipt of amount: ${amount}`);

      const commission = Math.round(amount * 0.10 * 100) / 100; // 10% standard platform commission fee

      await incDailyMetric({
        totalSales: Number(amount),
        platformCommission: commission
      });

      await incGlobalMetric({
        totalSales: Number(amount),
        platformCommission: commission
      });
    });

  } catch (err) {
    console.error('[Analytics Consumers] Kafka listeners failed:', err);
  }
};

module.exports = { startConsumers };
