import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from './Checkout.module.css';

const Checkout = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [cart, setCart] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // Inline add address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India'
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Fetch addresses from profile
        const profileRes = await axios.get('/api/users/profile', config);
        const addrs = profileRes.data.addresses || [];
        setAddresses(addrs);
        const defaultAddr = addrs.find(a => a.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr);
        else if (addrs.length > 0) setSelectedAddress(addrs[0]);
        else setShowAddressForm(true); // Auto-open form if no addresses

        // 2. Fetch cart
        const cartRes = await axios.get('/api/cart', config);
        setCart(cartRes.data);

        // 3. Fetch wallet balance
        try {
          const walletRes = await axios.get('/api/users/wallet', config);
          setWalletBalance(walletRes.data.balance || 0);
        } catch {
          setWalletBalance(0);
        }

      } catch (err) {
        console.error('Failed to load checkout data', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) loadCheckoutData();
  }, [isAuthenticated, token]);

  const handleAddressChange = (field, value) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const { name, phone, street, city, state, zipCode, country } = newAddress;
    if (!name || !phone || !street || !city || !state || !zipCode || !country) {
      alert('Please fill in all address fields');
      return;
    }

    try {
      setSavingAddress(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/users/addresses', newAddress, config);
      const savedAddresses = res.data.addresses || [];
      setAddresses(savedAddresses);
      const justAdded = savedAddresses[savedAddresses.length - 1];
      setSelectedAddress(justAdded);
      setShowAddressForm(false);
      setNewAddress({ name: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const res = await axios.post('/api/coupons/validate', {
        code: couponCode,
        orderAmount: subtotal
      }, config);
      setAppliedCoupon(res.data.coupon);
      setDiscount(res.data.discount);
      alert(`Coupon applied! Discount: ₹${res.data.discount}`);
    } catch (err) {
      setCouponError(err.response?.data?.errors?.[0]?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setDiscount(0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select or add a shipping address first');
      return;
    }
    if (activeItems.length === 0) {
      alert('Your cart is empty. Add items before placing an order.');
      return;
    }

    try {
      setPlacingOrder(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Calculate totals
      const subtotalAmt = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmt = Math.round((subtotalAmt - discount) * 0.18 * 100) / 100;
      const shippingAmt = subtotalAmt > 100 ? 0 : 15;
      const totalAmount = subtotalAmt - discount + taxAmt + shippingAmt;

      // Wallet payment check
      if (paymentMethod === 'wallet') {
        if (walletBalance < totalAmount) {
          alert('Insufficient wallet balance. Please choose another payment method.');
          setPlacingOrder(false);
          return;
        }
        await axios.post('/api/users/wallet/pay', {
          amount: totalAmount,
          description: 'Payment for order checkout'
        }, config);
      }

      // Create order
      const orderRes = await axios.post('/api/orders', {
        items: activeItems,
        shippingAddress: selectedAddress,
        paymentMethod,
        couponCode: appliedCoupon?.code || '',
        discountAmount: discount
      }, config);

      const orderId = orderRes.data.id || orderRes.data._id;

      // Log payment
      await axios.post('/api/payments/charge', {
        orderId,
        amount: totalAmount,
        paymentMethod,
        paymentToken: 'tok_visa'
      }, config).catch(() => {}); // Non-blocking

      // Redeem coupon
      if (appliedCoupon) {
        await axios.post('/api/coupons/redeem', { code: appliedCoupon.code }, config).catch(() => {});
      }

      // Clear cart
      await axios.delete('/api/cart/clear/active', config).catch(() => {});

      alert('🌿 Order placed successfully! Thank you for shopping at GLASS Plant Store.');
      navigate('/profile', { state: { tab: 'orders' } });

    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '8rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌿</div>
        Loading checkout...
      </div>
    );
  }

  const activeItems = cart?.items?.filter(item => !item.savedForLater) || [];
  const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
  const shipping = subtotal > 100 || activeItems.length === 0 ? 0 : 15;
  const totalAmount = subtotal - discount + tax + shipping;

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>

        {/* ── Shipping Address Card ── */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 className={styles.title} style={{ marginBottom: 0 }}>📦 Shipping Address</h3>
            {!showAddressForm && (
              <button
                onClick={() => setShowAddressForm(true)}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: '20px',
                  padding: '0.3rem 0.8rem',
                  transition: 'all 0.15s'
                }}
              >
                + Add New
              </button>
            )}
          </div>

          {/* Existing saved addresses */}
          {addresses.length > 0 && !showAddressForm && (
            <div className={styles.addressList}>
              {addresses.map((addr, idx) => (
                <div
                  key={addr._id || idx}
                  className={`${styles.addressItem} ${selectedAddress?._id === addr._id || selectedAddress === addr ? styles.activeAddressItem : ''}`}
                  onClick={() => setSelectedAddress(addr)}
                >
                  <input
                    type="radio"
                    name="address_select"
                    checked={selectedAddress?._id === addr._id || selectedAddress === addr}
                    onChange={() => setSelectedAddress(addr)}
                  />
                  <div className={styles.addressDetails}>
                    <strong style={{ color: 'var(--text-main)' }}>{addr.name}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                      {addr.phone}
                    </span>
                    <br />
                    {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}<br />
                    {addr.country}
                    {addr.isDefault && <span style={{ color: 'var(--color-accent)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>✔ Default</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline Add Address Form */}
          {showAddressForm && (
            <form onSubmit={handleSaveAddress} className={styles.addressForm}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Enter your shipping details below:
              </p>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="Your full name"
                    value={newAddress.name}
                    onChange={e => handleAddressChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone *</label>
                  <input
                    className={styles.formInput}
                    type="tel"
                    placeholder="10-digit number"
                    value={newAddress.phone}
                    onChange={e => handleAddressChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Street Address *</label>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Door no, Street, Area"
                  value={newAddress.street}
                  onChange={e => handleAddressChange('street', e.target.value)}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={e => handleAddressChange('city', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>State *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={e => handleAddressChange('state', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>PIN Code *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="6-digit PIN"
                    value={newAddress.zipCode}
                    onChange={e => handleAddressChange('zipCode', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Country</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="Country"
                    value={newAddress.country}
                    onChange={e => handleAddressChange('country', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="submit" className={styles.btnSaveAddress} disabled={savingAddress}>
                  {savingAddress ? 'Saving...' : '✔ Save & Use This Address'}
                </button>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 1rem' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Empty state with no form */}
          {addresses.length === 0 && !showAddressForm && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              No addresses saved.{' '}
              <button
                onClick={() => setShowAddressForm(true)}
                style={{ color: 'var(--color-accent)', textDecoration: 'underline', fontSize: '0.9rem' }}
              >
                Click here to add one
              </button>
            </div>
          )}
        </div>

        {/* ── Payment Method Card ── */}
        <div className={styles.card}>
          <h3 className={styles.title}>💳 Payment Method</h3>
          <div className={styles.paymentMethods}>
            {[
              { id: 'cod', label: '📦 Cash on Delivery (COD)', subtitle: 'Pay when your plants arrive' },
              { id: 'stripe', label: '💳 Credit / Debit Card', subtitle: 'Stripe secure payment (Sandbox)' },
              { id: 'razorpay', label: '🏦 UPI / Netbanking', subtitle: 'Razorpay (Sandbox)' },
              { id: 'wallet', label: `👛 Pay with Wallet`, subtitle: `Balance: ₹${walletBalance.toFixed(2)}` },
            ].map(method => (
              <div
                key={method.id}
                className={`${styles.methodItem} ${paymentMethod === method.id ? styles.activeMethodItem : ''}`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <input
                  type="radio"
                  name="payment_select"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{method.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{method.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Order Summary Sidebar ── */}
      <div className={styles.card} style={{ height: 'fit-content', position: 'sticky', top: '90px' }}>
        <h3 className={styles.title} style={{ fontSize: '1.2rem' }}>🌿 Order Details</h3>

        {/* Item list */}
        <div style={{ marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {activeItems.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              No items in cart.{' '}
              <Link to="/search" style={{ color: 'var(--color-accent)' }}>Shop now</Link>
            </div>
          ) : (
            activeItems.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  padding: '0.4rem 0',
                  borderBottom: '1px solid var(--card-border)'
                }}
              >
                <span style={{ maxWidth: '60%' }}>{item.title} <span style={{ color: 'var(--color-accent)' }}>×{item.quantity}</span></span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Coupon Form */}
        <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
          <input
            type="text"
            className={styles.couponInput}
            placeholder="COUPON CODE"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          />
          <button type="submit" className={styles.btnApply}>Apply</button>
        </form>
        {couponError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '1rem' }}>⚠️ {couponError}</div>
        )}
        {appliedCoupon && (
          <div style={{ color: 'var(--success)', fontSize: '0.75rem', marginBottom: '1rem' }}>
            ✅ Coupon "{appliedCoupon.code}" applied!
          </div>
        )}

        {/* Price Breakdown */}
        <div className={styles.row}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className={styles.row} style={{ color: 'var(--success)' }}>
            <span>Discount:</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className={styles.row}>
          <span>GST (18%):</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>Shipping:</span>
          <span style={{ color: shipping === 0 ? 'var(--success)' : 'inherit' }}>
            {shipping === 0 ? '🎉 FREE' : `₹${shipping.toFixed(2)}`}
          </span>
        </div>

        <div className={styles.totalRow}>
          <span>Grand Total:</span>
          <span style={{ color: 'var(--color-accent)' }}>₹{totalAmount.toFixed(2)}</span>
        </div>

        {/* Selected address display */}
        {selectedAddress && (
          <div style={{
            marginTop: '1rem',
            padding: '0.8rem',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            📍 <strong style={{ color: 'var(--text-main)' }}>{selectedAddress.name}</strong> — {selectedAddress.street}, {selectedAddress.city}
          </div>
        )}

        <button
          className={styles.placeOrderBtn}
          onClick={handlePlaceOrder}
          disabled={placingOrder || activeItems.length === 0}
          style={{ opacity: (placingOrder || activeItems.length === 0) ? 0.6 : 1 }}
        >
          {placingOrder ? '⏳ Processing...' : '🌿 Place Order & Pay'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
          🔒 Secure checkout — Your data is protected
        </p>
      </div>
    </div>
  );
};

export default Checkout;
