const PDFDocument = require('pdfkit');

/**
 * Generates a styled PDF invoice for an order.
 * If writeStream is provided, it pipes the PDF directly to the stream.
 * Otherwise, it returns a Promise that resolves to a Buffer.
 * @param {Object} order - The order document from Mongoose.
 * @param {WritableStream} [writeStream] - Optional stream to pipe PDF.
 * @returns {Promise<Buffer>|null}
 */
const generateInvoicePDF = (order, writeStream = null) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const buildPDF = (pdfDoc) => {
    // Header/Branding
    pdfDoc.fillColor('#10b981').fontSize(26).text('GLASS', 50, 45);
    pdfDoc.fillColor('#374151').fontSize(9).text('Glass Plant & Nursery Store', 50, 75);
    pdfDoc.text('123 Green Avenue, Garden City', 50, 88);
    pdfDoc.text('contact@glassplants.com', 50, 101);

    // Invoice metadata (top right)
    pdfDoc.fillColor('#111827').fontSize(18).text('INVOICE', 400, 45, { align: 'right' });
    pdfDoc.fillColor('#4b5563').fontSize(9);
    pdfDoc.text(`Invoice No: INV-${order._id.toString().slice(-6).toUpperCase()}`, 400, 70, { align: 'right' });
    pdfDoc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`, 400, 83, { align: 'right' });
    pdfDoc.text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})`, 400, 96, { align: 'right' });

    // Divider line
    pdfDoc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 130).lineTo(545, 130).stroke();

    // Shipping Details
    const shipping = order.shippingAddress;
    pdfDoc.fontSize(11).fillColor('#111827').text('Ship To:', 50, 150);
    pdfDoc.fontSize(9).fillColor('#4b5563');
    pdfDoc.text(shipping.name || 'Customer Name', 50, 168);
    pdfDoc.text(shipping.street || '', 50, 181);
    pdfDoc.text(`${shipping.city || ''}, ${shipping.state || ''} - ${shipping.zipCode || ''}`, 50, 194);
    pdfDoc.text(shipping.country || 'India', 50, 207);
    pdfDoc.text(`Phone: ${shipping.phone || ''}`, 50, 220);

    // Table Headers
    const tableTop = 260;
    pdfDoc.fontSize(10).fillColor('#111827');
    pdfDoc.text('Product Description', 50, tableTop);
    pdfDoc.text('Price', 280, tableTop, { width: 70, align: 'right' });
    pdfDoc.text('Qty', 370, tableTop, { width: 40, align: 'right' });
    pdfDoc.text('Total', 465, tableTop, { width: 80, align: 'right' });

    pdfDoc.strokeColor('#d1d5db').lineWidth(1).moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).stroke();

    // Table Rows
    let y = tableTop + 28;
    order.items.forEach((item) => {
      pdfDoc.fontSize(9).fillColor('#4b5563');
      pdfDoc.text(item.title || `Product #${item.productId}`, 50, y, { width: 220, height: 15, ellipsis: true });
      pdfDoc.text(`₹${item.price.toFixed(2)}`, 280, y, { width: 70, align: 'right' });
      pdfDoc.text(item.quantity.toString(), 370, y, { width: 40, align: 'right' });
      pdfDoc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 465, y, { width: 80, align: 'right' });
      y += 22;
    });

    pdfDoc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    y += 15;

    // Pricing Summary
    const summaryX = 350;
    pdfDoc.fontSize(9).fillColor('#4b5563');

    pdfDoc.text('Subtotal:', summaryX, y, { width: 100, align: 'right' });
    pdfDoc.fillColor('#111827').text(`₹${(order.totals?.subtotal || 0).toFixed(2)}`, 465, y, { width: 80, align: 'right' });
    y += 16;

    if (order.totals?.discount > 0) {
      pdfDoc.fillColor('#4b5563').text('Discount:', summaryX, y, { width: 100, align: 'right' });
      pdfDoc.fillColor('#ef4444').text(`-₹${(order.totals.discount).toFixed(2)}`, 465, y, { width: 80, align: 'right' });
      y += 16;
    }

    if (order.totals?.shipping > 0) {
      pdfDoc.fillColor('#4b5563').text('Shipping:', summaryX, y, { width: 100, align: 'right' });
      pdfDoc.fillColor('#111827').text(`₹${(order.totals.shipping).toFixed(2)}`, 465, y, { width: 80, align: 'right' });
      y += 16;
    }

    pdfDoc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(summaryX, y).lineTo(545, y).stroke();
    y += 8;

    pdfDoc.fontSize(11).fillColor('#111827');
    pdfDoc.text('Total:', summaryX, y, { width: 100, align: 'right' });
    pdfDoc.text(`₹${(order.totals?.total || 0).toFixed(2)}`, 465, y, { width: 80, align: 'right' });

    // Footer
    pdfDoc.fontSize(8).fillColor('#9ca3af').text('Thank you for shopping at GLASS! Have a green day!', 50, 750, { align: 'center', width: 495 });
  };

  if (writeStream) {
    doc.pipe(writeStream);
    buildPDF(doc);
    doc.end();
    return null;
  } else {
    return new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', err => reject(err));
      buildPDF(doc);
      doc.end();
    });
  }
};

module.exports = { generateInvoicePDF };
