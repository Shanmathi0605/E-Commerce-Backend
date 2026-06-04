import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from './Profile.module.css';
import { FiUser, FiMapPin, FiPackage, FiCreditCard, FiUsers, FiDownload, FiX } from 'react-icons/fi';

const Profile = () => {
  const { token, isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [referral, setReferral] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile forms state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Address creation state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: '', phone: '', street: '', city: '', state: '', zipCode: '', country: ''
  });

  // Wallet topup state
  const [topUpAmount, setTopUpAmount] = useState('');

  // Referral apply state
  const [applyCode, setApplyCode] = useState('');

  const fetchProfileData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const profRes = await axios.get('/api/users/profile', config);
      setProfile(profRes.data);
      setName(profRes.data.name || '');
      setPhone(profRes.data.phone || '');

      const walRes = await axios.get('/api/users/wallet', config);
      setWallet(walRes.data);

      const refRes = await axios.get('/api/users/referrals', config);
      setReferral(refRes.data);

      const ordRes = await axios.get('/api/orders/my', config);
      setOrders(ordRes.data);

    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [isAuthenticated, token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put('/api/users/profile', { name, phone }, config);
      setProfile(res.data);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/users/addresses', newAddr, config);
      setProfile(res.data);
      setShowAddressForm(false);
      setNewAddr({ name: '', phone: '', street: '', city: '', state: '', zipCode: '', country: '' });
      alert('Address added successfully!');
    } catch (err) {
      alert('Failed to add address');
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.delete(`/api/users/addresses/${addrId}`, config);
      setProfile(res.data);
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addrId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.patch(`/api/users/addresses/${addrId}/default`, {}, config);
      setProfile(res.data);
    } catch (err) {
      alert('Failed to update default address');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`/api/orders/${orderId}/cancel`, {}, config);
      alert('Order cancelled successfully.');
      // Refresh orders
      const ordRes = await axios.get('/api/orders/my', config);
      setOrders(ordRes.data);
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || 'Cancel failed');
    }
  };

  // Download invoice PDF with auth token (fixes "Site wasn't available" error)
  const handleDownloadInvoice = async (orderId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Receive binary PDF data
      };
      const res = await axios.get(`/api/orders/${orderId}/invoice`, config);

      // Create a temporary blob URL and trigger a real file download
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GLASS-Invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleTopUp = async (e) => {

    e.preventDefault();
    if (!topUpAmount || Number(topUpAmount) <= 0) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/users/wallet/add-funds', {
        amount: Number(topUpAmount),
        description: 'Deposited funds'
      }, config);
      setWallet(res.data);
      setTopUpAmount('');
      alert('Funds deposited successfully!');
    } catch (err) {
      alert('Failed to add funds');
    }
  };

  const handleApplyReferral = async (e) => {
    e.preventDefault();
    if (!applyCode.trim()) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/users/referrals/apply', { code: applyCode }, config);
      setReferral(res.data.referral);
      // reload wallet for credit addition
      const walRes = await axios.get('/api/users/wallet', config);
      setWallet(walRes.data);
      setApplyCode('');
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || 'Failed to apply referral code');
    }
  };

  if (!isAuthenticated) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Please login to view profile.</div>;
  }

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading profile metrics...</div>;
  }

  const getStepClass = (orderStatus, stepName) => {
    const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIdx = statuses.indexOf(orderStatus);
    const stepIdx = statuses.indexOf(stepName);

    if (orderStatus === 'cancelled') return styles.trackingStep;
    if (currentIdx >= stepIdx) {
      return currentIdx === stepIdx ? `${styles.trackingStep} ${styles.stepActive}` : `${styles.trackingStep} ${styles.stepDone}`;
    }
    return styles.trackingStep;
  };

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <button className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('profile')}>
          <FiUser size={16} /> Profile Settings
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'addresses' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('addresses')}>
          <FiMapPin size={16} /> Shipping Addresses
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('orders')}>
          <FiPackage size={16} /> My Orders
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'wallet' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('wallet')}>
          <FiCreditCard size={16} /> Wallet Balance
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'referrals' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('referrals')}>
          <FiUsers size={16} /> Invite &amp; Referrals
        </button>
      </aside>

      {/* Main Content card */}
      <section className={styles.contentCard}>
        {activeTab === 'profile' && (
          <div>
            <h3 className={styles.title}>Profile Settings</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input type="text" className={styles.input} value={profile?.email || ''} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Account Role</label>
                  <input type="text" className={styles.input} value={user?.role?.toUpperCase() || ''} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Name</label>
                  <input type="text" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input type="text" className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <button type="submit" className={styles.btnSave}>
                Save Details
              </button>
            </form>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className={styles.title} style={{ margin: 0, border: 'none', padding: 0 }}>Addresses</h3>
              <button className={styles.btnSave} onClick={() => setShowAddressForm(!showAddressForm)}>
                {showAddressForm ? 'Cancel' : '+ Add Address'}
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--card-border)' }}>
                <div className={styles.formGrid}>
                  <input type="text" className={styles.input} placeholder="Contact Name" required value={newAddr.name} onChange={(e) => setNewAddr({...newAddr, name: e.target.value})} />
                  <input type="text" className={styles.input} placeholder="Contact Phone" required value={newAddr.phone} onChange={(e) => setNewAddr({...newAddr, phone: e.target.value})} />
                  <input type="text" className={styles.input} placeholder="Street Address" required value={newAddr.street} onChange={(e) => setNewAddr({...newAddr, street: e.target.value})} />
                  <input type="text" className={styles.input} placeholder="City" required value={newAddr.city} onChange={(e) => setNewAddr({...newAddr, city: e.target.value})} />
                  <input type="text" className={styles.input} placeholder="State" required value={newAddr.state} onChange={(e) => setNewAddr({...newAddr, state: e.target.value})} />
                  <input type="text" className={styles.input} placeholder="Zip Code" required value={newAddr.zipCode} onChange={(e) => setNewAddr({...newAddr, zipCode: e.target.value})} />
                  <input type="text" className={styles.input} placeholder="Country" required value={newAddr.country} onChange={(e) => setNewAddr({...newAddr, country: e.target.value})} />
                </div>
                <button type="submit" className={styles.btnSave}>Save Address</button>
              </form>
            )}

            <div className={styles.addressGrid}>
              {profile?.addresses?.map((addr) => (
                <div key={addr._id} className={styles.addressCard}>
                  <div className={styles.addressText}>
                    <strong>{addr.name}</strong> ({addr.phone})<br />
                    {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}<br />
                    {addr.country}
                  </div>
                  <div className={styles.addressActions}>
                    {!addr.isDefault && (
                      <button style={{ color: 'var(--color-accent)' }} onClick={() => handleSetDefaultAddress(addr._id)}>Set Default</button>
                    )}
                    <button style={{ color: 'var(--danger)' }} onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h3 className={styles.title}>Order History</h3>

            {orders.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders placed yet.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={styles.orderItem}>
                  <div className={styles.orderHeader}>
                    <div>
                      <strong>Order ID:</strong> {order.id}<br />
                      <strong>Date:</strong> {new Date(order.createdAt).toDateString()}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`${styles.statusTag} ${styles[order.orderStatus]}`}>{order.orderStatus}</span><br />
                      <strong style={{ display: 'block', marginTop: '0.4rem', color: 'var(--text-main)' }}>
                        ₹{order.totals.total.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Products lists */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{item.title} (x{item.quantity})</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status visual tracking progress bar */}
                  {order.orderStatus !== 'cancelled' && (
                    <div className={styles.trackingSteps}>
                      <div className={styles.trackingLine}></div>
                      <div className={getStepClass(order.orderStatus, 'pending')}>
                        <span className={styles.stepDot}></span>
                        <span>Placed</span>
                      </div>
                      <div className={getStepClass(order.orderStatus, 'confirmed')}>
                        <span className={styles.stepDot}></span>
                        <span>Confirmed</span>
                      </div>
                      <div className={getStepClass(order.orderStatus, 'shipped')}>
                        <span className={styles.stepDot}></span>
                        <span>Shipped</span>
                      </div>
                      <div className={getStepClass(order.orderStatus, 'delivered')}>
                        <span className={styles.stepDot}></span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      className={styles.btnSave}
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--card-border)', color: 'var(--text-main)', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <FiDownload size={14} /> Download Invoice
                    </button>

                    {['pending', 'confirmed'].includes(order.orderStatus) && (
                      <button
                        className={styles.btnSave}
                        style={{ background: 'var(--danger)' }}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div>
            <h3 className={styles.title}>My Wallet</h3>
            <div className={styles.walletHeader}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Wallet Balance</span>
                <div className={styles.walletBalance}>₹{wallet?.balance?.toFixed(2) || '0.00'}</div>
              </div>

              {/* Deposit top-up form */}
              <form onSubmit={handleTopUp} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  className={styles.input}
                  style={{ width: '120px' }}
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                />
                <button type="submit" className={styles.btnSave}>+ Top-up Funds</button>
              </form>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>Transaction History</h4>
            <table className={styles.transactionTable}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {wallet?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No transactions yet.</td>
                  </tr>
                ) : (
                  wallet?.transactions?.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{tx.description}</td>
                      <td className={tx.type === 'credit' ? styles.credit : styles.debit}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </td>
                      <td>{tx.type.toUpperCase()}</td>
                      <td>{new Date(tx.timestamp).toDateString()}</td>
                    </tr>
                  )).reverse()
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div>
            <h3 className={styles.title}>Referral Program</h3>
            
            <div className={styles.walletHeader}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Referral Code</span>
                <div className={styles.walletBalance} style={{ fontSize: '1.8rem', color: 'var(--color-accent)' }}>
                  {referral?.referralCode}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rewards Earned</span>
                <div className={styles.walletBalance} style={{ color: 'var(--success)' }}>
                  ₹{referral?.rewardsEarned || '0.00'}
                </div>
              </div>
            </div>

            {!referral?.referredBy && (
              <form onSubmit={handleApplyReferral} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Have a friend's referral code?</span>
                <input
                  type="text"
                  placeholder="ENTER CODE"
                  className={styles.input}
                  style={{ textTransform: 'uppercase', width: '150px' }}
                  value={applyCode}
                  onChange={(e) => setApplyCode(e.target.value)}
                />
                <button type="submit" className={styles.btnSave}>Apply Code</button>
              </form>
            )}

            <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>Referred Friends ({referral?.referrals?.length || 0})</h4>
            <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {referral?.referrals?.length === 0 ? (
                <span>No referrals recorded. Share your invite code with friends to earn wallet credits!</span>
              ) : (
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {referral?.referrals?.map((id, idx) => (
                    <li key={idx}>User ID: {id} (Referred successfully)</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
