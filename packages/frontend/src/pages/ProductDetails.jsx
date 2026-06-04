import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from './ProductDetails.module.css';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState([]);
  const [hoverRating, setHoverRating] = useState(0);

  // zoom preview mouse tracking
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    e.target.style.transformOrigin = `${x}% ${y}%`;
  };

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);

        // 1. Fetch Product specifications
        const detailsRes = await axios.get(`/api/products/details/${productId}`);
        const prod = detailsRes.data;
        setProduct(prod);
        setActiveImage(prod.images?.[0] || 'https://via.placeholder.com/400');
        
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
        }

        // 2. Log Browse view activity to recommendation-service
        if (isAuthenticated) {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          await axios.post('/api/recommendations/activity', {
            type: 'view',
            value: productId
          }, config);
        }

        // 3. Load product ratings & reviews
        const reviewRes = await axios.get(`/api/reviews/product/${productId}`);
        setReviews(reviewRes.data);

        // 4. Load related category items
        const catId = prod.category?.id || prod.category?._id || prod.category;
        const relatedRes = await axios.get(`/api/products?category=${catId}`);
        const relatedList = relatedRes.data.filter(p => (p.id || p._id) !== productId).slice(0, 4);
        setRelated(relatedList);

      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [productId, isAuthenticated, token]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/cart', {
        productId: product.id || product._id,
        variantId: selectedVariant?._id || '',
        title: product.title + (selectedVariant ? ` (${selectedVariant.size} / ${selectedVariant.color})` : ''),
        price: selectedVariant?.price || product.price,
        image: product.images?.[0] || '',
        quantity: 1
      }, config);
      alert('Product added to shopping cart!');
    } catch (err) {
      alert('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/wishlist', {
        productId: product.id || product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || ''
      }, config);
      alert('Added to wishlist!');
    } catch (err) {
      alert('Failed to save to wishlist');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('rating', rating);
    formData.append('comment', comment);
    
    for (let i = 0; i < reviewFiles.length; i++) {
      formData.append('images', reviewFiles[i]);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      const res = await axios.post('/api/reviews', formData, config);
      setReviews([res.data, ...reviews]);
      setComment('');
      setRating(5);
      setReviewFiles([]);
      alert('Review posted successfully!');
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading product metrics...</div>;
  }

  if (!product) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Product not found.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        {/* Gallery Section with Zoom */}
        <div className={styles.gallerySection}>
          <div className={styles.mainImageWrapper}>
            <img
              src={activeImage}
              alt={product.title}
              className={styles.mainImage}
              onMouseMove={handleMouseMove}
            />
          </div>
          <div className={styles.thumbnailsRow}>
            {product.images?.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="thumbnail"
                className={`${styles.thumbnail} ${activeImage === img ? styles.activeThumbnail : ''}`}
                onClick={() => setActiveImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Product Information specs */}
        <div className={styles.infoSection}>
          <span className={styles.brandName}>{product.brand}</span>
          <h2 className={styles.title}>{product.title}</h2>
          
          <div style={{ color: 'var(--color-gold)', fontSize: '1rem' }}>
            ★ {product.averageRating?.toFixed(1) || '0.0'} ({product.numReviews} customer reviews)
          </div>

          <div className={styles.price}>
            ₹{selectedVariant?.price || product.price.toFixed(2)}
          </div>

          <p className={styles.description}>{product.description}</p>

          {/* Product Variant selector matrix */}
          {product.variants && product.variants.length > 0 && (
            <div className={styles.variantsContainer}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Select Variant:</h4>
              <div className={styles.variantsRow}>
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    className={`${styles.variantBtn} ${selectedVariant?._id === v._id ? styles.activeVariantBtn : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.size && `Size: ${v.size}`} {v.color && `Color: ${v.color}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionRow}>
            <button className={styles.btnPrimary} onClick={handleAddToCart}>
              Add to Shopping Cart
            </button>
            <button className={styles.btnSecondary} onClick={handleAddToWishlist}>
              ♡ Save
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className={styles.reviewsSection}>
        {/* Write a Review Form */}
        <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
          <h3 className={styles.reviewFormTitle}>Write a Review</h3>

          <div className={styles.starRatingSelect}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`${styles.starOption} ${
                  (hoverRating || rating) >= star ? styles.activeStarOption : ''
                }`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            className={styles.reviewInput}
            required
            placeholder="Share your thoughts about this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attach Photos (Max 3):</label>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}
              onChange={(e) => setReviewFiles(e.target.files)}
            />
          </div>

          <button type="submit" className={styles.btnPrimary} style={{ padding: '0.6rem' }}>
            Submit Review
          </button>
        </form>

        {/* Reviews List */}
        <div className={styles.reviewsList}>
          <h3 className={styles.reviewFormTitle}>Customer Reviews ({reviews.length})</h3>

          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No reviews yet for this product. Be the first to share your experience!
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id || rev._id} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewEmail}>{rev.email}</span>
                  <span className={styles.reviewDate}>{new Date(rev.createdAt).toDateString()}</span>
                </div>
                <div style={{ color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                </div>
                <p className={styles.reviewText}>{rev.comment}</p>
                
                {rev.images && rev.images.length > 0 && (
                  <div className={styles.reviewImages}>
                    {rev.images.map((img, idx) => (
                      <img key={idx} src={img} alt="review" className={styles.reviewImage} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
