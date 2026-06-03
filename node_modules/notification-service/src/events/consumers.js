const { BaseConsumer, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');
const { sendMail } = require('../utils/mailer');
const { notifyUser, notifyAdmins } = require('../sockets/socket');

class EmailVerifyConsumer extends BaseConsumer {
  get topic() {
    return Topics.EMAIL_VERIFY;
  }
  get groupId() {
    return 'notification-email-verify-group';
  }
}

class OrderStatusConsumer extends BaseConsumer {
  get topic() {
    return Topics.ORDER_CREATED; // we listen to created/shipped/delivered in this group
  }
  get groupId() {
    return 'notification-order-events-group';
  }
}

class LowStockAlertConsumer extends BaseConsumer {
  get topic() {
    return Topics.LOW_STOCK_ALERT;
  }
  get groupId() {
    return 'notification-low-stock-group';
  }
}

const startConsumers = async () => {
  const emailConsumer = new EmailVerifyConsumer(kafka);
  const orderConsumer = new OrderStatusConsumer(kafka);
  const stockConsumer = new LowStockAlertConsumer(kafka);

  try {
    // 1. Email Verification and Reset Password OTPs
    await emailConsumer.listen(async (data) => {
      const { email, token, type } = data;
      console.log(`[Notification Consumer] Processing mail job for ${email} (Type: ${type})`);

      if (type === 'verify-email') {
        const subject = 'Welcome! Verify Your Email Address';
        const text = `Welcome to E-Commerce Marketplace. Your 6-digit verification code is: ${token}`;
        const html = `<h3>Welcome to E-Commerce Marketplace!</h3>
                      <p>Thank you for signing up. Please enter the following 6-digit verification OTP:</p>
                      <h2>${token}</h2>`;
        await sendMail(email, subject, text, html);
      } else if (type === 'reset-password') {
        const subject = 'Password Reset Request';
        const text = `You requested a password reset. Use the following token to complete the request: ${token}`;
        const html = `<h3>Password Reset Request</h3>
                      <p>You are receiving this because a password reset request was made for your account.</p>
                      <p>Please submit this reset token:</p>
                      <h2>${token}</h2>`;
        await sendMail(email, subject, text, html);
      }
    });

    // 2. Order Placed - Email Receipt & Browser Push
    await orderConsumer.listen(async (data) => {
      const { id: orderId, userId, totals, items } = data;
      console.log(`[Notification Consumer] Processing order mail & socket notification for order: ${orderId}`);

      // Send Browser Alert
      notifyUser(userId, 'order_update', {
        orderId,
        status: 'pending',
        message: `Your order ${orderId} has been received and is pending payment.`
      });

      // Send Admin Notification
      notifyAdmins('admin_alert', {
        type: 'new_order',
        message: `New Order Placed: ${orderId} (Amount: $${totals.total})`
      });
    });

    // 3. Low Stock alert - Browser pushes & Email alerts
    await stockConsumer.listen(async (data) => {
      const { productId, variantId, currentStock } = data;
      console.log(`[Notification Consumer] Processing low stock warnings for product: ${productId}`);

      // Broadcast alert to admin panel
      notifyAdmins('stock_alert', {
        productId,
        variantId,
        currentStock,
        message: `Warning: Stock for product ${productId} is low (${currentStock} items left).`
      });
    });

  } catch (err) {
    console.error('[Notification Service Consumers] Kafka listeners failed:', err);
  }
};

module.exports = { startConsumers };
