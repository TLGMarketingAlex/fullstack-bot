// src/controllers/contentController.js
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { ContentItem, Template, ContentGeneration } = require('../db/models');
const { queueService } = require('../services/queueService');
const logger = require('../utils/logger');

/**
 * Get all content items for the current user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getContentItems = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 10,
      status,
      contentType
    } = req.query;

    // Build filter
    const filter = { userId };
    if (status) filter.status = status;
    if (contentType) filter.contentType = contentType;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get content items
    const { count, rows: contentItems } = await ContentItem.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updatedAt', 'DESC']],
      include: [
        { 
          model: Template, 
          as: 'template',
          attributes: ['id', 'name']
        }
      ]
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / parseInt(limit));

    res.status(200).json({
      contentItems,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get content items error:', error);
    next(error);
  }
};

/**
 * Get a specific content item
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getContentItem = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Get content item with associated data
    const contentItem = await ContentItem.findOne({
      where: { id },
      include: [
        { 
          model: Template, 
          as: 'template',
          attributes: ['id', 'name', 'description', 'structure', 'promptTemplate']
        },
        {
          model: ContentGeneration,
          as: 'generations',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'status', 'creditsUsed', 'createdAt', 'completionTime']
        }
      ]
    });

    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    // Check if user owns the content (already handled by middleware, but double check)
    if (contentItem.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({ contentItem });
  } catch (error) {
    logger.error('Get content item error:', error);
    next(error);
  }
};

/**
 * Create a new content item
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.createContentItem = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { 
      title, 
      content, 
      contentType, 
      templateId,
      format = 'markdown'
    } = req.body;

    // Check if template exists if provided
    if (templateId) {
      const template = await Template.findOne({
        where: {
          id: templateId,
          $or: [
            { userId },
            { isPublic: true },
            { isSystem: true }
          ]
        }
      });
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found or access denied' });
      }
    }

    // Create content item
    const contentItem = await ContentItem.create({
      id: uuidv4(),
      userId,
      title,
      content: content || '',
      contentType,
      templateId,
      format,
      status: 'draft',
      wordCount: content ? content.split(/\s+/).filter(Boolean).length : 0,
      metadata: {
        createdManually: true,
        createdAt: new Date().toISOString()
      }
    });

    res.status(201).json({
      message: 'Content item created successfully',
      contentItem
    });
  } catch (error) {
    logger.error('Create content item error:', error);
    next(error);
  }
};

/**
 * Update a content item
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.updateContentItem = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, status, format } = req.body;

    // Find the content item
    const contentItem = await ContentItem.findByPk(id);

    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    // Check if user owns the content (already handled by middleware, but double check)
    if (contentItem.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update content item
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) {
      updateData.content = content;
      updateData.wordCount = content.split(/\s+/).filter(Boolean).length;
    }
    if (status !== undefined) updateData.status = status;
    if (format !== undefined) updateData.format = format;

    // Update metadata
    updateData.metadata = {
      ...contentItem.metadata,
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: userId
    };

    // Special handling for published status
    if (status === 'published' && contentItem.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    await contentItem.update(updateData);

    res.status(200).json({
      message: 'Content item updated successfully',
      contentItem: {
        ...contentItem.toJSON(),
        ...updateData
      }
    });
  } catch (error) {
    logger.error('Update content item error:', error);
    next(error);
  }
};

/**
 * Delete a content item
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.deleteContentItem = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Find the content item
    const contentItem = await ContentItem.findByPk(id);

    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    // Check if user owns the content (already handled by middleware, but double check)
    if (contentItem.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete content item
    await contentItem.destroy();

    res.status(200).json({
      message: 'Content item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete content item error:', error);
    next(error);
  }
};

/**
 * Publish content to an integration
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.publishContent = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { integrationId, publishOptions = {} } = req.body;

    // Find the content item
    const contentItem = await ContentItem.findByPk(id);

    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    // Check if user owns the content (already handled by middleware, but double check)
    if (contentItem.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if content is ready to publish
    if (contentItem.status !== 'generated' && contentItem.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Content must be in generated or draft status to publish' 
      });
    }

    // Queue publishing job
    const publishingJobId = uuidv4();
    
    await queueService.enqueue('content-publishing', {
      id: publishingJobId,
      contentItemId: id,
      userId,
      integrationId,
      publishOptions
    });

    // Update content item status
    await contentItem.update({
      status: 'published',
      publishedAt: new Date(),
      metadata: {
        ...contentItem.metadata,
        publishingJobId,
        publishedBy: userId,
        publishedAt: new Date().toISOString(),
        integrationId
      }
    });

    res.status(202).json({
      message: 'Content publishing job started',
      publishingJobId,
      contentItemId: id
    });
  } catch (error) {
    logger.error('Publish content error:', error);
    next(error);
  }
};

/**
 * Schedule content for publishing
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.scheduleContent = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { scheduledAt, integrationId, publishOptions = {} } = req.body;

    // Find the content item
    const contentItem = await ContentItem.findByPk(id);

    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    // Check if user owns the content (already handled by middleware, but double check)
    if (contentItem.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if content is ready to schedule
    if (contentItem.status !== 'generated' && contentItem.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Content must be in generated or draft status to schedule' 
      });
    }

    // Check if scheduled date is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ 
        error: 'Scheduled date must be in the future' 
      });
    }

    // Update content item with scheduling info
    await contentItem.update({
      scheduledAt: scheduledDate,
      metadata: {
        ...contentItem.metadata,
        scheduledBy: userId,
        scheduledAt: scheduledDate.toISOString(),
        integrationId,
        publishOptions
      }
    });

    // Queue scheduling job
    const schedulingJobId = uuidv4();
    
    await queueService.enqueue('content-scheduling', {
      id: schedulingJobId,
      contentItemId: id,
      userId,
      integrationId,
      scheduledAt,
      publishOptions
    });

    res.status(200).json({
      message: 'Content scheduled for publishing',
      schedulingJobId,
      contentItemId: id,
      scheduledAt
    });
  } catch (error) {
    logger.error('Schedule content error:', error);
    next(error);
  }
};
