// src/controllers/generationController.js
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { ContentGeneration, ContentItem, CreditAccount, User, Template } = require('../db/models');
const { queueService } = require('../services/queueService');
const { estimateGenerationCost } = require('../services/creditService');
const logger = require('../utils/logger');

// Create new content generation request
exports.createGenerationRequest = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { 
      title, 
      contentType = 'blog', 
      templateId, 
      promptData,
      aiProvider,
      isNewContent = true, 
      contentItemId
    } = req.body;

    // If updating existing content, verify content item exists and user owns it
    let contentItem = null;
    if (!isNewContent && contentItemId) {
      contentItem = await ContentItem.findOne({ 
        where: { 
          id: contentItemId,
          userId 
        } 
      });
      
      if (!contentItem) {
        return res.status(404).json({ error: 'Content item not found or access denied' });
      }
    }

    // Get template if specified
    let template = null;
    if (templateId) {
      template = await Template.findOne({
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

    // Check user's credit balance
    const creditAccount = await CreditAccount.findOne({ where: { userId } });
    if (!creditAccount) {
      return res.status(404).json({ error: 'Credit account not found' });
    }

    // Estimate the cost of this generation
    const estimatedCost = estimateGenerationCost(promptData, contentType);
    
    if (creditAccount.creditsRemaining < estimatedCost) {
      return res.status(402).json({ 
        error: 'Insufficient credits for this generation',
        required: estimatedCost,
        available: creditAccount.creditsRemaining
      });
    }

    // Create generation ID
    const generationId = uuidv4();

    // Create or update content item
    if (isNewContent) {
      contentItem = await ContentItem.create({
        id: uuidv4(),
        userId,
        templateId: template ? template.id : null,
        title: title || 'Untitled Content',
        contentType,
        status: 'draft',
        metadata: {
          generationRequest: true,
          generationId
        }
      });
    }

    // Create generation record
    const generation = await ContentGeneration.create({
      id: generationId,
      userId,
      contentItemId: contentItem.id,
      promptData: {
        ...promptData,
        contentType,
        templateId: template ? template.id : null
      },
      aiProvider: aiProvider || 'default',
      status: 'queued',
      estimatedCredits: estimatedCost
    });

    // Reserve credits
    creditAccount.creditsRemaining -= estimatedCost;
    await creditAccount.save();

    // Queue the generation job
    await queueService.enqueue('content-generation', {
      generationId: generation.id,
      userId,
      contentItemId: contentItem.id,
      promptData: generation.promptData,
      aiProvider: generation.aiProvider
    });

    res.status(202).json({
      message: 'Content generation request queued successfully',
      generationId: generation.id,
      contentItemId: contentItem.id,
      estimatedCost,
      status: 'queued'
    });
  } catch (error) {
    logger.error('Generation request error:', error);
    next(error);
  }
};

// Get generation request status
exports.getGenerationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find generation
    const generation = await ContentGeneration.findOne({
      where: { 
        id,
        userId
      },
      include: [
        {
          model: ContentItem,
          as: 'contentItem'
        }
      ]
    });
    
    if (!generation) {
      return res.status(404).json({ error: 'Generation request not found' });
    }

    res.status(200).json({
      generation: {
        id: generation.id,
        status: generation.status,
        createdAt: generation.createdAt,
        processingStartedAt: generation.processingStartedAt,
        completionTime: generation.completionTime,
        aiProvider: generation.aiProvider,
        contentItemId: generation.contentItemId,
        estimatedCredits: generation.estimatedCredits,
        creditsUsed: generation.creditsUsed,
        error: generation.error,
        contentItem: generation.contentItem ? {
          id: generation.contentItem.id,
          title: generation.contentItem.title,
          status: generation.contentItem.status
        } : null
      }
    });
  } catch (error) {
    logger.error('Get generation status error:', error);
    next(error);
  }
};

// Cancel generation request
exports.cancelGeneration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find generation
    const generation = await ContentGeneration.findOne({
      where: { 
        id,
        userId
      }
    });
    
    if (!generation) {
      return res.status(404).json({ error: 'Generation request not found' });
    }

    // Can only cancel if still in queued status
    if (generation.status !== 'queued') {
      return res.status(400).json({ 
        error: 'Cannot cancel generation that is already processing or completed'
      });
    }

    // Update generation status
    generation.status = 'failed';
    generation.error = 'Cancelled by user';
    await generation.save();

    // Refund credits
    const creditAccount = await CreditAccount.findOne({ where: { userId } });
    if (creditAccount) {
      creditAccount.creditsRemaining += generation.estimatedCredits;
      await creditAccount.save();
    }

    // Try to remove from queue (may not succeed if already picked up by worker)
    try {
      await queueService.removeFromQueue('content-generation', generation.id);
    } catch (error) {
      logger.warn('Failed to remove from queue, may already be processing:', error);
    }

    res.status(200).json({
      message: 'Generation request cancelled successfully',
      generationId: generation.id,
      creditsRefunded: generation.estimatedCredits
    });
  } catch (error) {
    logger.error('Cancel generation error:', error);
    next(error);
  }
};

// Get generation history for user
exports.getGenerationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    // Set up filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Find generations
    const { count, rows: generations } = await ContentGeneration.findAndCountAll({
      where: filter,
      include: [
        {
          model: ContentItem,
          as: 'contentItem',
          attributes: ['id', 'title', 'status', 'contentType']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      generations,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get generation history error:', error);
    next(error);
  }
};

// Regenerate content based on previous generation
exports.regenerateContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { promptUpdates } = req.body;

    // Find original generation
    const originalGeneration = await ContentGeneration.findOne({
      where: { 
        id,
        userId
      },
      include: [
        {
          model: ContentItem,
          as: 'contentItem'
        }
      ]
    });
    
    if (!originalGeneration) {
      return res.status(404).json({ error: 'Original generation request not found' });
    }

    // Check if the content item still exists
    if (!originalGeneration.contentItem) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    // Merge original prompt data with updates
    const updatedPromptData = {
      ...originalGeneration.promptData,
      ...promptUpdates
    };

    // Create a new generation request using the updated prompt
    req.body = {
      isNewContent: false,
      contentItemId: originalGeneration.contentItemId,
      promptData: updatedPromptData,
      aiProvider: originalGeneration.aiProvider,
      contentType: originalGeneration.contentItem.contentType
    };

    // Forward to createGenerationRequest handler
    return exports.createGenerationRequest(req, res, next);
  } catch (error) {
    logger.error('Regenerate content error:', error);
    next(error);
  }
};
