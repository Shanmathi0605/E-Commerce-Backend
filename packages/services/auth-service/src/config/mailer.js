const nodemailer = require('nodemailer');

const mailConfig = {};

if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) {
  mailConfig.service = 'gmail';
} else {
  mailConfig.host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  mailConfig.port = parseInt(process.env.SMTP_PORT || '587', 10);
  mailConfig.secure = process.env.SMTP_SECURE === 'true';
}

mailConfig.auth = {
  user: process.env.SMTP_USER || 'mock-user@ethereal.email',
  pass: (process.env.SMTP_PASS || 'mock-pass').replace(/\s+/g, '')
};

const transporter = nodemailer.createTransport(mailConfig);

console.log(`[Email Mailer Config] service: ${mailConfig.service || 'custom'}, host: ${mailConfig.host || 'built-in'}, user: ${mailConfig.auth.user}, passLength: ${mailConfig.auth.pass ? mailConfig.auth.pass.length : 0}`);

const sendMail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"E-Commerce Marketplace" <noreply@ecommerce.com>',
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
  }

  // Always log to console so the user can easily see the OTP and content
  console.log(`\n==================================================
[EMAIL LOGGED TO CONSOLE]
Recipient: ${to}
Subject: ${subject}
--------------------------------------------------
${text}
==================================================\n`);
};

module.exports = { sendMail };
