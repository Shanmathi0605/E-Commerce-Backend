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
      const { id: orderId, userId, userEmail, totals, items, shippingAddress, invoicePdf } = data;
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
        message: `New Order Placed: ${orderId} (Amount: ₹${totals.total})`
      });

      // Send Email Receipt to User
      if (userEmail) {
        const subject = `Order Placed Successfully: #${orderId}`;
        
        const resolveImageUrl = (img) => {
          if (!img) return '';
          if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
          }
          const gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:8000';
          return `${gatewayUrl}${img.startsWith('/') ? '' : '/'}${img}`;
        };

        // Compile items list HTML
        const itemsHtml = items.map(item => {
          const imageUrl = resolveImageUrl(item.image);
          return `
          <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
            ${imageUrl ? `<img src="${imageUrl}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />` : '<div style="width: 60px; height: 60px; border-radius: 8px; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 15px;">🌿</div>'}
            <div style="flex-grow: 1;">
              <h4 style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 600;">${item.title}</h4>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Quantity: ${item.quantity} | Price: ₹${item.price.toFixed(2)}</p>
            </div>
            <div style="text-align: right; font-weight: 600; color: #0f172a; font-size: 15px; min-width: 80px;">
              ₹${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        `;
        }).join('');

        const text = `Thank you for your order! Your order #${orderId} has been received. Total amount is ₹${totals.total.toFixed(2)}.`;

        const html = `
          <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #34d399; margin-bottom: 25px;">
              <h2 style="color: #061c15; margin: 0; font-size: 26px; letter-spacing: 1px;">GLASS</h2>
              <p style="color: #059669; font-size: 14px; margin: 4px 0 0 0; font-weight: 500;">Order Success Confirmation</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">Thank you for your purchase!</h3>
              <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                Your order <strong>#${orderId}</strong> has been successfully placed. We've verified your transaction and are prepping your items for delivery.
              </p>
            </div>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <h4 style="margin-top: 0; margin-bottom: 8px; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</h4>
              <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.5;">
                <strong>${shippingAddress?.name || 'Customer'}</strong><br/>
                ${shippingAddress?.street || ''}, ${shippingAddress?.city || ''}<br/>
                ${shippingAddress?.state || ''} - ${shippingAddress?.zipCode || ''}, ${shippingAddress?.country || ''}<br/>
                Phone: ${shippingAddress?.phone || ''}
              </p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">Items Ordered</h3>
              ${itemsHtml}
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <table style="width: 100%; font-size: 14px; color: #475569; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                  <td style="text-align: right; padding: 6px 0; font-weight: 500; color: #1e293b;">₹${totals.subtotal.toFixed(2)}</td>
                </tr>
                ${totals.discount > 0 ? `
                <tr>
                  <td style="padding: 6px 0; color: #dc2626;">Discount Applied:</td>
                  <td style="text-align: right; padding: 6px 0; font-weight: 500; color: #dc2626;">-₹${totals.discount.toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Estimated Tax (18%):</td>
                  <td style="text-align: right; padding: 6px 0; font-weight: 500; color: #1e293b;">₹${totals.tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Shipping Fee:</td>
                  <td style="text-align: right; padding: 6px 0; font-weight: 500; color: #1e293b;">${totals.shipping === 0 ? 'FREE' : `₹${totals.shipping.toFixed(2)}`}</td>
                </tr>
                <tr style="font-size: 18px; font-weight: 700; color: #0f172a;">
                  <td style="padding: 15px 0 0 0; border-top: 2px dashed #e2e8f0;">Grand Total:</td>
                  <td style="text-align: right; padding: 15px 0 0 0; border-top: 2px dashed #e2e8f0; color: #059669;">₹${totals.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="margin-top: 35px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              <p style="margin: 0 0 6px 0;">This is an automated email receipt for your purchase. Please do not reply directly.</p>
              <p style="margin: 0; font-weight: 500;">&copy; 2026 GLASS Inc. All rights reserved.</p>
            </div>
          </div>
        `;

        const attachments = [];
        if (invoicePdf) {
          attachments.push({
            filename: `invoice-${orderId}.pdf`,
            content: Buffer.from(invoicePdf, 'base64'),
            contentType: 'application/pdf'
          });
        }
        await sendMail(userEmail, subject, text, html, attachments);
      }
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
