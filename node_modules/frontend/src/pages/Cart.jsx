import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from './Cart.module.css';

const Cart = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/cart', config);
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, token]);

  const handleUpdateQty = async (itemId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(`/api/cart/${itemId}`, { quantity: newQty }, config);
      setCart(res.data);
    } catch (err) {
      console.error('Qty update failed', err);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.delete(`/api/cart/${itemId}`, config);
      setCart(res.data);
    } catch (err) {
      console.error('Remove failed', err);
    }
  };

  const handleToggleSave = async (itemId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.patch(`/api/cart/${itemId}/save-for-later`, {}, config);
      setCart(res.data);
    } catch (err) {
      console.error('Save toggle failed', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h3>Please login to view your cart.</h3>
        <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline', marginTop: '1rem', display: 'inline-block' }}>
          Login here
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading shopping cart...</div>;
  }

  const activeItems = cart?.items?.filter(item => !item.savedForLater) || [];
  const savedItems = cart?.items?.filter(item => item.savedForLater) || [];

  const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% Tax
  const shipping = subtotal > 100 || activeItems.length === 0 ? 0 : 15;
  const total = subtotal + tax + shipping;

  return (
    <div className={styles.container}>
      {/* Items list */}
      <div className={styles.itemsSection}>
        <h2 className={styles.title}>Shopping Cart ({activeItems.length})</h2>

        {activeItems.length === 0 ? (
          <div style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>
            Your cart is empty. <Link to="/" style={{ color: 'var(--color-accent)' }}>Shop products</Link>
          </div>
        ) : (
          activeItems.map((item) => (
            <div key={item._id} className={styles.cartItem}>
              <img src={item.image || 'https://via.placeholder.com/90'} alt={item.title} className={styles.image} />
              <div className={styles.itemInfo}>
                <div>
                  <h4 className={styles.itemTitle}>{item.title}</h4>
                  <div className={styles.itemPrice}>${item.price.toFixed(2)}</div>
                </div>
                <div className={styles.actions}>
                  <div className={styles.qtyControl}>
                    <button className={styles.qtyBtn} onClick={() => handleUpdateQty(item._id, item.quantity, -1)}>-</button>
                    <span style={{ fontSize: '0.9rem' }}>{item.quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => handleUpdateQty(item._id, item.quantity, 1)}>+</button>
                  </div>
                  <div>
                    <button className={`${styles.textBtn} ${styles.saveBtn}`} onClick={() => handleToggleSave(item._id)}>
                      Save for Later
                    </button>
                    <button className={styles.textBtn} style={{ marginLeft: '1rem' }} onClick={() => handleRemove(item._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Saved For Later items */}
        {savedItems.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h3 className={styles.title} style={{ fontSize: '1.25rem' }}>Saved for Later ({savedItems.length})</h3>
            {savedItems.map((item) => (
              <div key={item._id} className={styles.cartItem} style={{ opacity: 0.85, marginTop: '1rem' }}>
                <img src={item.image || 'https://via.placeholder.com/90'} alt={item.title} className={styles.image} />
                <div className={styles.itemInfo}>
                  <div>
                    <h4 className={styles.itemTitle}>{item.title}</h4>
                    <div className={styles.itemPrice}>${item.price.toFixed(2)}</div>
                  </div>
                  <div className={styles.actions}>
                    <button className={`${styles.textBtn} ${styles.saveBtn}`} style={{ marginLeft: 0 }} onClick={() => handleToggleSave(item._id)}>
                      Move to Cart
                    </button>
                    <button className={styles.textBtn} onClick={() => handleRemove(item._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary Card */}
      <div className={styles.summarySection}>
        <h3 className={styles.summaryTitle}>Order Summary</h3>
        <div className={styles.row}>
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>Estimated Tax (18%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>Shipping Fee:</span>
          <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Order Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {activeItems.length > 0 && (
          <button className={styles.checkoutBtn} onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
        )}
      </div>
    </div>
  );
};

export default Cart;
