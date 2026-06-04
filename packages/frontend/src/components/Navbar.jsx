import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { clearCredentials } from '../redux/slices/authSlice';
import styles from './Navbar.module.css';
import {
  FiSearch,
  FiUser,
  FiShoppingCart,
  FiHeart,
  FiLogOut
} from 'react-icons/fi';

const Navbar = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Fetch cart + wishlist counts
  useEffect(() => {
    const fetchNavData = async () => {
      if (!isAuthenticated) {
        setCartItemsCount(0);
        setCartSubtotal(0);
        setWishlistCount(0);
        return;
      }
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Cart data
        const cartRes = await axios.get('/api/cart', config);
        const activeItems = cartRes.data?.items?.filter(item => !item.savedForLater) || [];
        setCartItemsCount(activeItems.reduce((sum, item) => sum + item.quantity, 0));
        setCartSubtotal(activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0));

        // Wishlist count
        const wishRes = await axios.get('/api/wishlist', config);
        setWishlistCount(wishRes.data?.items?.length || 0);

      } catch (err) {
        console.error('Navbar fetch failed', err);
      }
    };

    fetchNavData();
  }, [isAuthenticated, token, location.pathname]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed');
    }
    dispatch(clearCredentials());
    navigate('/login');
  };

  const getActiveStyle = (path) =>
    location.pathname === path ? `${styles.link} ${styles.linkActive}` : styles.link;

  return (
    <header className={styles.headerWrapper}>
      {/* Top Announcement Bar */}
      <div className={styles.topUtilityBar}>
        <div className={styles.topUtilityLeft}>
          <span>🌿 WELCOME TO GLASS PLANT &amp; NURSERY STORE!</span>
        </div>
        <div className={styles.topUtilityRight}>
          <Link to="/blog" className={styles.topLink} style={{ textDecoration: 'none' }}>Blog</Link>
          <span className={styles.divider}>|</span>
          <Link to="/faq" className={styles.topLink} style={{ textDecoration: 'none' }}>FAQ</Link>
          <span className={styles.divider}>|</span>
          <span className={styles.topLink}>Free Shipping on Orders ₹500+</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={styles.navbar}>
        <Link to="/" className={styles.logo}>GLASS</Link>

        {/* Nav Links */}
        <div className={styles.navMenu}>
          <Link to="/" className={getActiveStyle('/')}>Home</Link>
          <Link to="/search" className={getActiveStyle('/search')}>Shop</Link>
          <Link to="/plant-hub" className={getActiveStyle('/plant-hub')}>Care Hub</Link>
          <Link to="/search?category=indoor-plants" className={styles.link}>Indoor Plants</Link>
          <Link to="/search?category=succulents" className={styles.link}>Succulents</Link>
        </div>

        {/* Right Action Icons */}
        <div className={styles.rightActions}>

          {/* Search */}
          <button
            className={styles.iconBtn}
            onClick={() => navigate('/search')}
            title="Search Plants"
          >
            <FiSearch size={20} />
          </button>

          {/* Wishlist */}
          <button
            className={styles.iconBtn}
            onClick={() => navigate(isAuthenticated ? '/wishlist' : '/login')}
            title="My Wishlist"
            style={{ position: 'relative' }}
          >
            <FiHeart size={20} />
            {isAuthenticated && wishlistCount > 0 && (
              <span className={styles.iconBadge}>{wishlistCount}</span>
            )}
          </button>

          {/* Profile */}
          <button
            className={styles.iconBtn}
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            title={isAuthenticated ? 'My Profile' : 'Login'}
          >
            <FiUser size={20} />
          </button>

          {/* Cart Widget */}
          <div className={styles.cartWidget} onClick={() => navigate('/cart')} title="View Cart">
            <div className={styles.cartIconWrapper}>
              <FiShoppingCart size={20} className={styles.cartIcon} />
              <span className={styles.cartBadge}>{cartItemsCount}</span>
            </div>
            <span className={styles.cartPrice}>₹{cartSubtotal.toFixed(2)}</span>
          </div>

          {/* Logout */}
          {isAuthenticated && (
            <button onClick={handleLogout} className={styles.navLogoutBtn} title="Logout">
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
