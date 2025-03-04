// src/middlewares/errorHandler.js
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : 'unauthenticated'
  });

  // Get status code and message
  const statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal Server Error';

  // In production, don't expose error details for 500 errors
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    errorMessage = 'Internal Server Error';
  }

  // Database errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({ 
        field: e.path, 
        message: e.message 
      }))
    });
  }

  // Handle Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection error'
    });
  }

  // Authentication errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Handle rate limiting errors
  if (err.name === 'TooManyRequests') {
    return res.status(429).json({ 
      error: 'Too many requests', 
      message: err.message,
      retryAfter: err.retryAfter 
    });
  }

  // Return error response
  return res.status(statusCode).json({
    error: errorMessage,
    ...(err.data && { data: err.data })
  });
};

module.exports = errorHandler;
