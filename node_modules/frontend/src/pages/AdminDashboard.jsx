import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Load Admin Analytics
      const analRes = await axios.get('/api/analytics/admin', config);
      setAnalytics(analRes.data);

      // 2. Load all vendors
      const vendRes = await axios.get('/api/vendors/admin/list', config);
      setVendors(vendRes.data);

      // 3. Load all pending products
      const prodRes = await axios.get('/api/products?status=pending_approval', config);
      setPendingProducts(prodRes.data);

    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAuthenticated, token]);

  const handleApproveVendor = async (vendorId, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`/api/vendors/admin/${vendorId}/approve`, { status }, config);
      alert(`Vendor status updated to ${status.toUpperCase()}!`);
      // Reload lists
      const vendRes = await axios.get('/api/vendors/admin/list', config);
      setVendors(vendRes.data);
    } catch (err) {
      alert('Failed to update vendor approval status');
    }
  };

  const handleUpdateCommission = async (vendorId, rate) => {
    if (rate === undefined || rate < 0 || rate > 100) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`/api/vendors/admin/${vendorId}/commission`, { commissionPercentage: Number(rate) }, config);
      alert('Commission percentage updated!');
      // Reload lists
      const vendRes = await axios.get('/api/vendors/admin/list', config);
      setVendors(vendRes.data);
    } catch (err) {
      alert('Failed to adjust commission percentage');
    }
  };

  const handleApproveProduct = async (productId, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`/api/products/${productId}/approve`, { status }, config);
      alert(`Product quality review updated to ${status.toUpperCase()}!`);
      // Reload list
      const prodRes = await axios.get('/api/products?status=pending_approval', config);
      setPendingProducts(prodRes.data);
    } catch (err) {
      alert('Failed to update product status');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading platform administration dashboards...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.titleRow}>
        <div>
          <h2>Platform Admin Dashboard</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>System Integrity Hub</span>
        </div>
      </header>

      {/* Tabs list */}
      <div className={styles.tabsRow}>
        <button className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('overview')}>
          Platform Overview
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'vendors' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('vendors')}>
          Verify Vendors ({vendors.filter(v => v.status === 'pending').length})
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('products')}>
          Approve Products ({pendingProducts.length})
        </button>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Total Users</span>
              <div className={styles.metricVal}>{analytics?.summary?.totalUsers || '0'}</div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Total Vendors</span>
              <div className={styles.metricVal}>{analytics?.summary?.totalVendors || '0'}</div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Products Index</span>
              <div className={styles.metricVal}>{analytics?.summary?.totalProducts || '0'}</div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Total Orders</span>
              <div className={styles.metricVal}>{analytics?.summary?.totalOrders || '0'}</div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Commissions Income</span>
              <div className={styles.metricVal} style={{ color: 'var(--success)' }}>
                ${analytics?.summary?.platformCommission?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1.2rem' }}>Platform Commission Revenue (Last 30 Days)</h4>
            {analytics?.charts && (
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={analytics.charts}>
                  <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--card-border)' }} />
                  <Area type="monotone" dataKey="platformCommission" stroke="var(--success)" fill="rgba(16,185,129,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      {/* Vendors approval tab */}
      {activeTab === 'vendors' && (
        <div className={styles.tableCard}>
          <h4 style={{ fontSize: '1rem' }}>Vendor Store Verification Registry</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Store Details</th>
                <th>Tax ID</th>
                <th>KYC Documents</th>
                <th>Status</th>
                <th>Commission (%)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No vendor registrations found.</td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <strong>{v.storeName}</strong><br />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User ID: {v.userId}</span>
                    </td>
                    <td>{v.kycDocuments?.taxId}</td>
                    <td>
                      {v.kycDocuments?.businessLicense ? (
                        <a href={v.kycDocuments.businessLicense} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                          View License File
                        </a>
                      ) : 'None'}
                    </td>
                    <td>
                      <span className={`${styles.statusIndicator} ${styles[v.status]}`}>{v.status}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        className={styles.commissionInput}
                        defaultValue={v.commissionPercentage}
                        onBlur={(e) => handleUpdateCommission(v.userId, e.target.value)}
                      />%
                    </td>
                    <td>
                      {v.status === 'pending' && (
                        <>
                          <button className={`${styles.actionBtn} ${styles.btnApprove}`} onClick={() => handleApproveVendor(v.userId, 'approved')}>
                            Approve
                          </button>
                          <button className={`${styles.actionBtn} ${styles.btnReject}`} onClick={() => handleApproveVendor(v.userId, 'rejected')}>
                            Reject
                          </button>
                        </>
                      )}
                      {v.status === 'approved' && (
                        <button className={`${styles.actionBtn} ${styles.btnReject}`} onClick={() => handleApproveVendor(v.userId, 'suspended')}>
                          Suspend
                        </button>
                      )}
                      {v.status === 'suspended' && (
                        <button className={`${styles.actionBtn} ${styles.btnApprove}`} onClick={() => handleApproveVendor(v.userId, 'approved')}>
                          Unsuspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Products approvals tab */}
      {activeTab === 'products' && (
        <div className={styles.tableCard}>
          <h4 style={{ fontSize: '1rem' }}>Pending Product Catalog Listings</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Info</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Vendor ID</th>
                <th>Quality Verification</th>
              </tr>
            </thead>
            <tbody>
              {pendingProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products pending approval.</td>
                </tr>
              ) : (
                pendingProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.title}</strong><br />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description.substring(0, 50)}...</span>
                    </td>
                    <td>{p.brand}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>{p.vendorId}</td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.btnApprove}`} onClick={() => handleApproveProduct(p._id, 'active')}>
                        Approve
                      </button>
                      <button className={`${styles.actionBtn} ${styles.btnReject}`} onClick={() => handleApproveProduct(p._id, 'rejected')}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
