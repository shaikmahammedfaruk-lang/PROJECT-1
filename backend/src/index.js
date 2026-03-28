require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// Database disabled - re-enable when PostgreSQL is configured
// const db = require('./config/database');
const { jwt: jwtConfig } = require('./config/jwt');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const apiKeyRoutes = require('./routes/api-keys');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true // Allow cookies
}));

// Rate limiting for login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EASY WORLD API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/apikeys', apiKeyRoutes);

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack || err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum size is 10MB.'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field.'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Seed admin user function
async function seedAdminUser() {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@easyworld.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

    const { hashPassword } = require('./utils/bcrypt');
    const User = require('./models/User');

    // Check if admin already exists
    const existingAdmin = await User.findByEmail(adminEmail);
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
      return;
    }

    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      name: 'Administrator',
      role: 'admin',
      college: 'Admin Office',
      regulation: 'N/A'
    });

    console.log('Admin user created:', admin.email);
  } catch (error) {
    console.error('Failed to seed admin user:', error);
  }
}

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Note: Database operations are disabled. To enable, install PostgreSQL and set DB credentials in .env`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;