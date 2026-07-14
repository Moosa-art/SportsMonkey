import { useState } from 'react';
import { FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function SignupPage({ onSuccess, onSwitchToLogin }) {
  const { signup, loading, error } = useAuth();
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!form.username || !form.display_name || !form.email || !form.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const result = await signup(
      form.username,
      form.display_name,
      form.email,
      form.password
    );

    if (result.success) {
      onSuccess();
    } else {
      setLocalError(result.error || 'Signup failed. Please try again.');
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
        

      <div className="auth-card auth-signup-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <img src="/social442-logo.png" alt="" />
          </div>
          <h1 className="auth-logo-text">Social<span className="auth-accent">442</span></h1>
          <p className="auth-subtitle">Your Football Universe</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">Join the Game</h2>
          <p className="auth-description">Create your free account and connect with football fans</p>

          {(error || localError) && (
            <div className="auth-error-box">
              <span className="auth-error-icon">⚠️</span>
              {error || localError}
            </div>
          )}

          <div className="auth-form-row">
            <div className="auth-input-group">
              <label className="auth-label">Username</label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  type="text"
                  name="username"
                  placeholder="johnny442"
                  value={form.username}
                  onChange={handleChange}
                  disabled={loading}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  type="text"
                  name="display_name"
                  placeholder="John Smith"
                  value={form.display_name}
                  onChange={handleChange}
                  disabled={loading}
                  className="auth-input"
                />
              </div>
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
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

          <div className="auth-input-group">
            <label className="auth-label">Confirm Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className="auth-input"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <p className="auth-terms">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn auth-primary-btn"
          >
            {loading ? (
              <>
                <span className="auth-spinner"></span>
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <FiArrowRight size={18} />
              </>
            )}
          </button>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <button
            type="button"
            onClick={onSwitchToLogin}
            disabled={loading}
            className="auth-secondary-btn"
          >
            Sign In
          </button>
        </form>
      </div>

      <div className="signup-bg-img"><img src="/public/Football-Ground-Lights.jpg" alt="" /></div>
    </div>
  );
}
