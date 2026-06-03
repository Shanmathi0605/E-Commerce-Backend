const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'mock-user@ethereal.email',
    pass: process.env.SMTP_PASS || 'mock-pass'
  }
});

const sendMail = async (to, subject, text, html) => {
  const mailOptions = {
    from: '"E-Commerce Marketplace" <noreply@ecommerce.com>',
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Mailer] Email dispatched to ${to}. MessageId: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Mailer] Test preview url: ${previewUrl}`);
    }
  } catch (err) {
    console.error(`[Email Mailer] Failed to send email to ${to}:`, err.message);
    console.log(`[Email Sandbox Console]
Recipient: ${to}
Subject: ${subject}
Content: ${text}`);
  }
};

module.exports = { sendMail };
