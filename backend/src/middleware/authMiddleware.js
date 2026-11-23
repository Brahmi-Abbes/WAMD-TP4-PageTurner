/**
 * JWT Authentication Middleware
 * Protects endpoints by verifying the Bearer token in Authorization header.
 */
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header is present
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No authorization header provided.'
    });
  }

  // 2. Expect "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Authorization format must be: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    // 3. Verify token using JWT_SECRET from environment
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pageturner_default_secret_key_change_in_prod');

    // 4. Attach decoded payload (user ID, email, name) to request object
    req.user = decoded;

    // 5. Proceed to the next middleware or controller
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Authentication failed.'
    });
  }
};

module.exports = authMiddleware;
