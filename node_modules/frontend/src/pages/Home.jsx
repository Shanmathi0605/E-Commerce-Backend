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
  const [loading, setLoading] = useState(true);

  // Tabs filtering state
  const [activeTab, setActiveTab] = useState('All');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Top Selling\nPlant.s",
      subtitle: "Crafting Unique Botanicals Session for Cozy Spaces & Indoor Decoration setups.",
      image: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=600",
      link: "/search?category=indoor-plants"
    },
    {
      title: "Breathe Fresh\nIndoor Air",
      subtitle: "Beautiful air-purifying desk plants that require minimal watering and light.",
      image: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=600",
      link: "/search?category=desk-plants"
    },
    {
      title: "The Art of\nBonsai",
      subtitle: "Exquisite classic Japanese Bonsai Juniper trees. Bring zen and harmony to your office.",
      image: "https://images.unsplash.com/photo-1512428813824-f111357b1c30?auto=format&fit=crop&q=80&w=600",
      link: "/search?category=bonsai"
    }
  ];

  // Auto-play carousel slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
    return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-muted)' }}>Loading green store catalogs...</div>;
  }

  const activeProducts = products.filter(p => p.status === 'active');

  // Filter products by tab
  const getFilteredProducts = () => {
    if (activeTab === 'All') return activeProducts.slice(0, 6);
    
    // Find category ID matching tab name
    const matchedCategory = categories.find(c => c.name.toLowerCase() === activeTab.toLowerCase());
    if (!matchedCategory) return [];

    const matchId = matchedCategory.id || matchedCategory._id;
    return activeProducts.filter(p => {
      const catId = p.category?._id || p.category?.id || p.category;
      return catId?.toString() === matchId?.toString();
    }).slice(0, 6);
  };

  // Top Selling list
  const getTopSellingProducts = () => {
    return activeProducts.slice(0, 6);
  };

  return (
    <div className={styles.container}>
      {/* 1. Full-Width Carousel Showcase Section */}
      <section className={styles.heroSection}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`${styles.slide} ${index === currentSlide ? styles.slideActive : ''}`}
          >
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                {slide.title.split('\n').map((t, idx) => (
                  <React.Fragment key={idx}>
                    {t}
                    <br />
                  </React.Fragment>
                ))}
              </h1>
              <p className={styles.heroSubtitle}>
                {slide.subtitle}
              </p>
              <button className={styles.heroBtn} onClick={() => navigate(slide.link)}>
                Discover More ›
              </button>
              
              <div className={styles.socialRow}>
                <span>Follow Us: </span>
                <span className={styles.socialIcon}>f</span>
                <span className={styles.socialIcon}>★</span>
                <span className={styles.socialIcon}>t</span>
              </div>
            </div>

            <div className={styles.heroImageWrapper}>
              <img 
                src={slide.image} 
                alt="Showcase Plant" 
                className={styles.heroPlantImage}
              />
            </div>
          </div>
        ))}

        {/* Carousel controls */}
        <button 
          className={styles.carouselArrowLeft} 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        >
          ‹
        </button>
        <button 
          className={styles.carouselArrowRight} 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        >
          ›
        </button>

        {/* Dot Indicators */}
        <div className={styles.carouselDots}>
          {slides.map((_, index) => (
            <span
              key={index}
              className={`${styles.carouselDot} ${index === currentSlide ? styles.carouselDotActive : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>
      </section>

      {/* Centered Content Container */}
      <div className={styles.contentContainer}>
        {/* 2. Indoor Plants Category Grid Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderCentered}>
            <span className={styles.sectionBadge}>Catalog</span>
            <h2 className={styles.sectionTitleCentered}>Indoor Plants</h2>
            <p className={styles.sectionSubtitleCentered}>
              Discover various indoor plants designed to purify the air and elevate your cozy room aesthetics.
            </p>

            <div className={styles.tabFilters}>
              {['All', 'Indoor Plants', 'Desk Plants', 'Succulents', 'Bonsai'].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Grid */}
          <div className={styles.productsGrid}>
            {getFilteredProducts().map((prod) => (
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
                  <div className={styles.rating}>★ {prod.averageRating?.toFixed(1) || '5.0'}</div>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{prod.price.toFixed(2)}</span>
                    <button className={styles.addToCartCircularBtn} onClick={(e) => handleAddToCart(e, prod)}>
                      🛒
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Our Top Selling Scroll Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderCentered}>
            <h2 className={styles.sectionTitleCentered}>Our Top Selling</h2>
          </div>

          <div className={styles.productsGrid}>
            {getTopSellingProducts().map((prod) => (
              <div
                key={prod.id || prod._id}
                className={styles.productCardGlass}
                onClick={() => navigate(`/product/${prod.id || prod._id}`)}
              >
                <div className={styles.imageWrapperGlass}>
                  <img
                    src={prod.images?.[0] || 'https://via.placeholder.com/200'}
                    alt={prod.title}
                    className={styles.productImageGlass}
                  />
                </div>
                <div className={styles.productInfoGlass}>
                  <h4 className={styles.productTitleGlass}>{prod.title}</h4>
                  <p className={styles.productDescGlass}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <div className={styles.priceRowGlass}>
                    <span className={styles.priceGlass}>₹{prod.price.toFixed(2)}</span>
                    <button className={styles.addToCartCircularBtn} onClick={(e) => handleAddToCart(e, prod)}>
                      🛒
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Customer Review Section */}
        <section className={styles.section} style={{ marginBottom: '5rem' }}>
          <div className={styles.sectionHeaderCentered}>
            <h2 className={styles.sectionTitleCentered}>Customer Review</h2>
          </div>

          <div className={styles.reviewsGrid}>
            {[
              { name: 'Main Josi', rating: 5, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' },
              { name: 'Alina Thakur', rating: 5, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100' },
              { name: 'Max Makvana', rating: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' }
            ].map((rev, idx) => (
              <div key={idx} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <img src={rev.avatar} alt={rev.name} className={styles.reviewAvatar} />
                  <div className={styles.reviewMeta}>
                    <h4>{rev.name}</h4>
                    <span className={styles.reviewStars}>★ ★ ★ ★ ★</span>
                  </div>
                </div>
                <p className={styles.reviewText}>
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
