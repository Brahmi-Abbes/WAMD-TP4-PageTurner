/**
 * Authentication Routes
 * Handles user registration, login, profile check, and OAuth flows.
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  register,
  login,
  getMe,
  googleCallback,
  verifyGoogleToken
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimitMiddleware');

// Public authentication routes
router.post('/register', register);
router.post('/login', loginLimiter, login);

// Protected user profile route
router.get('/me', authMiddleware, getMe);

// Google OAuth 2.0 Flow
// 1. Initiate Google authorization flow
router.get('/google', (req, res, next) => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  if (!clientID || clientID === 'your_google_client_id') {
    return res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.'
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })(req, res, next);
});

// 2. Google OAuth callback endpoint
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/api/auth/google/failure'
    })(req, res, next);
  },
  googleCallback
);

// 3. Google OAuth failure endpoint
router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: 'Google OAuth authentication failed or was cancelled.'
  });
});

// 4. Direct Google ID Token verification (For Postman, Mobile, or SPAs using Google Identity Services)
router.post('/google/verify-token', verifyGoogleToken);

module.exports = router;
