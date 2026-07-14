import { useState } from 'react';
import { FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage({ onSuccess, onSwitchToSignup }) {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      onSuccess();
    } else {
      setLocalError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="overlay_bg_top"><img src="/public/club_top_bg_new.png"></img></div>
      <div className="auth-background">
        <div className="auth-gradient-blob auth-blob-1"></div>
        <div className="auth-gradient-blob auth-blob-2"></div>
        <div className="auth-gradient-blob auth-blob-3"></div>
      </div>

      <div className="auth-card auth-login-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <img src="/social442-logo.png" alt="" />
          </div>
          <h1 className="auth-logo-text">Social<span className="auth-accent">442</span></h1>
          <p className="auth-subtitle">Your Football Universe</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-description">Sign in to your account and discover great content</p>

          {(error || localError) && (
            <div className="auth-error-box">
              <span className="auth-error-icon">⚠️</span>
              {error || localError}
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="auth-input"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn auth-primary-btn"
          >
            {loading ? (
              <>
                <span className="auth-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <FiArrowRight size={18} />
              </>
            )}
          </button>

          <div className="auth-divider">
            <span>New to Social442?</span>
          </div>

          <button
            type="button"
            onClick={onSwitchToSignup}
            disabled={loading}
            className="auth-secondary-btn"
          >
            Create Account
          </button>
        </form>

        <p className="auth-footer-text">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

<div className="signup-bg-img"><img src="/public/football-Ground.jpg" alt="" /></div>
      
    </div>
  );
}
