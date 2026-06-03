import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { clearCredentials } from '../redux/slices/authSlice';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from recommendations service
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`/api/recommendations/suggestions?q=${search}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error('Failed to load search suggestions', err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    navigate(`/search?q=${search}`);
  };

  const handleSuggestionClick = (val) => {
    setSearch(val);
    setShowDropdown(false);
    navigate(`/search?q=${val}`);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout request failed');
    }
    dispatch(clearCredentials());
    navigate('/login');
  };

  const getActiveStyle = (path) => {
    return location.pathname === path ? `${styles.link} ${styles.linkActive}` : styles.link;
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        MARKETPLACE
      </Link>

      <div className={styles.searchContainer} ref={dropdownRef}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products, brands, stores..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>

        {showDropdown && suggestions.length > 0 && (
          <div className={styles.suggestionsDropdown}>
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                className={styles.suggestionItem}
                onClick={() => handleSuggestionClick(item)}
              >
                🔍 {item}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.navLinks}>
        <Link to="/" className={getActiveStyle('/')}>
          Shop
        </Link>

        {isAuthenticated ? (
          <>
            {user?.role === 'customer' && (
              <>
                <Link to="/wishlist" className={getActiveStyle('/wishlist')}>
                  Wishlist
                </Link>
                <Link to="/cart" className={getActiveStyle('/cart')}>
                  Cart
                </Link>
                <Link to="/profile" className={getActiveStyle('/profile')}>
                  Profile
                </Link>
              </>
            )}

            {user?.role === 'vendor' && (
              <Link to="/vendor" className={getActiveStyle('/vendor')}>
                Seller Panel
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link to="/admin" className={getActiveStyle('/admin')}>
                Admin Panel
              </Link>
            )}

            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.authButton}>
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
