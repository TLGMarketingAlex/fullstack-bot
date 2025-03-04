// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../db/models');
const config = require('../config/auth');
const logger = require('../utils/logger');

// Authenticate user middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    jwt.verify(token, config.jwtSecret, async (err, decoded) => {
      if (err) {
        logger.warn('Invalid token:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Find user
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'User account is not active' });
      }

      // Add user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user has admin role
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Admin permissions required.' });
  }
};

// Check if user has editor or admin role
exports.isEditor = (req, res, next) => {
  if (req.user && (req.user.role === 'editor' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Editor permissions required.' });
  }
};

// Check if user owns the resource or is admin
exports.isOwnerOrAdmin = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      // If user is admin, allow access
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Find the resource
      const resource = await resourceModel.findByPk(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Check if user owns the resource
      if (resource.userId === req.user.id) {
        return next();
      }
      
      return res.status(403).json({ error: 'Access denied. You do not own this resource.' });
    } catch (error) {
      logger.error('isOwnerOrAdmin middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
