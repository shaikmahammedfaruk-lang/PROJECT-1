const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');
const { jwt: jwtConfig } = require('../config/jwt');

/**
 * POST /api/auth/register
 * Register a new student account
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, college, regulation } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      role: 'student', // Always student on registration
      college,
      regulation
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, jwtConfig.cookieOptions);

    // Return user data (without password)
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Welcome!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
        regulation: user.regulation
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and set JWT cookie
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, jwtConfig.cookieOptions);

    // Return user data
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
        regulation: user.regulation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Clear JWT cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', jwtConfig.cookieOptions);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', protect, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      college: req.user.college,
      regulation: req.user.regulation,
      created_at: req.user.created_at
    }
  });
});

module.exports = router;