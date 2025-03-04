// src/config/auth.js
require('dotenv').config();

module.exports = {
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  
  // Refresh token configuration
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_here',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // Password reset token expiration
  resetTokenExpiresIn: 60 * 60 * 1000, // 1 hour

  // Cookie configuration
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },

  // CORS configuration
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Password requirements
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,

  // Rate limiting for auth endpoints
  rateLimiting: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window per IP
      message: 'Too many login attempts, please try again after 15 minutes'
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registration attempts per window per IP
      message: 'Too many accounts created from this IP, please try again after an hour'
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 reset attempts per window per IP
      message: 'Too many password reset attempts, please try again after an hour'
    }
  }
};
