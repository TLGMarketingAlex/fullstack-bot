// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const logger = require('../utils/logger');
const redis = require('../services/redisService');

// Helper function to create custom error
const createRateLimitError = (req, res, options) => {
  logger.warn(`Rate limit exceeded for ${req.ip} on ${req.method} ${req.originalUrl}`);
  
  const error = new Error('Too many requests, please try again later.');
  error.name = 'TooManyRequests';
  error.statusCode = 429;
  error.retryAfter = Math.ceil(options.windowMs / 1000);
  
  return error;
};

// Configure options based on environment
let limiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    next(createRateLimitError(req, res, options));
  }
};

// Use Redis for rate limiting in production
if (process.env.NODE_ENV === 'production' && redis.client) {
  limiterOptions.store = new RedisStore({
    sendCommand: (...args) => redis.client.sendCommand(args),
    prefix: 'rate-limit:'
  });
  
  logger.info('Using Redis store for rate limiting');
} else {
  logger.info('Using memory store for rate limiting');
}

// Create rate limiter middleware
const rateLimiter = rateLimit(limiterOptions);

// More restrictive rate limiter for auth endpoints
const authLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10, // Limit each IP to 10 requests per window
  handler: (req, res, next, options) => {
    next(createRateLimitError(req, res, options));
  }
});

// More restrictive rate limiter for generation endpoints
const generationLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 requests per window
  handler: (req, res, next, options) => {
    next(createRateLimitError(req, res, options));
  }
});

module.exports = rateLimiter;
module.exports.authLimiter = authLimiter;
module.exports.generationLimiter = generationLimiter;
