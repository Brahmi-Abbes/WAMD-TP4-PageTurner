/**
 * Authentication Controller
 * Handles user registration, local JWT login, and Google OAuth 2.0 token exchange.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Helper function to generate PageTurner JWT
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'pageturner_default_secret_key_change_in_prod';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name
    },
    secret,
    { expiresIn }
  );
};

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // 3. Enforce minimum password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // 4. Reject duplicate email
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists'
      });
    }

    // 5. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 6. Create user record
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      passwordHash
    });

    // 7. Return success response (never return passwordHash)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Authenticate user & return JWT
 * @route  POST /api/auth/login
 * @access Public (Rate limited to 5 attempts / 15 mins)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 2. Find user by email
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 3. Verify user has passwordHash (accounts created exclusively via OAuth have no password)
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'This account was created with Google sign-in. Please log in using Google OAuth.'
      });
    }

    // 4. Compare candidate password with hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 5. Generate application JWT
    const token = generateToken(user);

    // 6. Return response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Return currently authenticated user
 * @route  GET /api/auth/me
 * @access Private (JWT required)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Handle Google OAuth callback redirect
 * @route  GET /api/auth/google/callback
 * @access Public (Google redirects here)
 */
const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Google authentication failed'
      });
    }

    // Issue our application's own JWT token for the authenticated Google user
    const token = generateToken(req.user);

    // If client requested a redirect to frontend
    if (req.query.redirect) {
      return res.redirect(`${req.query.redirect}?token=${token}`);
    }

    // Default JSON response (ideal for API testing and Postman)
    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error completing Google authentication'
    });
  }
};

/**
 * @desc   Verify Google ID token directly (Postman & Mobile/SPA flow)
 * @route  POST /api/auth/google/verify-token
 * @access Public
 */
const verifyGoogleToken = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an idToken in request body'
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_client_id') {
      return res.status(500).json({
        success: false,
        error: 'GOOGLE_CLIENT_ID is not configured in server environment'
      });
    }

    const client = new OAuth2Client(clientId);

    // Cryptographically verify Google ID token with Google's public keys
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token payload'
      });
    }

    // Ensure email is verified by Google
    if (!payload.email_verified) {
      return res.status(401).json({
        success: false,
        error: 'Google email address is not verified'
      });
    }

    // Find or create user in MongoDB
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email: payload.email });
      if (user) {
        user.googleId = payload.sub;
        if (!user.avatar && payload.picture) {
          user.avatar = payload.picture;
        }
        await user.save();
      } else {
        user = await User.create({
          name: payload.name || 'Google User',
          email: payload.email,
          googleId: payload.sub,
          avatar: payload.picture || ''
        });
      }
    }

    // Issue PageTurner application JWT
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Google ID token verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: `Failed to verify Google token: ${error.message}`
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleCallback,
  verifyGoogleToken
};
