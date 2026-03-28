const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

/**
 * Middleware to authenticate requests using an API key
 * Expects the API key in the X-API-Key header
 * Usage: app.use('/api/protected', apiKeyAuth, router);
 */
async function apiKeyAuth(req, res, next) {
  try {
    const apiKeyHeader = req.headers['x-api-key'];

    if (!apiKeyHeader) {
      return res.status(401).json({
        success: false,
        message: 'API key required. Provide X-API-Key header.'
      });
    }

    // Find and validate the API key
    const apiKeyRecord = await ApiKey.findByKey(apiKeyHeader);

    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key.'
      });
    }

    // Load the user
    const user = await User.findById(apiKeyRecord.user_id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found for this API key.'
      });
    }

    // Increment usage count (async, don't wait)
    ApiKey.incrementUsage(apiKeyHeader).catch(err => {
      console.error('Failed to increment API key usage:', err);
    });

    // Attach user to request (similar to JWT auth)
    req.user = user;
    req.apiKey = apiKeyRecord;

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
}

module.exports = {
  apiKeyAuth
};
