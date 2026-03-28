const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/jwt');
const User = require('../models/User');

/**
 * Middleware to protect routes - requires valid JWT token in cookies
 */
async function protect(req, res, next) {
  try {
    // Get token from cookies
    const token = req.cookies ? req.cookies.token : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
}

/**
 * Middleware to restrict access to admin users only
 */
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin privileges required.'
  });
}

module.exports = {
  protect,
  adminOnly
};