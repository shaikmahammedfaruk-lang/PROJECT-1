const express = require('express');
const router = express.Router();
const ApiKey = require('../models/ApiKey');
const { protect } = require('../middleware/auth');

/**
 * GET /api/apikeys
 * Get all API keys for the authenticated user
 */
router.get('/', protect, async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAllByUser(req.user.id);
    return res.status(200).json({
      success: true,
      apiKeys
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys.'
    });
  }
});

/**
 * POST /api/apikeys
 * Create a new API key for the authenticated user
 */
router.post('/', protect, async (req, res) => {
  try {
    const { keyName } = req.body;

    if (!keyName || keyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Key name is required.'
      });
    }

    const apiKey = await ApiKey.create(req.user.id, keyName.trim());

    // Return the key with the plain API key visible (only time it's shown)
    return res.status(201).json({
      success: true,
      message: 'API key created successfully. Save this key securely - it won\'t be shown again.',
      apiKey
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create API key.'
    });
  }
});

/**
 * GET /api/apikeys/stats
 * Get API key usage statistics for the user
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await ApiKey.getStats(req.user.id);
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get API key stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch API key statistics.'
    });
  }
});

/**
 * PUT /api/apikeys/:id
 * Update an API key (name, active status, expiration)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { keyName, isActive, expiresAt } = req.body;

    const updates = {};
    if (keyName !== undefined) {
      if (!keyName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Key name cannot be empty.'
        });
      }
      updates.key_name = keyName.trim();
    }
    if (isActive !== undefined) {
      updates.is_active = Boolean(isActive);
    }
    if (expiresAt !== undefined) {
      updates.expires_at = expiresAt ? new Date(expiresAt) : null;
    }

    const apiKey = await ApiKey.update(id, req.user.id, updates);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found or you don\'t have permission to update it.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'API key updated successfully.',
      apiKey
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update API key.'
    });
  }
});

/**
 * DELETE /api/apikeys/:id
 * Revoke (delete) an API key
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ApiKey.delete(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'API key not found or you don\'t have permission to delete it.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully.'
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke API key.'
    });
  }
});

module.exports = router;
