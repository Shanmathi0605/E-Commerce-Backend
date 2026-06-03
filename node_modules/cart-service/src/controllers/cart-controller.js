const Cart = require('../models/cart');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');
const { redisClient } = require('../config/redis');

// Get cart from cache, fallback to Mongo
const getCart = async (req, res) => {
  const userId = req.currentUser.id;

  try {
    const cached = await redisClient.get(`cart:${userId}`);
    if (cached) {
      console.log('[Redis] Serving cart from cache');
      return res.status(200).send(JSON.parse(cached));
    }
  } catch (err) {
    console.error('[Redis] Get cart cache error', err.message);
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
    await cart.save();
  }

  try {
    await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(cart));
  } catch (err) {
    console.error('[Redis] Set cart cache error', err.message);
  }

  res.status(200).send(cart);
};

// Add item to cart
const addToCart = async (req, res) => {
  const userId = req.currentUser.id;
  const { productId, variantId, title, price, quantity, image } = req.body;

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    item => item.productId === productId && item.variantId === (variantId || '')
  );

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += Number(quantity || 1);
  } else {
    cart.items.push({
      productId,
      variantId: variantId || '',
      title,
      price: Number(price),
      quantity: Number(quantity || 1),
      image: image || '',
      savedForLater: false
    });
  }

  await cart.save();

  // Update Redis cache
  try {
    await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(cart));
  } catch (err) {
    console.error('[Redis] Set cart cache error', err.message);
  }

  res.status(200).send(cart);
};

// Update item quantity
const updateCartItemQuantity = async (req, res) => {
  const userId = req.currentUser.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity < 1) {
    throw new BadRequestError('Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new NotFoundError();
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw new NotFoundError();
  }

  item.quantity = Number(quantity);
  await cart.save();

  try {
    await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(cart));
  } catch (err) {
    console.error('[Redis] Set cart cache error', err.message);
  }

  res.status(200).send(cart);
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  const userId = req.currentUser.id;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new NotFoundError();
  }

  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) {
    throw new NotFoundError();
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  try {
    await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(cart));
  } catch (err) {
    console.error('[Redis] Set cart cache error', err.message);
  }

  res.status(200).send(cart);
};

// Toggle Save For Later status
const toggleSaveForLater = async (req, res) => {
  const userId = req.currentUser.id;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new NotFoundError();
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw new NotFoundError();
  }

  item.savedForLater = !item.savedForLater;
  await cart.save();

  try {
    await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(cart));
  } catch (err) {
    console.error('[Redis] Set cart cache error', err.message);
  }

  res.status(200).send(cart);
};

// Clear active items in cart (leaves saved-for-later)
const clearCart = async (req, res) => {
  const userId = req.currentUser.id;

  const cart = await Cart.findOne({ userId });
  if (cart) {
    // Keep only saved for later items
    cart.items = cart.items.filter(item => item.savedForLater);
    await cart.save();

    try {
      await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(cart));
    } catch (err) {
      console.error('[Redis] Set cart cache error', err.message);
    }
  }

  res.status(200).send({ message: 'Cart cleared successfully', cart });
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  toggleSaveForLater,
  clearCart
};
