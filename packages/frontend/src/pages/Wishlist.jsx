import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FiHeart, FiShoppingCart, FiTrash2, FiArrowLeft } from 'react-icons/fi';

const Wishlist = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  const fetchWishlist = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/wishlist', config);
      setItems(res.data?.items || []);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWishlist(); }, [isAuthenticated, token]);

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/wishlist/${productId}`, config);
      setItems(prev => prev.filter(item => item.productId !== productId));
    } catch (err) {
      alert('Could not remove item. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/cart', {
        productId: item.productId,
        variantId: '',
        title: item.title,
        price: item.price,
        image: item.image,
        quantity: 1
      }, config);
      alert(`${item.title} added to cart!`);
    } catch (err) {
      alert('Could not add to cart.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem', fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.6rem' }}>Login to view your Wishlist</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Save plants you love and come back to them any time.</p>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '0.8rem 2rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem', fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💚</div>
        <p style={{ color: 'var(--text-muted)' }}>Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 0', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <FiHeart size={24} color="#ef4444" />
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>My Wishlist</h1>
          {items.length > 0 && (
            <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/search')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: '600', background: 'none', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <FiArrowLeft size={14} /> Continue Shopping
        </button>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
          padding: '5rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem', filter: 'grayscale(0.2)' }}>🌱</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.6rem' }}>Your Wishlist is Empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            You haven't saved any plants yet. Browse our collection and click the ♡ Heart button on any product to save it here!
          </p>
          <button
            onClick={() => navigate('/search')}
            style={{
              padding: '0.8rem 2rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            Explore Plants →
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {items.map((item) => (
            <div
              key={item.productId}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Remove button */}
              <button
                onClick={() => handleRemove(item.productId)}
                disabled={removing === item.productId}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(239, 68, 68, 0.85)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'background 0.2s',
                  backdropFilter: 'blur(4px)'
                }}
                title="Remove from wishlist"
              >
                {removing === item.productId ? '...' : <FiTrash2 size={14} />}
              </button>

              {/* Product image */}
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=400&auto=format&fit=crop'}
                  alt={item.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: '1.2rem' }}>
                <h3
                  style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.4rem', cursor: 'pointer', lineHeight: 1.3 }}
                  onClick={() => navigate(`/product/${item.productId}`)}
                >
                  {item.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>₹{item.price?.toFixed(2)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In Wishlist</span>
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <FiShoppingCart size={14} /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
