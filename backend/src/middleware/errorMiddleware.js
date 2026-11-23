/**
 * Error Handling Middleware
 * Centralized, consistent JSON responses for 404 and unexpected errors.
 */

// 404 handler for unknown routes
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (never log sensitive user data)
  console.error(`[Error Handler] ${err.name || 'Error'}: ${err.message}`);

  // 1. Invalid JSON body syntax (e.g. malformed body in POST/PUT)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload received'
    });
  }

  // 2. Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource ID format: ${err.value}`
    });
  }

  // 3. Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details
    });
  }

  // 4. MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `Duplicate value for ${field}. An account with this ${field} already exists.`
    });
  }

  // 5. Default 500 error
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = {
  notFound,
  errorHandler
};
