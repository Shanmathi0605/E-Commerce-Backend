const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { errorHandler, NotFoundError } = require('@ecommerce/common');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // React dev server port
  credentials: true
}));
app.use(cookieParser());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { errors: [{ message: 'Too many requests, please try again later.' }] }
});
app.use('/api', limiter);

// Port mapping for microservices
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:8002',
  vendor: process.env.VENDOR_SERVICE_URL || 'http://localhost:8003',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8004',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8005',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:8006',
  wishlist: process.env.WISHLIST_SERVICE_URL || 'http://localhost:8007',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:8008',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8009',
  review: process.env.REVIEW_SERVICE_URL || 'http://localhost:8010',
  coupon: process.env.COUPON_SERVICE_URL || 'http://localhost:8011',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8012',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8013',
  recommendation: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8014',
};

// Routing proxy configuration
const serviceProxy = (url, prefix) => proxy(url, {
  parseReqBody: false,
  proxyReqPathResolver: (req) => {
    return prefix + req.url;
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    return proxyReqOpts;
  },
  userResHeaderDecorator: (headers, userReq, userRes, proxyReq, proxyRes) => {
    return headers;
  }
});

// Routes delegation
app.use('/api/auth', serviceProxy(SERVICES.auth, '/api/auth'));
app.use('/api/users', serviceProxy(SERVICES.user, '/api/users'));
app.use('/api/vendors', serviceProxy(SERVICES.vendor, '/api/vendors'));
app.use('/api/products', serviceProxy(SERVICES.product, '/api/products'));
app.use('/api/inventory', serviceProxy(SERVICES.inventory, '/api/inventory'));
app.use('/api/cart', serviceProxy(SERVICES.cart, '/api/cart'));
app.use('/api/wishlist', serviceProxy(SERVICES.wishlist, '/api/wishlist'));
app.use('/api/orders', serviceProxy(SERVICES.order, '/api/orders'));
app.use('/api/payments', serviceProxy(SERVICES.payment, '/api/payments'));
app.use('/api/reviews', serviceProxy(SERVICES.review, '/api/reviews'));
app.use('/api/coupons', serviceProxy(SERVICES.coupon, '/api/coupons'));
app.use('/api/notifications', serviceProxy(SERVICES.notification, '/api/notifications'));
app.use('/api/analytics', serviceProxy(SERVICES.analytics, '/api/analytics'));
app.use('/api/recommendations', serviceProxy(SERVICES.recommendation, '/api/recommendations'));

// Catch-all route handler for unknown services
app.all('*', () => {
  throw new NotFoundError();
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`[API Gateway] Server running on port ${PORT}`);
});
