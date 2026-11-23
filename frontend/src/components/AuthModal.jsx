/**
 * AuthModal Component
 * Provides clean tabbed Sign In and Register forms connected directly to the Express REST API.
 */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  selectAuthLoading,
  selectAuthError,
  selectRegisterSuccess,
  clearAuthError,
  clearRegisterSuccess
} from '../features/auth/authSlice.js';

const AuthModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const registerSuccess = useSelector(selectRegisterSuccess);

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [localFormError, setLocalFormError] = useState('');

  // Reset errors and fields on tab change
  useEffect(() => {
    dispatch(clearAuthError());
    setLocalFormError('');
  }, [activeTab, dispatch]);

  // When registration succeeds, switch to login tab with notice
  useEffect(() => {
    if (registerSuccess) {
      setActiveTab('login');
      setLoginEmail(regEmail);
      setRegName('');
      setRegPassword('');
    }
  }, [registerSuccess, regEmail]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalFormError('');

    if (!loginEmail.trim() || !loginPassword) {
      setLocalFormError('Please enter both email and password.');
      return;
    }

    const result = await dispatch(
      loginUser({ email: loginEmail.trim(), password: loginPassword })
    );

    if (loginUser.fulfilled.match(result)) {
      onClose();
      setLoginPassword('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalFormError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setLocalFormError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setLocalFormError('Password must be at least 6 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setLocalFormError('Please enter a valid email address.');
      return;
    }

    await dispatch(
      registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword
      })
    );
  };

  const handleClose = () => {
    dispatch(clearAuthError());
    dispatch(clearRegisterSuccess());
    setLocalFormError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-card auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="modal-header">
          <div className="auth-tab-buttons">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {registerSuccess && activeTab === 'login' && (
            <div className="alert alert-success">
              ✓ Registration successful! Please log in with your credentials.
            </div>
          )}

          {(error || localFormError) && (
            <div className="alert alert-error">
              {localFormError || error}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Password (min. 6 characters)</label>
                <input
                  id="reg-password"
                  type="password"
                  className="form-input"
                  placeholder="Choose a password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
