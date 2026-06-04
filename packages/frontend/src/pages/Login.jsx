import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setCredentials } from '../redux/slices/authSlice';
import styles from './Login.module.css';

const Login = () => {
  const [view, setView] = useState('login'); // 'login', 'register', 'verify', 'forgot', 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tempCredentials, setTempCredentials] = useState(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (view === 'login') {
        const res = await axios.post('/api/auth/login', { email, password });
        const { user, token } = res.data;
        dispatch(setCredentials({ user, token }));
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'vendor') navigate('/vendor');
        else navigate('/');
      } else if (view === 'register') {
        const res = await axios.post('/api/auth/register', { email, password, role: 'customer' });
        const { user, token } = res.data;
        setTempCredentials({ user, token, name });
        setMessage('Registration successful! A welcome email with a 6-digit OTP verification code has been sent to your email.');
        setView('verify');
        setOtp('');
      } else if (view === 'verify') {
        const res = await axios.post('/api/auth/verify-email', { email, token: otp });
        const { user, token } = res.data;
        if (tempCredentials?.name) {
          try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('/api/users/profile', { name: tempCredentials.name }, config);
          } catch (err) {
            console.error("Failed to save registered name", err);
          }
        }
        dispatch(setCredentials({ user, token }));
        setMessage('Email verified successfully! Welcome to GLASS.');
        setTimeout(() => {
          if (user.role === 'admin') navigate('/admin');
          else if (user.role === 'vendor') navigate('/vendor');
          else navigate('/');
        }, 1500);
      } else if (view === 'forgot') {
        const res = await axios.post('/api/auth/forgot-password', { email });
        setMessage(res.data.message || 'OTP code sent to email!');
        setView('reset');
      } else if (view === 'reset') {
        await axios.post('/api/auth/reset-password', { token: otp, newPassword });
        setMessage('Password reset successful! You can now log in.');
        setView('login');
        setPassword('');
        setOtp('');
        setNewPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || 'An error occurred. Please try again.';
      setError(msg);
    }
  };

  const renderForm = () => {
    if (view === 'login') {
      return (
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

          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => {
                setView('forgot');
                setError('');
                setMessage('');
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Sign In
          </button>
        </form>
      );
    }

    if (view === 'register') {
      return (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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

          <button type="submit" className={styles.submitBtn}>
            Create Account
          </button>
        </form>
      );
    }

    if (view === 'forgot') {
      return (
        <form onSubmit={handleSubmit}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Enter your registered email address below, and we will send you a 6-digit OTP code to reset your password.
          </p>
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

          <button type="submit" className={styles.submitBtn}>
            Send Reset OTP
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => {
                setView('login');
                setError('');
                setMessage('');
              }}
            >
              Back to Login
            </button>
          </div>
        </form>
      );
    }

    if (view === 'reset') {
      return (
        <form onSubmit={handleSubmit}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            We have sent a 6-digit OTP code to your email. Enter the code and your new password below.
          </p>
          <div className={styles.formGroup}>
            <label className={styles.label}>6-Digit OTP Code</label>
            <input
              type="text"
              className={styles.input}
              required
              placeholder="e.g. 123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <input
              type="password"
              className={styles.input}
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            Reset Password
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => {
                setView('login');
                setError('');
                setMessage('');
              }}
            >
              Back to Login
            </button>
          </div>
        </form>
      );
    }

    if (view === 'verify') {
      return (
        <form onSubmit={handleSubmit}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            A welcome email with a 6-digit OTP code was sent to <strong>{email}</strong>. Enter the code below to verify and activate your account.
          </p>
          <div className={styles.formGroup}>
            <label className={styles.label}>Verification Code (6-Digit OTP)</label>
            <input
              type="text"
              className={styles.input}
              required
              placeholder="e.g. 123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            Verify Account
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className={styles.submitBtn}
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)' }}
              onClick={handleSkipVerification}
            >
              Skip Verification (Dev Mode)
            </button>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => {
                setView('login');
                setError('');
                setMessage('');
              }}
            >
              Back to Login
            </button>
          </div>
        </form>
      );
    }
  };

  const handleSkipVerification = async () => {
    if (tempCredentials) {
      const { user, token, name } = tempCredentials;
      if (name) {
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          await axios.put('/api/users/profile', { name }, config);
        } catch (err) {
          console.error("Failed to save registered name", err);
        }
      }
      dispatch(setCredentials({ user, token }));
      setMessage('Welcome! Logging you in (verification skipped)...');
      setTimeout(() => {
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'vendor') navigate('/vendor');
        else navigate('/');
      }, 1500);
    } else {
      setView('login');
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Join Us';
      case 'verify': return 'Verify Email';
      case 'forgot': return 'Forgot Password';
      case 'reset': return 'Reset Password';
      default: return 'Welcome';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{getTitle()}</h2>

        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>⚠️ {error}</div>}
        {message && <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>✓ {message}</div>}

        {renderForm()}

        {(view === 'login' || view === 'register') && (
          <p className={styles.toggleText}>
            {view === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button className={styles.toggleBtn} onClick={() => {
              setView(view === 'login' ? 'register' : 'login');
              setError('');
              setMessage('');
            }}>
              {view === 'login' ? 'Register Here' : 'Login Here'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
