const PDFDocument = require('pdfkit');

const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Title Headers
  doc.fontSize(20).text('TAX INVOICE', { align: 'right' });
  doc.fontSize(14).text('E-Commerce Marketplace Ltd.', 50, 50);
  doc.fontSize(10).text('123 Enterprise Way, Tech Corridor', 50, 70);
  doc.moveDown();

  // Invoice specifications
  doc.fontSize(12).text(`Order ID: ${order._id}`);
  doc.text(`Order Date: ${new Date(order.createdAt).toDateString()}`);
  doc.text(`Payment Mode: ${order.paymentMethod.toUpperCase()}`);
  doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`);
  doc.moveDown();

  // Ship-to block
  doc.fontSize(12).text('Shipping Destination:', { underline: true });
  doc.fontSize(10).text(order.shippingAddress.name);
  doc.text(order.shippingAddress.phone);
  doc.text(order.shippingAddress.street);
  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}`);
  doc.text(order.shippingAddress.country);
  doc.moveDown();

  // Draw table header columns
  doc.fontSize(10).text('Description', 50, 280);
  doc.text('Qty', 300, 280);
  doc.text('Unit Price', 350, 280);
  doc.text('Total', 450, 280);
  doc.moveDown();

  let y = 300;
  // Write item listings
  order.items.forEach((item) => {
    doc.text(item.title, 50, y);
    doc.text(item.quantity.toString(), 300, y);
    doc.text(`$${item.price.toFixed(2)}`, 350, y);
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 450, y);
    y += 20;
  });

  // Draw separator line
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;

  // Render totals calculations
  doc.text('Subtotal:', 350, y);
  doc.text(`$${order.totals.subtotal.toFixed(2)}`, 450, y);
  y += 15;
  
  if (order.totals.discount > 0) {
    doc.text('Discount Applied:', 350, y);
    doc.text(`-$${order.totals.discount.toFixed(2)}`, 450, y);
    y += 15;
  }
  
  doc.text('Estimated Tax:', 350, y);
  doc.text(`$${order.totals.tax.toFixed(2)}`, 450, y);
  y += 15;
  
  doc.text('Shipping Charges:', 350, y);
  doc.text(`$${order.totals.shipping.toFixed(2)}`, 450, y);
  y += 15;

  doc.fontSize(12).text('Grand Total:', 350, y, { bold: true });
  doc.text(`$${order.totals.total.toFixed(2)}`, 450, y, { bold: true });

  doc.end();
};

module.exports = { generateInvoicePDF };
