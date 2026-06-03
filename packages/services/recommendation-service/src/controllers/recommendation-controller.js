const UserActivity = require('../models/user-activity');
const axios = require('axios');
const { BadRequestError } = require('@ecommerce/common');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8004/api/products';

// Log user activity (browse view, search queries, purchases)
const logActivity = async (req, res) => {
  const { type, value } = req.body;
  const userId = req.currentUser.id;

  if (!['view', 'search', 'purchase'].includes(type) || !value) {
    throw new BadRequestError('Invalid activity type or value');
  }

  let activity = await UserActivity.findOne({ userId });
  if (!activity) {
    activity = new UserActivity({ userId });
  }

  if (type === 'view') {
    // Avoid duplicates, keep last 10 viewed
    activity.viewedProductIds = [value, ...activity.viewedProductIds.filter(id => id !== value)].slice(0, 10);
  } else if (type === 'search') {
    activity.searchQueries = [value, ...activity.searchQueries.filter(q => q !== value)].slice(0, 10);
  } else if (type === 'purchase') {
    activity.purchaseProductIds = [value, ...activity.purchaseProductIds.filter(id => id !== value)].slice(0, 10);
  }

  await activity.save();
  res.status(200).send(activity);
};

// Calculate and retrieve product recommendations
const getRecommendations = async (req, res) => {
  const userId = req.currentUser.id;

  try {
    const activity = await UserActivity.findOne({ userId });
    
    // Call product service to retrieve items catalog
    const productResponse = await axios.get(PRODUCT_SERVICE_URL);
    const allProducts = productResponse.data;

    if (!activity || (activity.viewedProductIds.length === 0 && activity.purchaseProductIds.length === 0)) {
      // Return general active products as a fallback recommendation
      const activeProducts = allProducts.filter(p => p.status === 'active').slice(0, 6);
      return res.status(200).send(activeProducts);
    }

    // Recommendation logic: recommend products in the same category as recently viewed/purchased items
    const seedProductIds = [...activity.purchaseProductIds, ...activity.viewedProductIds];
    
    // Find category seeds
    const seedCategories = [];
    allProducts.forEach(prod => {
      if (seedProductIds.includes(prod.id || prod._id.toString())) {
        seedCategories.push(prod.category.id || prod.category._id || prod.category);
      }
    });

    // Filter matching products
    const recommendations = allProducts.filter(p => {
      const isSeed = seedProductIds.includes(p.id || p._id.toString());
      const categoryId = p.category.id || p.category._id || p.category;
      const categoryMatch = seedCategories.includes(categoryId);
      return !isSeed && categoryMatch && p.status === 'active';
    }).slice(0, 6);

    // If matches are sparse, append popular active items
    if (recommendations.length < 4) {
      const extra = allProducts.filter(p => {
        const isSeed = seedProductIds.includes(p.id || p._id.toString());
        const isRecommended = recommendations.some(r => r.id === p.id);
        return !isSeed && !isRecommended && p.status === 'active';
      });
      recommendations.push(...extra.slice(0, 6 - recommendations.length));
    }

    res.status(200).send(recommendations);

  } catch (err) {
    console.error('[Recommendation Engine] Failed to compile recommendation lists:', err.message);
    res.status(200).send([]); // Return empty list gracefully
  }
};

// Autocomplete suggestions queries
const getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(200).send([]);
  }

  const prefix = q.toLowerCase();

  // Simple static list of common high-volume search queries for suggestions fallback
  const keywords = [
    'headphones', 'wireless earbuds', 'running shoes', 'smart watch', 'fitness tracker',
    'leather wallet', 'waterproof backpack', 'casual cotton t-shirt', 'denim jeans',
    'mechanic keyboard', 'gaming mouse', 'laptop stand', 'led desk lamp', 'coffee mug'
  ];

  const suggestions = keywords.filter(word => word.startsWith(prefix)).slice(0, 5);
  res.status(200).send(suggestions);
};

// AI Support Chatbot replies
const chatbotSupport = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    throw new BadRequestError('Message query is required');
  }

  const query = message.toLowerCase();
  let reply = '';

  if (query.includes('order') || query.includes('track') || query.includes('delivery')) {
    reply = "You can track your order status in real-time in the 'My Orders' section of your account profile. Once shipped, you will see a unique tracking number there.";
  } else if (query.includes('cancel') || query.includes('refund') || query.includes('return')) {
    reply = "To cancel an order, navigate to your order history and click 'Cancel Order'. If payment was made, your refund will be processed and credited back to your original source (or Wallet) within 24 hours.";
  } else if (query.includes('coupon') || query.includes('discount') || query.includes('offer')) {
    reply = "Check out our latest discount codes! Try code 'WELCOME20' at checkout to receive an instant 20% off your purchase.";
  } else if (query.includes('seller') || query.includes('vendor') || query.includes('sell')) {
    reply = "If you want to sell products on our platform, navigate to the 'Become a Seller' portal, fill out your store details, upload your KYC files, and submit for admin approval.";
  } else if (query.includes('wallet') || query.includes('balance') || query.includes('cashback')) {
    reply = "You can review your wallet balance, apply cashbacks, top-up funds, or review logs inside the 'My Wallet' section of your profile.";
  } else {
    reply = "Hello! I am your AI Marketplace assistant. I can help you track orders, manage refunds, locate coupons, or start seller registrations. What can I do for you today?";
  }

  res.status(200).send({ response: reply });
};

module.exports = {
  logActivity,
  getRecommendations,
  getSearchSuggestions,
  chatbotSupport
};
