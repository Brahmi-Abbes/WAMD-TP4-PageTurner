/**
 * Rate Limiting Middleware
 * Protects endpoints against brute-force and DoS attacks using express-rate-limit.
 */
const rateLimit = require('express-rate-limit');

// General API rate limiter: max 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true, // Draft-6 RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Avoid stacking on login endpoint so login has its own dedicated quota
  skip: (req) => {
    const url = req.originalUrl || req.url || '';
    return url.includes('/api/auth/login');
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes'
    });
  }
});

// Strict login rate limiter: max 5 requests in test, 50 in dev/production per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many login attempts from this IP. Please try again after 15 minutes'
    });
  }
});

module.exports = {
  generalLimiter,
  loginLimiter
};
