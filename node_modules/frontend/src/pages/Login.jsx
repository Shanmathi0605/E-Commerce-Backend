import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setCredentials } from '../redux/slices/authSlice';
import styles from './Login.module.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { email, password, role };

      const res = await axios.post(endpoint, payload);
      const { user, token } = res.data;

      // Dispatch details to Redux
      dispatch(setCredentials({ user, token }));

      // Redirect depending on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'vendor') {
        navigate('/vendor');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || 'An error occurred. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{isLogin ? 'Welcome Back' : 'Join Us'}</h2>

        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>⚠️ {error}</div>}
        {message && <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>✓ {message}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              required
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Join Platform As</label>
              <select
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">Customer (Buy Products)</option>
                <option value="vendor">Seller (Sell Products)</option>
              </select>
            </div>
          )}

          <button type="submit" className={styles.submitBtn}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button className={styles.toggleBtn} onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}>
            {isLogin ? 'Register Here' : 'Login Here'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
