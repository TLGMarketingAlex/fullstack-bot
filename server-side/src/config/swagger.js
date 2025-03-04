// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Content Platform API',
      version: '1.0.0',
      description: 'API documentation for AI Content Platform',
      license: {
        name: 'Proprietary',
        url: 'https://your-domain.com/terms',
      },
      contact: {
        name: 'API Support',
        url: 'https://your-domain.com/support',
        email: 'support@your-domain.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.your-domain.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            role: {
              type: 'string',
              enum: ['admin', 'editor', 'user'],
              description: 'User role',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: 'User account status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        ContentItem: {
          type: 'object',
          required: ['title', 'contentType'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Content item ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID of the owner',
            },
            templateId: {
              type: 'string',
              format: 'uuid',
              description: 'Template ID used for this content',
            },
            title: {
              type: 'string',
              description: 'Content title',
            },
            content: {
              type: 'string',
              description: 'Content body',
            },
            contentType: {
              type: 'string',
              enum: ['blog', 'product', 'social', 'email', 'custom'],
              description: 'Type of content',
            },
            status: {
              type: 'string',
              enum: ['draft', 'generated', 'published', 'archived'],
              description: 'Content status',
            },
            format: {
              type: 'string',
              enum: ['markdown', 'html', 'plain'],
              description: 'Content format',
            },
            wordCount: {
              type: 'integer',
              description: 'Word count',
            },
            publishedUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL where this content is published',
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the content was published',
            },
            scheduledAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the content is scheduled to be published',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        ContentGeneration: {
          type: 'object',
          required: ['promptData'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Generation request ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID of the owner',
            },
            contentItemId: {
              type: 'string',
              format: 'uuid',
              description: 'Content item ID',
            },
            promptData: {
              type: 'object',
              description: 'Generation parameters and prompt data',
            },
            aiProvider: {
              type: 'string',
              description: 'AI provider used',
            },
            aiModel: {
              type: 'string',
              description: 'AI model used',
            },
            status: {
              type: 'string',
              enum: ['queued', 'processing', 'completed', 'failed'],
              description: 'Generation status',
            },
            creditsUsed: {
              type: 'integer',
              description: 'Number of credits used',
            },
            estimatedCredits: {
              type: 'integer',
              description: 'Estimated credit usage',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            completionTime: {
              type: 'string',
              format: 'date-time',
              description: 'When generation completed',
            },
          },
        },
        Template: {
          type: 'object',
          required: ['name', 'contentType'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Template ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID of the owner',
            },
            name: {
              type: 'string',
              description: 'Template name',
            },
            description: {
              type: 'string',
              description: 'Template description',
            },
            contentType: {
              type: 'string',
              enum: ['blog', 'product', 'social', 'email', 'custom'],
              description: 'Type of content',
            },
            structure: {
              type: 'array',
              description: 'Template structure as an array of content blocks',
              items: {
                type: 'object',
              },
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether this template is public',
            },
            isSystem: {
              type: 'boolean',
              description: 'Whether this is a system template',
            },
          },
        },
        CreditAccount: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Credit account ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID of the owner',
            },
            planType: {
              type: 'string',
              enum: ['basic', 'pro', 'enterprise', 'custom'],
              description: 'Subscription plan type',
            },
            creditsRemaining: {
              type: 'integer',
              description: 'Number of credits remaining',
            },
            creditsUsed: {
              type: 'integer',
              description: 'Number of credits used',
            },
            monthlyAllowance: {
              type: 'integer',
              description: 'Monthly credit allowance',
            },
            renewalDate: {
              type: 'string',
              format: 'date-time',
              description: 'When credits will next renew',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            status: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/api/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;

// src/api/auth.js (with Swagger annotations)
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */

// src/api/content.js (with Swagger annotations)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contentItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentItem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contentItem:
 *                   $ref: '#/components/schemas/ContentItem'
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 */

// src/api/generation.js (with Swagger annotations)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 generationId:
 *                   type: string
 *                   format: uuid
 *                 contentItemId:
 *                   type: string
 *                   format: uuid
 *                 estimatedCost:
 *                   type: integer
 *                 status:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       402:
 *         description: Insufficient credits
 *       401:
 *         description: Unauthorized
 */

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 generation:
 *                   $ref: '#/components/schemas/ContentGeneration'
 *       404:
 *         description: Generation request not found
 *       401:
 *         description: Unauthorized
 */
