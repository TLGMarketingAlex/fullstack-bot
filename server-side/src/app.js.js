// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');

// Import routes
const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');
const contentRoutes = require('./api/content');
const generationRoutes = require('./api/generation');
const creditRoutes = require('./api/credits');
const adminRoutes = require('./api/admin');
const integrationRoutes = require('./api/integrations');

// Initialize Express app
const app = express();

// Apply global middlewares
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
