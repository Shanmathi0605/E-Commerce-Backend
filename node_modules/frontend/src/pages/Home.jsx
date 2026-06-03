import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from './Home.module.css';

const Home = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);

        // 1. Fetch categories
        const catRes = await axios.get('/api/products/categories');
        setCategories(catRes.data);

        // 2. Fetch products
        const prodRes = await axios.get('/api/products');
        setProducts(prodRes.data);

        // 3. Fetch recommendations if logged in
        if (isAuthenticated) {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const recRes = await axios.get('/api/recommendations', config);
          setRecommendations(recRes.data);
        } else {
          // Fallback guest popular list
          const activeOnly = prodRes.data.filter(p => p.status === 'active').slice(0, 4);
          setRecommendations(activeOnly);
        }

      } catch (err) {
        console.error('Failed to load home page catalogs', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [isAuthenticated, token]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation(); // prevent card navigation click
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/cart', {
        productId: product.id || product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: 1
      }, config);
      alert(`${product.title} added to cart!`);
    } catch (err) {
      alert('Failed to add item to cart');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading marketplace catalogs...</div>;
  }

  const activeProducts = products.filter(p => p.status === 'active');

  return (
    <div className={styles.container}>
      {/* Hero Showcase banner */}
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Upgrade Your Shopping Experience</h1>
        <p className={styles.heroSubtitle}>
          Explore high-quality products across electronic, fashion, and lifestyle domains. Direct from verified vendors at wholesale pricing structures.
        </p>
        <button className={styles.heroBtn} onClick={() => navigate('/search')}>
          Shop Campaigns
        </button>
      </header>

      {/* Categories Bar */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Browse Categories</h3>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => (
            <div
              key={cat.id || cat._id}
              className={styles.categoryCard}
              onClick={() => navigate(`/search?category=${cat.id || cat._id}`)}
            >
              📁 {cat.name}
            </div>
          ))}
        </div>
      </section>

      {/* AI Recommendations Panel */}
      {recommendations.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            ✨ {isAuthenticated ? 'Recommended for You (AI)' : 'Trending Products'}
          </h3>
          <div className={styles.productsGrid}>
            {recommendations.map((prod) => (
              <div
                key={prod.id || prod._id}
                className={styles.productCard}
                onClick={() => navigate(`/product/${prod.id || prod._id}`)}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={prod.images?.[0] || 'https://via.placeholder.com/200'}
                    alt={prod.title}
                    className={styles.productImage}
                  />
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.brand}>{prod.brand}</span>
                  <h4 className={styles.productTitle}>{prod.title}</h4>
                  <div className={styles.rating}>★ {prod.averageRating?.toFixed(1) || '0.0'} ({prod.numReviews})</div>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>${prod.price.toFixed(2)}</span>
                    <button className={styles.addToCartBtn} onClick={(e) => handleAddToCart(e, prod)}>
                      + Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Catalog Grid */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Featured Products</h3>
        <div className={styles.productsGrid}>
          {activeProducts.map((prod) => (
            <div
              key={prod.id || prod._id}
              className={styles.productCard}
              onClick={() => navigate(`/product/${prod.id || prod._id}`)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={prod.images?.[0] || 'https://via.placeholder.com/200'}
                  alt={prod.title}
                  className={styles.productImage}
                />
              </div>
              <div className={styles.productInfo}>
                <span className={styles.brand}>{prod.brand}</span>
                <h4 className={styles.productTitle}>{prod.title}</h4>
                <div className={styles.rating}>★ {prod.averageRating?.toFixed(1) || '0.0'} ({prod.numReviews})</div>
                <div className={styles.priceRow}>
                  <span className={styles.price}>${prod.price.toFixed(2)}</span>
                  <button className={styles.addToCartBtn} onClick={(e) => handleAddToCart(e, prod)}>
                    + Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
