const Review = require('../models/review');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');
const { productUpdatedPublisher } = require('../events/publishers');

// Helper to recalculate and sync product reviews stats
const syncProductStats = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: '$productId',
        numReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    const roundedAvg = Math.round(stats[0].averageRating * 10) / 10;
    await productUpdatedPublisher.publish({
      id: productId,
      averageRating: roundedAvg,
      numReviews: stats[0].numReviews
    });
  } else {
    // If all reviews deleted, reset
    await productUpdatedPublisher.publish({
      id: productId,
      averageRating: 0,
      numReviews: 0
    });
  }
};

// Create a review
const createReview = async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.currentUser.id;
  const email = req.currentUser.email;

  const existingReview = await Review.findOne({ productId, userId });
  if (existingReview) {
    throw new BadRequestError('You have already reviewed this product');
  }

  const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  const review = new Review({
    productId,
    userId,
    email,
    rating: Number(rating),
    comment,
    images
  });

  await review.save();

  // Recalculate stats and broadcast
  await syncProductStats(productId);

  res.status(201).send(review);
};

// Update review
const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.currentUser.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError();
  }

  if (review.userId !== userId) {
    throw new BadRequestError('Unauthorized to edit this review');
  }

  if (rating) review.rating = Number(rating);
  if (comment) review.comment = comment;

  if (req.files && req.files.length > 0) {
    review.images = req.files.map(file => `/uploads/${file.filename}`);
  }

  await review.save();

  // Recalculate stats and broadcast
  await syncProductStats(review.productId);

  res.status(200).send(review);
};

// Delete review
const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.currentUser.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError();
  }

  if (review.userId !== userId && req.currentUser.role !== 'admin') {
    throw new BadRequestError('Unauthorized to delete this review');
  }

  const productId = review.productId;
  await Review.findByIdAndDelete(reviewId);

  // Recalculate stats and broadcast
  await syncProductStats(productId);

  res.status(200).send({ message: 'Review deleted successfully' });
};

// Retrieve reviews for a single product
const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
  res.status(200).send(reviews);
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews
};
