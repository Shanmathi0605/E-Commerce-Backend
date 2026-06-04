import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './VendorDashboard.module.css';

const VendorDashboard = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [vendor, setVendor] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Product Form state
  const [newProd, setNewProd] = useState({
    title: '', description: '', price: '', category: '', brand: ''
  });
  const [newProdImages, setNewProdImages] = useState([]);
  const [variants, setVariants] = useState([{ size: '', color: '', price: '', stock: 10 }]);

  // New Coupon state
  const [newCoupon, setNewCoupon] = useState({
    code: '', discountType: 'percentage', discountValue: '', minOrderAmount: 0,
    startDate: '', endDate: '', usageLimit: 100
  });

  // KYC upload state
  const [storeName, setStoreName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [kycFiles, setKycFiles] = useState({ businessLicense: null, logo: null, banner: null });

  const loadVendorData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Fetch vendor profile
      try {
        const vendorRes = await axios.get('/api/vendors/profile', config);
        setVendor(vendorRes.data);
      } catch (err) {
        // If 404, vendor profile does not exist yet (requires KYC registration)
        setVendor(null);
      }

      // 2. Load analytics
      const analRes = await axios.get('/api/analytics/vendor', config);
      setAnalytics(analRes.data);

      // 3. Load categories (for product creation)
      const catRes = await axios.get('/api/products/categories');
      setCategories(catRes.data);

      // 4. Load vendor's products
      const prodRes = await axios.get('/api/products', config);
      setProducts(prodRes.data);

      // 5. Load orders
      const ordRes = await axios.get('/api/orders/all', config);
      setOrders(ordRes.data);

      // 6. Load coupons
      const coupRes = await axios.get('/api/coupons', config);
      setCoupons(coupRes.data);

    } catch (err) {
      console.error('Failed to load vendor panel details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, [isAuthenticated, token]);

  const handleKYCSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('storeName', storeName);
    formData.append('taxId', taxId);
    if (kycFiles.businessLicense) formData.append('businessLicense', kycFiles.businessLicense);
    if (kycFiles.logo) formData.append('logo', kycFiles.logo);
    if (kycFiles.banner) formData.append('banner', kycFiles.banner);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      const res = await axios.post('/api/vendors/register', formData, config);
      setVendor(res.data);
      alert('KYC Documents submitted successfully! Pending Admin verification.');
    } catch (err) {
      alert('KYC submission failed');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newProd.title);
    formData.append('description', newProd.description);
    formData.append('price', newProd.price);
    formData.append('category', newProd.category);
    formData.append('brand', newProd.brand);
    formData.append('variants', JSON.stringify(variants));

    for (let i = 0; i < newProdImages.length; i++) {
      formData.append('images', newProdImages[i]);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      await axios.post('/api/products', formData, config);
      alert('Product created! Pending Admin approval.');
      setNewProd({ title: '', description: '', price: '', category: '', brand: '' });
      setNewProdImages([]);
      setVariants([{ size: '', color: '', price: '', stock: 10 }]);
      // Refresh list
      const prodRes = await axios.get('/api/products', config);
      setProducts(prodRes.data);
    } catch (err) {
      alert('Failed to create product');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/coupons', newCoupon, config);
      alert('Coupon created successfully!');
      setNewCoupon({
        code: '', discountType: 'percentage', discountValue: '', minOrderAmount: 0,
        startDate: '', endDate: '', usageLimit: 100
      });
      // Refresh list
      const coupRes = await axios.get('/api/coupons', config);
      setCoupons(coupRes.data);
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || 'Failed to create coupon');
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`/api/orders/${orderId}/status`, { status: nextStatus }, config);
      alert(`Order status updated to ${nextStatus}!`);
      // Refresh orders
      const ordRes = await axios.get('/api/orders/all', config);
      setOrders(ordRes.data);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAddVariantField = () => {
    setVariants([...variants, { size: '', color: '', price: '', stock: 10 }]);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-muted)' }}>🌿 Loading seller panel...</div>;
  }

  // Active dashboard — vendor may be null if KYC not submitted yet
  const myProducts = vendor ? products.filter(p => p.vendorId === vendor.userId) : [];

  return (
    <div className={styles.container}>
      <header className={styles.headerRow}>
        <div>
          <h2>🌿 Seller Panel{vendor?.storeName ? `: ${vendor.storeName}` : ''}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>
            {vendor ? `Status: ${vendor.status === 'pending' ? '⏳ Pending Approval' : '✅ Active'} | Commission: ${vendor.commissionPercentage || 0}%` : 'Complete setup to start selling'}
          </span>
        </div>
      </header>

      {/* Tabs Row */}
      <div className={styles.tabsRow}>
        <button className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('products')}>My Products</button>
        <button className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('orders')}>Customer Orders</button>
        <button className={`${styles.tabBtn} ${activeTab === 'coupons' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('coupons')}>Manage Coupons</button>
      </div>

      {/* Overview Tab (Charts) */}
      {activeTab === 'overview' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Gross Revenue</span>
              <div className={styles.metricVal}>₹{analytics?.summary?.totalSales || '0'}</div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Processed Orders</span>
              <div className={styles.metricVal}>{analytics?.summary?.totalOrders || '0'}</div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Listed Products</span>
              <div className={styles.metricVal}>{myProducts.length}</div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Platform followers</span>
              <div className={styles.metricVal}>{vendor?.followers?.length || 0}</div>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1.2rem' }}>Revenue Analytics (Last 7 Days)</h4>
            {analytics?.charts && (
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={analytics.charts}>
                  <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--card-border)' }} />
                  <Area type="monotone" dataKey="totalSales" stroke="var(--color-primary)" fill="rgba(16, 185, 129, 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      {/* Products list & Form Tab */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem' }}>
          {/* Table list */}
          <div className={styles.tableCard}>
            <h4 style={{ fontSize: '1rem' }}>Active Inventory Catalog</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Title</th>
                  <th>Base Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myProducts.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products listed yet.</td>
                  </tr>
                ) : (
                  myProducts.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <img src={p.images?.[0] || 'https://via.placeholder.com/45'} alt={p.title} className={styles.productImg} />
                      </td>
                      <td>{p.title}</td>
                      <td>₹{p.price.toFixed(2)}</td>
                      <td>
                        <span className={`${styles.statusIndicator} ${styles[p.status]}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Creation Form */}
          <div className={styles.formCard}>
            <h4 className={styles.title} style={{ margin: 0, paddingBottom: '0.5rem' }}>List New Product</h4>
            <form onSubmit={handleCreateProduct}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" className={styles.input} required placeholder="Product Title" value={newProd.title} onChange={(e) => setNewProd({...newProd, title: e.target.value})} />
                <textarea className={styles.input} required placeholder="Product Description" style={{ minHeight: '80px' }} value={newProd.description} onChange={(e) => setNewProd({...newProd, description: e.target.value})} />
                <input type="number" className={styles.input} required placeholder="Base Price (₹)" value={newProd.price} onChange={(e) => setNewProd({...newProd, price: e.target.value})} />
                <input type="text" className={styles.input} required placeholder="Brand" value={newProd.brand} onChange={(e) => setNewProd({...newProd, brand: e.target.value})} />
                
                <select className={styles.input} required value={newProd.category} onChange={(e) => setNewProd({...newProd, category: e.target.value})}>
                  <option value="">Choose Category</option>
                  {categories.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                  ))}
                </select>

                <input type="file" multiple required onChange={(e) => setNewProdImages(e.target.files)} />

                {/* Variants dynamic row fields builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Variants & Stock Matrix:</label>
                    <button type="button" style={{ color: 'var(--color-accent)', fontSize: '0.75rem' }} onClick={handleAddVariantField}>
                      + Add Variant
                    </button>
                  </div>
                  {variants.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <input type="text" className={styles.input} placeholder="Size" style={{ padding: '0.4rem' }} value={v.size} onChange={(e) => {
                        const next = [...variants]; next[idx].size = e.target.value; setVariants(next);
                      }} />
                      <input type="text" className={styles.input} placeholder="Color" style={{ padding: '0.4rem' }} value={v.color} onChange={(e) => {
                        const next = [...variants]; next[idx].color = e.target.value; setVariants(next);
                      }} />
                      <input type="number" className={styles.input} placeholder="Price Override" style={{ padding: '0.4rem' }} value={v.price} onChange={(e) => {
                        const next = [...variants]; next[idx].price = e.target.value; setVariants(next);
                      }} />
                      <input type="number" className={styles.input} placeholder="Stock" required style={{ padding: '0.4rem' }} value={v.stock} onChange={(e) => {
                        const next = [...variants]; next[idx].stock = e.target.value; setVariants(next);
                      }} />
                    </div>
                  ))}
                </div>

                <button type="submit" className={styles.submitBtn} style={{ width: '100%' }}>Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders processing tab */}
      {activeTab === 'orders' && (
        <div className={styles.tableCard}>
          <h4 style={{ fontSize: '1rem' }}>Active Customer Orders</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Payment Status</th>
                <th>Items List</th>
                <th>Total</th>
                <th>Shipping State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customer orders placed yet.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td>{o._id}</td>
                    <td>{o.paymentStatus.toUpperCase()}</td>
                    <td>
                      {o.items.map((it, idx) => (
                        <div key={idx}>{it.title} (x{it.quantity})</div>
                      ))}
                    </td>
                    <td>₹{o.totals.total.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.statusIndicator} ${styles[o.orderStatus]}`}>{o.orderStatus}</span>
                    </td>
                    <td>
                      {o.orderStatus === 'pending' && (
                        <button className={styles.submitBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o._id, 'confirmed')}>
                          Confirm Order
                        </button>
                      )}
                      {o.orderStatus === 'confirmed' && (
                        <button className={styles.submitBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o._id, 'packed')}>
                          Pack Items
                        </button>
                      )}
                      {o.orderStatus === 'packed' && (
                        <button className={styles.submitBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o._id, 'shipped')}>
                          Dispatch (Ship)
                        </button>
                      )}
                      {o.orderStatus === 'shipped' && (
                        <button className={styles.submitBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o._id, 'delivered')}>
                          Mark Delivered
                        </button>
                      )}
                      {['cancelled', 'delivered'].includes(o.orderStatus) && <span style={{ color: 'var(--text-muted)' }}>Done</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* List */}
          <div className={styles.tableCard}>
            <h4 style={{ fontSize: '1rem' }}>Active Shop Coupon Campaigns</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage Count</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No coupon campaigns created.</td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c._id}>
                      <td><strong>{c.code}</strong></td>
                      <td>{c.discountType === 'flat' ? `₹${c.discountValue}` : `${c.discountValue}%`}</td>
                      <td>₹{c.minOrderAmount}</td>
                      <td>{c.usageCount} / {c.usageLimit || '∞'}</td>
                      <td>{new Date(c.endDate).toDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Creation Form */}
          <div className={styles.formCard}>
            <h4 className={styles.title} style={{ margin: 0, paddingBottom: '0.5rem' }}>Create Coupon</h4>
            <form onSubmit={handleCreateCoupon}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" className={styles.input} required placeholder="Coupon Code (e.g. SAVE20)" value={newCoupon.code} onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})} />
                
                <select className={styles.input} value={newCoupon.discountType} onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}>
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="flat">Flat Rupee Discount (₹)</option>
                </select>

                <input type="number" className={styles.input} required placeholder="Discount Value" value={newCoupon.discountValue} onChange={(e) => setNewCoupon({...newCoupon, discountValue: e.target.value})} />
                <input type="number" className={styles.input} required placeholder="Min Order Amount (₹)" value={newCoupon.minOrderAmount} onChange={(e) => setNewCoupon({...newCoupon, minOrderAmount: e.target.value})} />
                
                <div>
                  <label className={styles.label}>Start Date</label>
                  <input type="date" className={styles.input} style={{ width: '100%' }} required value={newCoupon.startDate} onChange={(e) => setNewCoupon({...newCoupon, startDate: e.target.value})} />
                </div>
                <div>
                  <label className={styles.label}>End Date</label>
                  <input type="date" className={styles.input} style={{ width: '100%' }} required value={newCoupon.endDate} onChange={(e) => setNewCoupon({...newCoupon, endDate: e.target.value})} />
                </div>

                <input type="number" className={styles.input} required placeholder="Usage Limit" value={newCoupon.usageLimit} onChange={(e) => setNewCoupon({...newCoupon, usageLimit: e.target.value})} />

                <button type="submit" className={styles.submitBtn} style={{ width: '100%' }}>Launch Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
