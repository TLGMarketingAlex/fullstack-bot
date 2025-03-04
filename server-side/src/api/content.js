// src/api/content.js
const express = require('express');
const { body, query, param } = require('express-validator');
const contentController = require('../controllers/contentController');
const { authenticate, isEditor, isOwnerOrAdmin } = require('../middlewares/auth');
const { ContentItem } = require('../db/models');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Content management endpoints
 */

/**
 * @swagger
 * /content:
 *   get:
 *     summary: Get all content items for the current user
 *     tags: [Content]
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
 *           enum: [draft, generated, published, archived]
 *         description: Filter by content status
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [blog, product, social, email, custom]
 *         description: Filter by content type
 *     responses:
 *       200:
 *         description: List of content items
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['draft', 'generated', 'published', 'archived']),
    query('contentType').optional().isIn(['blog', 'product', 'social', 'email', 'custom'])
  ],
  contentController.getContentItems
);

/**
 * @swagger
 * /content/{id}:
 *   get:
 *     summary: Get a specific content item
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content item ID
 *     responses:
 *       200:
 *         description: Content item details
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid content item ID')
  ],
  isOwnerOrAdmin(ContentItem),
  contentController.getContentItem
);

/**
 * @swagger
 * /content:
 *   post:
 *     summary: Create a new content item
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - contentType
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [blog, product, social, email, custom]
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               format:
 *                 type: string
 *                 enum: [markdown, html, plain]
 *                 default: markdown
 *     responses:
 *       201:
 *         description: Content item created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('contentType').isIn(['blog', 'product', 'social', 'email', 'custom']).withMessage('Valid content type is required'),
    body('content').optional(),
    body('templateId').optional().isUUID().withMessage('Invalid template ID'),
    body('format').optional().isIn(['markdown', 'html', 'plain']).withMessage('Invalid format')
  ],
  contentController.createContentItem
);

/**
 * @swagger
 * /content/{id}:
 *   put:
 *     summary: Update a content item
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, generated, published, archived]
 *               format:
 *                 type: string
 *                 enum: [markdown, html, plain]
 *     responses:
 *       200:
 *         description: Content item updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid content item ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional(),
    body('status').optional().isIn(['draft', 'generated', 'published', 'archived']).withMessage('Invalid status'),
    body('format').optional().isIn(['markdown', 'html', 'plain']).withMessage('Invalid format')
  ],
  isOwnerOrAdmin(ContentItem),
  contentController.updateContentItem
);

/**
 * @swagger
 * /content/{id}:
 *   delete:
 *     summary: Delete a content item
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content item ID
 *     responses:
 *       200:
 *         description: Content item deleted
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid content item ID')
  ],
  isOwnerOrAdmin(ContentItem),
  contentController.deleteContentItem
);

/**
 * @swagger
 * /content/{id}/publish:
 *   post:
 *     summary: Publish content to an integration
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationId
 *             properties:
 *               integrationId:
 *                 type: string
 *                 format: uuid
 *               publishOptions:
 *                 type: object
 *     responses:
 *       202:
 *         description: Publishing job started
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:id/publish',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid content item ID'),
    body('integrationId').isUUID().withMessage('Valid integration ID is required'),
    body('publishOptions').optional().isObject().withMessage('Publish options must be an object')
  ],
  isOwnerOrAdmin(ContentItem),
  contentController.publishContent
);

/**
 * @swagger
 * /content/{id}/schedule:
 *   post:
 *     summary: Schedule content for publishing
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledAt
 *               - integrationId
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               integrationId:
 *                 type: string
 *                 format: uuid
 *               publishOptions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content scheduled for publishing
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:id/schedule',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid content item ID'),
    body('scheduledAt').isISO8601().withMessage('Valid date-time is required'),
    body('integrationId').isUUID().withMessage('Valid integration ID is required'),
    body('publishOptions').optional().isObject().withMessage('Publish options must be an object')
  ],
  isOwnerOrAdmin(ContentItem),
  contentController.scheduleContent
);

module.exports = router;
