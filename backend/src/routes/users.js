const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validate, updateProfileSchema, changePasswordSchema } = require('../middleware/validation');
const { hashPassword } = require('../utils/bcrypt');

/**
 * GET /api/users/profile
 * Get own profile (protected)
 */
router.get('/profile', protect, (req, res) => {
  try {
    const user = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      college: req.user.college,
      regulation: req.user.regulation,
      created_at: req.user.created_at
    };

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.'
    });
  }
});

/**
 * PUT /api/users/profile
 * Update own profile
 */
router.put('/profile', protect, validate(updateProfileSchema), async (req, res) => {
  try {
    const { name, college } = req.body;

    const user = await User.updateProfile(req.user.id, {
      name,
      college
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
});

/**
 * PUT /api/users/password
 * Change password
 */
router.put('/password', protect, validate(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await User.verifyPassword(
      currentPassword,
      req.user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    await User.updatePassword(req.user.id, newPasswordHash);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.'
    });
  }
});

module.exports = router;