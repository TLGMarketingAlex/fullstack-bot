// src/api/generation.js
const express = require('express');
const { body, query, param } = require('express-validator');
const generationController = require('../controllers/generationController');
const { authenticate, isOwnerOrAdmin } = require('../middlewares/auth');
const { ContentGeneration } = require('../db/models');
const { generationLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Generation
 *   description: AI content generation endpoints
 */

/**
 * @swagger
 * /generation:
 *   post:
 *     summary: Request new content generation
 *     tags: [Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - promptData
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title for the content (required for new content)
 *               contentType:
 *                 type: string
 *                 enum: [blog, product, social, email, custom]
 *                 default: blog
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: Template to use for generation
 *               promptData:
 *                 type: object
 *                 description: Generation parameters
 *               aiProvider:
 *                 type: string
 *                 description: AI provider to use
 *               isNewContent:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to create a new content item
 *               contentItemId:
 *                 type: string
 *                 format: uuid
 *                 description: Existing content item ID (required if isNewContent is false)
 *     responses:
 *       202:
 *         description: Generation request queued
 *       400:
 *         description: Invalid input
 *       402:
 *         description: Insufficient credits
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  generationLimiter,
  [
    body('promptData').isObject().withMessage('Prompt data is required'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('contentType').optional().isIn(['blog', 'product', 'social', 'email', 'custom']).withMessage('Invalid content type'),
    body('templateId').optional().isUUID().withMessage('Invalid template ID'),
    body('aiProvider').optional().isString().withMessage('AI provider must be a string'),
    body('isNewContent').optional().isBoolean().withMessage('isNewContent must be a boolean'),
    body('contentItemId').optional().isUUID().withMessage('Invalid content item ID')
  ],
  generationController.createGenerationRequest
);

/**
 * @swagger
 * /generation/{id}:
 *   get:
 *     summary: Get generation request status
 *     tags: [Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Generation request ID
 *     responses:
 *       200:
 *         description: Generation status
 *       404:
 *         description: Generation request not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid generation ID')
  ],
  isOwnerOrAdmin(ContentGeneration),
  generationController.getGenerationStatus
);

/**
 * @swagger
 * /generation/{id}/cancel:
 *   post:
 *     summary: Cancel a generation request
 *     tags: [Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Generation request ID
 *     responses:
 *       200:
 *         description: Generation request cancelled
 *       400:
 *         description: Cannot cancel generation that is already processing or completed
 *       404:
 *         description: Generation request not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/cancel',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid generation ID')
  ],
  isOwnerOrAdmin(ContentGeneration),
  generationController.cancelGeneration
);

/**
 * @swagger
 * /generation/history:
 *   get:
 *     summary: Get generation history
 *     tags: [Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [queued, processing, completed, failed]
 *         description: Filter by generation status
 *     responses:
 *       200:
 *         description: List of generation requests
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/history',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['queued', 'processing', 'completed', 'failed'])
  ],
  generationController.getGenerationHistory
);

/**
 * @swagger
 * /generation/{id}/regenerate:
 *   post:
 *     summary: Regenerate content based on previous generation
 *     tags: [Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Original generation request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               promptUpdates:
 *                 type: object
 *                 description: Updates to the original prompt data
 *     responses:
 *       202:
 *         description: Generation request queued
 *       400:
 *         description: Invalid input
 *       402:
 *         description: Insufficient credits
 *       404:
 *         description: Original generation not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/regenerate',
  authenticate,
  generationLimiter,
  [
    param('id').isUUID().withMessage('Invalid generation ID'),
    body('promptUpdates').optional().isObject().withMessage('Prompt updates must be an object')
  ],
  isOwnerOrAdmin(ContentGeneration),
  generationController.regenerateContent
);

module.exports = router;
