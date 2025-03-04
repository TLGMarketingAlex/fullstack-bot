// src/services/integrations/wordpressService.js
const axios = require('axios');
const { marked } = require('marked');
const logger = require('../../utils/logger');
const { Integration } = require('../../db/models');

class WordPressService {
  /**
   * Initialize WordPress API service
   * @param {object} integration - Integration record from database
   */
  constructor(integration) {
    if (!integration || integration.type !== 'wordpress') {
      throw new Error('Invalid WordPress integration');
    }
    
    this.integration = integration;
    this.baseUrl = this.integration.config.baseUrl;
    this.credentials = this.integration.credentials;
    
    // Initialize API client
    this.client = axios.create({
      baseURL: `${this.baseUrl}/wp-json/wp/v2`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add authentication
    if (this.credentials.username && this.credentials.password) {
      // Basic auth
      const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
      this.client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    } else if (this.credentials.consumerKey && this.credentials.consumerSecret) {
      // OAuth 1.0a (for WordPress REST API authentication)
      // Implementation would require OAuth library
      logger.warn('OAuth authentication for WordPress not implemented');
    } else if (this.credentials.applicationPassword) {
      // WordPress application password
      const auth = Buffer.from(`${this.credentials.username}:${this.credentials.applicationPassword}`).toString('base64');
      this.client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    } else if (this.credentials.jwt) {
      // JWT token (for WP plugins that support JWT auth)
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.credentials.jwt}`;
    } else {
      throw new Error('No valid authentication method provided for WordPress');
    }
  }
  
  /**
   * Test the connection to WordPress
   * @returns {Promise<boolean>} Connection successful
   */
  async testConnection() {
    try {
      const response = await this.client.get('/');
      
      logger.info('WordPress connection test successful', {
        integrationId: this.integration.id,
        wordpressVersion: response.data?.namespaces && response.data.namespaces[0]
      });
      
      return true;
    } catch (error) {
      logger.error('WordPress connection test failed', {
        integrationId: this.integration.id,
        error: error.message,
        response: error.response?.data
      });
      
      return false;
    }
  }
  
  /**
   * Get WordPress categories
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    try {
      const response = await this.client.get('/categories', {
        params: {
          per_page: 100
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get WordPress categories', {
        integrationId: this.integration.id,
        error: error.message
      });
      
      throw new Error(`Failed to get WordPress categories: ${error.message}`);
    }
  }
  
  /**
   * Get WordPress tags
   * @returns {Promise<Array>} Tags
   */
  async getTags() {
    try {
      const response = await this.client.get('/tags', {
        params: {
          per_page: 100
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get WordPress tags', {
        integrationId: this.integration.id,
        error: error.message
      });
      
      throw new Error(`Failed to get WordPress tags: ${error.message}`);
    }
  }
  
  /**
   * Get WordPress users
   * @returns {Promise<Array>} Users
   */
  async getUsers() {
    try {
      const response = await this.client.get('/users', {
        params: {
          per_page: 100
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get WordPress users', {
        integrationId: this.integration.id,
        error: error.message
      });
      
      throw new Error(`Failed to get WordPress users: ${error.message}`);
    }
  }
  
  /**
   * Create a new post in WordPress
   * @param {object} contentItem - Content item to publish
   * @param {object} options - Publishing options
   * @returns {Promise<object>} Published post data
   */
  async createPost(contentItem, options = {}) {
    try {
      // Prepare post data
      const {
        status = 'draft',
        categoryIds = [],
        tagIds = [],
        authorId,
        featuredMediaId,
        excerpt,
        allowComments = true
      } = options;
      
      // Convert markdown to HTML if needed
      let content = contentItem.content;
      if (contentItem.format === 'markdown') {
        content = marked(content);
      }
      
      const postData = {
        title: contentItem.title,
        content,
        status,
        categories: categoryIds,
        tags: tagIds,
        excerpt: excerpt || '',
        comment_status: allowComments ? 'open' : 'closed'
      };
      
      // Add author if specified
      if (authorId) {
        postData.author = authorId;
      }
      
      // Add featured media if specified
      if (featuredMediaId) {
        postData.featured_media = featuredMediaId;
      }
      
      // Create post
      const response = await this.client.post('/posts', postData);
      
      logger.info('WordPress post created successfully', {
        integrationId: this.integration.id,
        contentItemId: contentItem.id,
        wordpressPostId: response.data.id,
        status
      });
      
      return {
        id: response.data.id,
        url: response.data.link,
        status: response.data.status,
        date: response.data.date
      };
    } catch (error) {
      logger.error('Failed to create WordPress post', {
        integrationId: this.integration.id,
        contentItemId: contentItem.id,
        error: error.message,
        response: error.response?.data
      });
      
      throw new Error(`Failed to create WordPress post: ${error.message}`);
    }
  }
  
  /**
   * Update an existing post in WordPress
   * @param {number} postId - WordPress post ID
   * @param {object} contentItem - Content item with updates
   * @param {object} options - Publishing options
   * @returns {Promise<object>} Updated post data
   */
  async updatePost(postId, contentItem, options = {}) {
    try {
      // Prepare update data
      const {
        status,
        categoryIds,
        tagIds,
        authorId,
        featuredMediaId,
        excerpt,
        allowComments
      } = options;
      
      // Convert markdown to HTML if needed
      let content = contentItem.content;
      if (contentItem.format === 'markdown') {
        content = marked(content);
      }
      
      const updateData = {
        title: contentItem.title,
        content
      };
      
      // Add optional fields if specified
      if (status) updateData.status = status;
      if (categoryIds) updateData.categories = categoryIds;
      if (tagIds) updateData.tags = tagIds;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (authorId) updateData.author = authorId;
      if (featuredMediaId) updateData.featured_media = featuredMediaId;
      if (allowComments !== undefined) updateData.comment_status = allowComments ? 'open' : 'closed';
      
      // Update post
      const response = await this.client.put(`/posts/${postId}`, updateData);
      
      logger.info('WordPress post updated successfully', {
        integrationId: this.integration.id,
        contentItemId: contentItem.id,
        wordpressPostId: postId,
        status: response.data.status
      });
      
      return {
        id: response.data.id,
        url: response.data.link,
        status: response.data.status,
        date: response.data.modified
      };
    } catch (error) {
      logger.error('Failed to update WordPress post', {
        integrationId: this.integration.id,
        contentItemId: contentItem.id,
        wordpressPostId: postId,
        error: error.message,
        response: error.response?.data
      });
      
      throw new Error(`Failed to update WordPress post: ${error.message}`);
    }
  }
  
  /**
   * Delete a post from WordPress
   * @param {number} postId - WordPress post ID
   * @param {boolean} force - Force delete (skip trash)
   * @returns {Promise<boolean>} Deletion successful
   */
  async deletePost(postId, force = false) {
    try {
      await this.client.delete(`/posts/${postId}`, {
        params: { force }
      });
      
      logger.info('WordPress post deleted successfully', {
        integrationId: this.integration.id,
        wordpressPostId: postId,
        force
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete WordPress post', {
        integrationId: this.integration.id,
        wordpressPostId: postId,
        error: error.message
      });
      
      throw new Error(`Failed to delete WordPress post: ${error.message}`);
    }
  }
  
  /**
   * Upload media to WordPress
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} filename - File name
   * @param {string} mimeType - File MIME type
   * @returns {Promise<object>} Uploaded media data
   */
  async uploadMedia(fileBuffer, filename, mimeType) {
    try {
      // WordPress REST API requires a different content type for media uploads
      const response = await this.client.post('/media', fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
      
      logger.info('WordPress media uploaded successfully', {
        integrationId: this.integration.id,
        mediaId: response.data.id,
        filename
      });
      
      return {
        id: response.data.id,
        url: response.data.source_url,
        title: response.data.title.rendered
      };
    } catch (error) {
      logger.error('Failed to upload media to WordPress', {
        integrationId: this.integration.id,
        filename,
        error: error.message
      });
      
      throw new Error(`Failed to upload media to WordPress: ${error.message}`);
    }
  }
}

/**
 * Get WordPress integration for a user
 * @param {string} userId - User ID
 * @param {string} integrationId - Integration ID (optional)
 * @returns {Promise<WordPressService>} WordPress service instance
 */
async function getWordPressIntegration(userId, integrationId = null) {
  try {
    // Find the integration
    const query = {
      userId,
      type: 'wordpress',
      status: 'active'
    };
    
    // If integration ID is provided, add it to the query
    if (integrationId) {
      query.id = integrationId;
    }
    
    const integration = await Integration.findOne({ where: query });
    
    if (!integration) {
      throw new Error('WordPress integration not found');
    }
    
    return new WordPressService(integration);
  } catch (error) {
    logger.error('Failed to get WordPress integration', {
      userId,
      integrationId,
      error: error.message
    });
    
    throw new Error(`Failed to get WordPress integration: ${error.message}`);
  }
}

module.exports = {
  WordPressService,
  getWordPressIntegration
};
