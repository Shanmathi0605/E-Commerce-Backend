const express = require('express');
const { currentUser, requireAuth, validateRequest } = require('@ecommerce/common');
const { body } = require('express-validator');
const {
  logActivity,
  getRecommendations,
  getSearchSuggestions,
  chatbotSupport
} = require('../controllers/recommendation-controller');

const router = express.Router();

// Autocomplete suggestions (Public / Unauthenticated ok for search bars)
router.get('/suggestions', getSearchSuggestions);

// Chatbot interactions (Public / Unauthenticated ok for guest inquiries)
router.post('/chatbot', [
  body('message').trim().notEmpty().withMessage('Message query is required')
], validateRequest, chatbotSupport);

// Authenticated recommendation lookups
router.use(currentUser);
router.use(requireAuth);

router.get('/', getRecommendations);

router.post('/activity', [
  body('type').isIn(['view', 'search', 'purchase']).withMessage('Invalid activity type'),
  body('value').trim().notEmpty().withMessage('Activity value is required')
], validateRequest, logActivity);

module.exports = router;
