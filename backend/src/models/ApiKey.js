const db = require('../config/database');
const crypto = require('crypto');

class ApiKey {
  /**
   * Generate a new API key for a user
   * @param {number} userId - User ID
   * @param {string} keyName - Name/label for the key
   * @returns {Promise<Object>} Created API key record with the plain key (only shown once)
   */
  static async create(userId, keyName) {
    // Generate a random API key (64 hex characters)
    const apiKey = crypto.randomBytes(32).toString('hex');
    // Hash it for storage
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const [record] = await db('api_keys')
      .insert({
        user_id: userId,
        key_name: keyName,
        api_key: apiKeyHash,
        is_active: true,
        created_at: db.fn.now()
      })
      .returning(['id', 'user_id', 'key_name', 'is_active', 'created_at', 'expires_at']);

    // Return the plain API key along with the record (only time it's visible)
    return {
      ...record,
      api_key: apiKey // Plain key - show to user once
    };
  }

  /**
   * Find API key by plain key (for authentication)
   * @param {string} plainKey - The plain API key
   * @returns {Promise<Object|null>} API key record or null
   */
  static async findByKey(plainKey) {
    const hash = crypto.createHash('sha256').update(plainKey).digest('hex');

    const record = await db('api_keys')
      .where({ api_key: hash, is_active: true })
      .first();

    // Also check if expired
    if (record && record.expires_at && new Date(record.expires_at) < new Date()) {
      return null;
    }

    return record || null;
  }

  /**
   * Get all API keys for a user (without the actual key values)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of API key records
   */
  static async findAllByUser(userId) {
    return await db('api_keys')
      .where({ user_id: userId })
      .select('id', 'key_name', 'is_active', 'usage_count', 'last_used_at', 'created_at', 'expires_at')
      .orderBy('created_at', 'desc');
  }

  /**
   * Find API key by ID and user (for ownership verification)
   * @param {number} id - API key ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>}
   */
  static async findByIdAndUser(id, userId) {
    return await db('api_keys')
      .where({ id, user_id: userId })
      .first();
  }

  /**
   * Update API key (name, active status, expiration)
   * @param {number} id - API key ID
   * @param {number} userId - User ID (for ownership)
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated record or null
   */
  static async update(id, userId, updates) {
    const allowedFields = ['key_name', 'is_active', 'expires_at'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return null;
    }

    const [record] = await db('api_keys')
      .where({ id, user_id: userId })
      .update(updateData)
      .returning(['id', 'user_id', 'key_name', 'is_active', 'usage_count', 'last_used_at', 'created_at', 'expires_at']);

    return record || null;
  }

  /**
   * Increment usage count and update last used timestamp
   * @param {string} plainKey - The plain API key
   * @returns {Promise<void>}
   */
  static async incrementUsage(plainKey) {
    const hash = crypto.createHash('sha256').update(plainKey).digest('hex');

    await db('api_keys')
      .where({ api_key: hash })
      .update({
        usage_count: db.raw('usage_count + 1'),
        last_used_at: db.fn.now()
      });
  }

  /**
   * Delete (revoke) an API key
   * @param {number} id - API key ID
   * @param {number} userId - User ID (for ownership)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    const result = await db('api_keys')
      .where({ id, user_id: userId })
      .del();

    return result > 0;
  }

  /**
   * Get usage statistics for a user's API keys
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Stats object
   */
  static async getStats(userId) {
    const total = await db('api_keys')
      .where({ user_id: userId })
      .count('id as total')
      .first();

    const active = await db('api_keys')
      .where({ user_id: userId, is_active: true })
      .count('id as active')
      .first();

    const recentUsage = await db('api_keys')
      .where({ user_id: userId })
      .whereNotNull('last_used_at')
      .where('last_used_at', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .count('id as recent')
      .first();

    return {
      total: parseInt(total.total) || 0,
      active: parseInt(active.active) || 0,
      recentlyUsed: parseInt(recentUsage.recent) || 0
    };
  }
}

module.exports = ApiKey;
