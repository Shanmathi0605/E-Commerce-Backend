import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from './Search.module.css';

const Search = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query URL params
  const searchParams = new URLSearchParams(location.search);
  const urlQuery = searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Sync category state from URL changes
  useEffect(() => {
    if (urlCategory && categories.length > 0) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(urlCategory);
      if (!isObjectId) {
        const matched = categories.find(
          (c) => c.slug === urlCategory.toLowerCase() || c.name.toLowerCase() === urlCategory.toLowerCase()
        );
        if (matched) {
          setSelectedCategory(matched.id || matched._id);
          return;
        }
      }
    }
    setSelectedCategory(urlCategory);
  }, [urlCategory, categories]);

  // Load categories list
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get('/api/products/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch filtered products
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (urlQuery) params.append('q', urlQuery);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedBrand) params.append('brand', selectedBrand);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (selectedRating) params.append('rating', selectedRating);
        if (sortBy) params.append('sort', sortBy);

        const res = await axios.get(`/api/products/search?${params.toString()}`);
        setProducts(res.data);

        // Log search activity to recommendation service
        if (isAuthenticated && urlQuery) {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          await axios.post('/api/recommendations/activity', {
            type: 'search',
            value: urlQuery
          }, config);
        }

      } catch (err) {
        console.error('Search query failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [urlQuery, selectedCategory, selectedBrand, minPrice, maxPrice, selectedRating, sortBy, isAuthenticated, token]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
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

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating('');
    setSortBy('newest');
    navigate('/search');
  };

  return (
    <div className={styles.container}>
      {/* Sidebar Filter Panel */}
      <aside className={styles.sidebar}>
        <div className={styles.filterGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className={styles.filterTitle}>Filters</h4>
            <button style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }} onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
        </div>

        {/* Categories Checkbox */}
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>Category</h4>
          <div className={styles.filterList}>
            {categories.map((cat) => (
              <label key={cat.id || cat._id} className={styles.filterItem}>
                <input
                  type="radio"
                  name="category_filter"
                  checked={selectedCategory === (cat.id || cat._id)}
                  onChange={() => setSelectedCategory(cat.id || cat._id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        {/* Brand Checkbox */}
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>Popular Brands</h4>
          <div className={styles.filterList}>
            {['GreenLife', 'Planto', 'Succulents Co.', 'Bonsai Masters'].map((b) => (
              <label key={b} className={styles.filterItem}>
                <input
                  type="radio"
                  name="brand_filter"
                  checked={selectedBrand === b}
                  onChange={() => setSelectedBrand(b)}
                />
                {b}
              </label>
            ))}
          </div>
        </div>

        {/* Price Ranges */}
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>Price Range (₹)</h4>
          <div className={styles.priceRangeInputs}>
            <input
              type="number"
              placeholder="Min"
              className={styles.priceInput}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              className={styles.priceInput}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Star Rating Filters */}
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>Customer Rating</h4>
          <div className={styles.filterList}>
            {[4, 3, 2, 1].map((stars) => (
              <label key={stars} className={styles.filterItem}>
                <input
                  type="radio"
                  name="rating_filter"
                  checked={selectedRating === stars.toString()}
                  onChange={() => setSelectedRating(stars.toString())}
                />
                {stars}★ & above
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Search results Display Area */}
      <section className={styles.resultsArea}>
        <div className={styles.topBar}>
          <span className={styles.resultsCount}>
            {loading ? 'Searching...' : `${products.length} products found ${urlQuery ? `for "${urlQuery}"` : ''}`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort By:</span>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="priceLowToHigh">Price: Low to High</option>
              <option value="priceHighToLow">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Querying index catalogs...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No products match your query or filters. Check spelling or try resetting options.
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((prod) => (
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
                    <span className={styles.price}>₹{prod.price.toFixed(2)}</span>
                    <button className={styles.addToCartBtn} onClick={(e) => handleAddToCart(e, prod)}>
                      + Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Search;
