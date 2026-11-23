/**
 * Express Application Configuration
 * Configures middleware, security, routes, and error handlers.
 */
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const configurePassport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

// Import middleware
const { generalLimiter } = require('./middleware/rateLimitMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// 1. Initialize Passport OAuth strategies
configurePassport();
app.use(passport.initialize());

// 2. CORS configuration (allows React frontend origin)
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      const allowed = [
        allowedOrigin,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000'
      ];
      if (allowed.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Body parser middleware (parses incoming JSON payloads)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PageTurner Backend API is healthy and operational',
    timestamp: new Date().toISOString()
  });
});

// 5. Apply general rate limiter to API routes (100 req / 15 min)
app.use('/api', generalLimiter);

// 6. Mount API route modules
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// 7. 404 Handler for undefined routes
app.use(notFound);

// 8. Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
