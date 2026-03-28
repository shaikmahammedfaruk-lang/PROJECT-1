module.exports = {
  secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
    sameSite: 'lax', // 'lax' or 'strict'
    maxAge: 15 * 60 * 1000 // 15 minutes in milliseconds
  }
};