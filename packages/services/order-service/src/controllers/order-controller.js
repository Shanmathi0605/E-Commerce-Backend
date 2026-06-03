const Order = require('../models/order');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');
const { generateInvoicePDF } = require('../utils/invoice-generator');
const {
  orderCreatedPublisher,
  orderCancelledPublisher,
  orderShippedPublisher,
  orderDeliveredPublisher
} = require('../events/publishers');

// Create a new Order (Checkout)
const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, discountAmount } = req.body;
  const userId = req.currentUser.id;

  if (!items || items.length === 0) {
    throw new BadRequestError('Cannot place order with empty cart');
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = Number(discountAmount) || 0;
  const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100; // 18% tax
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100, else $15
  const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

  const order = new Order({
    userId,
    items,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending', // Starts pending
    orderStatus: 'pending',
    totals: {
      subtotal,
      tax,
      shipping,
      discount,
      total
    },
    couponCode: couponCode || ''
  });

  await order.save();

  // Publish ORDER_CREATED to Kafka (triggers inventory reservation and payment processing)
  await orderCreatedPublisher.publish({
    id: order._id,
    userId: order.userId,
    items: order.items,
    totals: order.totals,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress
  });

  res.status(201).send(order);
};

// Retrieve single order details
const getOrder = async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError();
  }

  // Validate owner or Admin
  if (order.userId !== req.currentUser.id && req.currentUser.role !== 'admin') {
    throw new BadRequestError('Unauthorized to view this order');
  }

  res.status(200).send(order);
};

// Retrieve order history for current customer
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.currentUser.id }).sort({ createdAt: -1 });
  res.status(200).send(orders);
};

// Retrieve all orders (Admin monitoring / Vendors)
const getAllOrders = async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 });
  res.status(200).send(orders);
};

// Cancel Order
const cancelOrder = async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError();
  }

  if (order.userId !== req.currentUser.id && req.currentUser.role !== 'admin') {
    throw new BadRequestError('Unauthorized to cancel this order');
  }

  if (['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
    throw new BadRequestError('Cannot cancel order. Already shipped or delivered.');
  }

  order.orderStatus = 'cancelled';
  order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;
  await order.save();

  // Publish ORDER_CANCELLED to release reserved stock
  await orderCancelledPublisher.publish({
    id: order._id,
    items: order.items,
    refundAmount: order.paymentStatus === 'refunded' ? order.totals.total : 0,
    userId: order.userId
  });

  res.status(200).send(order);
};

// Update order / shipping status (Vendor/Admin)
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Invalid order status');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError();
  }

  order.orderStatus = status;

  if (status === 'shipped') {
    order.trackingNumber = 'TRK-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    await orderShippedPublisher.publish({
      id: order._id,
      trackingNumber: order.trackingNumber,
      userId: order.userId
    });
  }

  if (status === 'delivered') {
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }
    await orderDeliveredPublisher.publish({
      id: order._id,
      userId: order.userId,
      items: order.items
    });
  }

  await order.save();
  res.status(200).send(order);
};

// Download PDF Invoice
const downloadInvoice = async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError();
  }

  if (order.userId !== req.currentUser.id && req.currentUser.role !== 'admin') {
    throw new BadRequestError('Unauthorized');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

  // Direct generation and stream output
  generateInvoicePDF(order, res);
};

module.exports = {
  createOrder,
  getOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
  downloadInvoice
};
