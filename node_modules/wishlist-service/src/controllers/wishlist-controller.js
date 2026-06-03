const Wishlist = require('../models/wishlist');
const axios = require('axios');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:8006/api/cart';

// Fetch user wishlist
const getWishlist = async (req, res) => {
  const userId = req.currentUser.id;
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = new Wishlist({ userId, products: [] });
    await wishlist.save();
  }
  res.status(200).send(wishlist);
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
  const userId = req.currentUser.id;
  const { productId, title, price, image } = req.body;

  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = new Wishlist({ userId, products: [] });
  }

  const exists = wishlist.products.some(p => p.productId === productId);
  if (!exists) {
    wishlist.products.push({ productId, title, price, image });
    await wishlist.save();
  }

  res.status(200).send(wishlist);
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  const userId = req.currentUser.id;
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    throw new NotFoundError();
  }

  wishlist.products = wishlist.products.filter(p => p.productId !== productId);
  await wishlist.save();

  res.status(200).send(wishlist);
};

// Move wishlist item to active shopping cart (Inter-service REST call)
const moveToCart = async (req, res) => {
  const userId = req.currentUser.id;
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    throw new NotFoundError();
  }

  const product = wishlist.products.find(p => p.productId === productId);
  if (!product) {
    throw new BadRequestError('Product not found in wishlist');
  }

  try {
    const authHeader = req.headers.authorization;
    
    // Execute POST request to Cart Service passing current authorization token
    await axios.post(
      CART_SERVICE_URL,
      {
        productId: product.productId,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1
      },
      {
        headers: {
          Authorization: authHeader
        }
      }
    );

    // If transfer succeeds, remove from wishlist
    wishlist.products = wishlist.products.filter(p => p.productId !== productId);
    await wishlist.save();

    res.status(200).send({
      message: 'Item moved to cart successfully',
      wishlist
    });

  } catch (err) {
    console.error('[Wishlist Service] Direct Cart Service invocation failed:', err.message);
    throw new BadRequestError('Failed to transfer wishlist item to shopping cart');
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
};
