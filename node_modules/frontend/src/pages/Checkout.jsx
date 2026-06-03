import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCheckoutData = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Fetch addresses
        const profileRes = await axios.get('/api/users/profile', config);
        setAddresses(profileRes.data.addresses || []);
        const defaultAddr = profileRes.data.addresses?.find(a => a.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr);
        else if (profileRes.data.addresses?.length > 0) setSelectedAddress(profileRes.data.addresses[0]);

        // 2. Fetch cart
        const cartRes = await axios.get('/api/cart', config);
        setCart(cartRes.data);

        // 3. Fetch wallet balance
        const walletRes = await axios.get('/api/users/wallet', config);
        setWalletBalance(walletRes.data.balance || 0);

      } catch (err) {
        console.error('Failed to load checkout fields', err);
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [isAuthenticated, token]);

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
      alert(`Coupon applied successfully! Discount: $${res.data.discount}`);
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

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Calculate totals
      const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
      const shipping = subtotal > 100 ? 0 : 15;
      const totalAmount = subtotal - discount + tax + shipping;

      // 1. Process payment deductions if wallet
      if (paymentMethod === 'wallet') {
        if (walletBalance < totalAmount) {
          alert('Insufficient wallet balance. Please select another payment method or add funds.');
          return;
        }
        // Deduct wallet
        await axios.post('/api/users/wallet/pay', {
          amount: totalAmount,
          description: `Payment for order checkout`
        }, config);
      }

      // 2. Create Order document
      const orderRes = await axios.post('/api/orders', {
        items: activeItems,
        shippingAddress: selectedAddress,
        paymentMethod,
        couponCode: appliedCoupon?.code || '',
        discountAmount: discount
      }, config);

      const orderId = orderRes.data.id || orderRes.data._id;

      // 3. Process credit card charge / log transaction
      await axios.post('/api/payments/charge', {
        orderId,
        amount: totalAmount,
        paymentMethod,
        paymentToken: 'tok_visa' // Mock card token
      }, config);

      // 4. Redeem coupon usage count
      if (appliedCoupon) {
        await axios.post('/api/coupons/redeem', { code: appliedCoupon.code }, config);
      }

      // 5. Clear shopping cart
      await axios.delete('/api/cart/clear/active', config);

      alert('Order placed successfully!');
      navigate('/profile'); // Redirect to profile order tracking tab

    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || 'Failed to place order');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading checkout parameters...</div>;
  }

  const activeItems = cart?.items?.filter(item => !item.savedForLater) || [];
  const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
  const shipping = subtotal > 100 || activeItems.length === 0 ? 0 : 15;
  const totalAmount = subtotal - discount + tax + shipping;

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        {/* Shipping Address Selection card */}
        <div className={styles.card}>
          <h3 className={styles.title}>Shipping Address</h3>
          {addresses.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              No addresses saved. Navigate to your <Link to="/profile" style={{ color: 'var(--color-accent)' }}>Profile</Link> to add shipping destinations.
            </div>
          ) : (
            <div className={styles.addressList}>
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`${styles.addressItem} ${selectedAddress?._id === addr._id ? styles.activeAddressItem : ''}`}
                  onClick={() => setSelectedAddress(addr)}
                >
                  <input
                    type="radio"
                    name="address_select"
                    checked={selectedAddress?._id === addr._id}
                    onChange={() => setSelectedAddress(addr)}
                  />
                  <div className={styles.addressDetails}>
                    <strong>{addr.name}</strong> ({addr.phone})<br />
                    {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}<br />
                    {addr.country} {addr.isDefault && <span style={{ color: 'var(--color-accent)' }}>(Default)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Selection card */}
        <div className={styles.card}>
          <h3 className={styles.title}>Payment Method</h3>
          <div className={styles.paymentMethods}>
            <div
              className={`${styles.methodItem} ${paymentMethod === 'stripe' ? styles.activeMethodItem : ''}`}
              onClick={() => setPaymentMethod('stripe')}
            >
              <input
                type="radio"
                name="payment_select"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
              />
              💳 Credit / Debit Card (Stripe Sandbox)
            </div>

            <div
              className={`${styles.methodItem} ${paymentMethod === 'razorpay' ? styles.activeMethodItem : ''}`}
              onClick={() => setPaymentMethod('razorpay')}
            >
              <input
                type="radio"
                name="payment_select"
                checked={paymentMethod === 'razorpay'}
                onChange={() => setPaymentMethod('razorpay')}
              />
              🏦 UPI / Netbanking (Razorpay Sandbox)
            </div>

            <div
              className={`${styles.methodItem} ${paymentMethod === 'wallet' ? styles.activeMethodItem : ''}`}
              onClick={() => setPaymentMethod('wallet')}
            >
              <input
                type="radio"
                name="payment_select"
                checked={paymentMethod === 'wallet'}
                onChange={() => setPaymentMethod('wallet')}
              />
              👛 Pay with Wallet (Balance: ${walletBalance.toFixed(2)})
            </div>

            <div
              className={`${styles.methodItem} ${paymentMethod === 'cod' ? styles.activeMethodItem : ''}`}
              onClick={() => setPaymentMethod('cod')}
            >
              <input
                type="radio"
                name="payment_select"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              📦 Cash on Delivery (COD)
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Sidebar Summary */}
      <div className={styles.card} style={{ height: 'fit-content' }}>
        <h3 className={styles.title} style={{ fontSize: '1.2rem' }}>Order Details</h3>
        
        {/* Item list */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {activeItems.map((item) => (
            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>{item.title} (x{item.quantity})</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Coupons Form */}
        <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
          <input
            type="text"
            className={styles.couponInput}
            placeholder="COUPON CODE"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button type="submit" className={styles.btnApply}>
            Apply
          </button>
        </form>
        {couponError && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '1rem' }}>⚠️ {couponError}</div>}

        <div className={styles.row}>
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className={styles.row} style={{ color: 'var(--success)' }}>
            <span>Coupon Discount:</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className={styles.row}>
          <span>Estimated Tax (18%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>Shipping Fee:</span>
          <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
        </div>
        
        <div className={styles.totalRow} style={{ marginBottom: '1rem' }}>
          <span>Grand Total:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>

        <button className={styles.placeOrderBtn} onClick={handlePlaceOrder}>
          Place Order & Pay
        </button>
      </div>
    </div>
  );
};

export default Checkout;
