// src/services/aiService.js
const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const config = require('../config/ai');

// Base AI Provider class
class AIProvider {
  constructor() {
    this.name = 'base';
  }
  
  async generate(prompt, options = {}) {
    throw new Error('Method not implemented in base class');
  }
  
  async isAvailable() {
    return false;
  }
}

// OpenAI Provider implementation
class OpenAIProvider extends AIProvider {
  constructor(apiKey = config.openai.apiKey) {
    super();
    this.name = 'openai';
    this.client = new OpenAI({
      apiKey: apiKey
    });
  }
  
  async generate(prompt, options = {}) {
    try {
      const {
        model = 'gpt-4',
        maxTokens = 2000,
        temperature = 0.7,
        topP = 1,
        presencePenalty = 0,
        frequencyPenalty = 0,
        systemMessage = 'You are a professional content creator who writes high-quality articles, blog posts, and other content.'
      } = options;
      
      logger.info(`Generating content with OpenAI ${model}`, { 
        promptLength: prompt.length,
        model 
      });
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty
      });
      
      logger.info('OpenAI response received', {
        model,
        usage: response.usage
      });
      
      return {
        content: response.choices[0].message.content,
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        },
        provider: this.name
      };
    } catch (error) {
      logger.error('OpenAI generation error:', error);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }
  
  async isAvailable() {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error('OpenAI availability check failed:', error);
      return false;
    }
  }
}

// Mock Provider for testing
class MockProvider extends AIProvider {
  constructor() {
    super();
    this.name = 'mock';
  }
  
  async generate(prompt, options = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('Generating content with Mock Provider', { promptLength: prompt.length });
    
    // Generate some mock content
    const content = `# Generated Mock Content
    
This is a mock response for prompt: "${prompt.substring(0, 50)}...".

## Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisi eu ultricies malesuada, nunc magna vestibulum nulla, a tincidunt nunc nisl a nisi.

## Main Content
Etiam euismod, arcu id pharetra aliquam, risus velit aliquet risus, id aliquam risus velit id risus. Etiam euismod, arcu id pharetra aliquam, risus velit aliquet risus, id aliquam risus velit id risus.

## Conclusion
In conclusion, this is a mock response generated for testing purposes.`;
    
    return {
      content,
      model: 'mock-model-v1',
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: content.length / 4,
        totalTokens: (prompt.length + content.length) / 4
      },
      provider: this.name
    };
  }
  
  async isAvailable() {
    return true;
  }
}

// AI Service class to manage providers
class AIService {
  constructor() {
    this.providers = {};
    this.defaultProvider = null;
    
    // Initialize providers
    this.registerProviders();
  }
  
  registerProviders() {
    // Register OpenAI if API key is available
    if (config.openai.apiKey) {
      this.registerProvider('openai', new OpenAIProvider());
      this.defaultProvider = 'openai';
    }
    
    // Always register mock provider for testing
    this.registerProvider('mock', new MockProvider());
    
    // If no other provider is available, use mock as default
    if (!this.defaultProvider) {
      this.defaultProvider = 'mock';
    }
    
    logger.info('AI providers registered', { 
      providers: Object.keys(this.providers),
      defaultProvider: this.defaultProvider
    });
  }
  
  registerProvider(name, provider) {
    this.providers[name] = provider;
  }
  
  getProvider(name) {
    return this.providers[name] || this.providers[this.defaultProvider];
  }
  
  async generate(prompt, options = {}) {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      throw new Error(`AI provider '${providerName}' not found`);
    }
    
    try {
      return await provider.generate(prompt, options);
    } catch (error) {
      logger.error(`Generation failed with provider ${providerName}:`, error);
      
      // If not already using the default provider, try falling back
      if (providerName !== this.defaultProvider) {
        logger.info(`Falling back to default provider ${this.defaultProvider}`);
        return await this.providers[this.defaultProvider].generate(prompt, options);
      }
      
      // If we're already using the default provider, rethrow the error
      throw error;
    }
  }
  
  // Helper method to build prompts based on content type
  buildPrompt(contentType, parameters) {
    let basePrompt = '';
    
    switch (contentType) {
      case 'blog':
        basePrompt = this.buildBlogPrompt(parameters);
        break;
      case 'product':
        basePrompt = this.buildProductPrompt(parameters);
        break;
      case 'social':
        basePrompt = this.buildSocialPrompt(parameters);
        break;
      case 'email':
        basePrompt = this.buildEmailPrompt(parameters);
        break;
      default:
        // For custom content types, use the provided template or a generic one
        basePrompt = parameters.customPrompt || this.buildGenericPrompt(parameters);
    }
    
    return basePrompt;
  }
  
  buildBlogPrompt(parameters) {
    const {
      topic,
      title,
      keywords = [],
      targetAudience,
      toneOfVoice = 'professional',
      wordCount = 1000,
      includeOutline = true,
      includeImages = false,
      format = 'markdown'
    } = parameters;
    
    let prompt = `Write a high-quality blog post`;
    
    if (title) {
      prompt += ` with the title: "${title}"`;
    } else if (topic) {
      prompt += ` about ${topic}`;
    }
    
    prompt += `.\n\n`;
    
    prompt += `Use a ${toneOfVoice} tone of voice`;
    
    if (targetAudience) {
      prompt += ` aimed at ${targetAudience}`;
    }
    
    prompt += `.\n\n`;
    
    if (keywords && keywords.length > 0) {
      prompt += `Include the following keywords naturally throughout the content: ${keywords.join(', ')}.\n\n`;
    }
    
    prompt += `The blog post should be approximately ${wordCount} words in length.\n\n`;
    
    if (includeOutline) {
      prompt += `Structure the blog post with a clear introduction, several main sections with subheadings, and a conclusion.\n\n`;
    }
    
    if (includeImages) {
      prompt += `Include suggestions for images or visuals between sections in [IMAGE: description] format.\n\n`;
    }
    
    prompt += `Format the content in ${format} format.\n\n`;
    
    prompt += `Make the content engaging, informative, and valuable to the reader.`;
    
    return prompt;
  }
  
  buildProductPrompt(parameters) {
    const {
      productName,
      productDescription,
      productFeatures = [],
      benefits = [],
      targetAudience,
      competitors = [],
      wordCount = 500,
      format = 'markdown'
    } = parameters;
    
    let prompt = `Write compelling product description copy`;
    
    if (productName) {
      prompt += ` for ${productName}`;
    }
    
    prompt += `.\n\n`;
    
    if (productDescription) {
      prompt += `Product overview: ${productDescription}\n\n`;
    }
    
    if (productFeatures && productFeatures.length > 0) {
      prompt += `Key features to highlight:\n`;
      productFeatures.forEach(feature => {
        prompt += `- ${feature}\n`;
      });
      prompt += `\n`;
    }
    
    if (benefits && benefits.length > 0) {
      prompt += `Benefits to emphasize:\n`;
      benefits.forEach(benefit => {
        prompt += `- ${benefit}\n`;
      });
      prompt += `\n`;
    }
    
    if (targetAudience) {
      prompt += `Target audience: ${targetAudience}\n\n`;
    }
    
    if (competitors && competitors.length > 0) {
      prompt += `Differentiate from competitors like: ${competitors.join(', ')}\n\n`;
    }
    
    prompt += `The description should be approximately ${wordCount} words in length.\n\n`;
    
    prompt += `Format the content in ${format} format.\n\n`;
    
    prompt += `Make the description persuasive, highlight unique selling points, and create desire for the product.`;
    
    return prompt;
  }
  
  buildSocialPrompt(parameters) {
    const {
      platform,
      topic,
      goal,
      toneOfVoice = 'conversational',
      includeHashtags = true,
      numberOfPosts = 1,
      callToAction
    } = parameters;
    
    let prompt = `Write ${numberOfPosts} social media post${numberOfPosts > 1 ? 's' : ''}`;
    
    if (platform) {
      prompt += ` for ${platform}`;
    }
    
    if (topic) {
      prompt += ` about ${topic}`;
    }
    
    prompt += `.\n\n`;
    
    if (goal) {
      prompt += `The goal of the post is to ${goal}.\n\n`;
    }
    
    prompt += `Use a ${toneOfVoice} tone of voice.\n\n`;
    
    if (callToAction) {
      prompt += `Include the following call to action: ${callToAction}\n\n`;
    }
    
    if (includeHashtags) {
      prompt += `Include relevant hashtags at the end of each post.\n\n`;
    }
    
    if (platform === 'instagram' || platform === 'facebook') {
      prompt += `Also provide a brief image description suggestion for each post.\n\n`;
    }
    
    prompt += `Format each post as Post 1, Post 2, etc. if multiple posts are requested.\n\n`;
    
    prompt += `Make the content engaging, shareable, and aligned with ${platform || 'social media'} best practices.`;
    
    return prompt;
  }
  
  buildEmailPrompt(parameters) {
    const {
      emailType = 'newsletter',
      subject,
      audience,
      purpose,
      toneOfVoice = 'professional',
      includeSubject = true,
      wordCount = 300,
      callToAction
    } = parameters;
    
    let prompt = `Write a ${emailType} email`;
    
    if (subject) {
      prompt += ` with the subject "${subject}"`;
    }
    
    prompt += `.\n\n`;
    
    if (audience) {
      prompt += `The email is for ${audience}.\n\n`;
    }
    
    if (purpose) {
      prompt += `The purpose of this email is to ${purpose}.\n\n`;
    }
    
    prompt += `Use a ${toneOfVoice} tone of voice.\n\n`;
    
    prompt += `The email should be approximately ${wordCount} words in length.\n\n`;
    
    if (includeSubject) {
      prompt += `Start with a subject line followed by the email body.\n\n`;
    }
    
    if (callToAction) {
      prompt += `Include the following call to action: ${callToAction}\n\n`;
    }
    
    prompt += `Format the email with appropriate greeting, body paragraphs, and sign-off.\n\n`;
    
    prompt += `Make the email engaging, clear, and effective for its purpose.`;
    
    return prompt;
  }
  
  buildGenericPrompt(parameters) {
    const {
      topic,
      purpose,
      toneOfVoice = 'professional',
      format = 'markdown',
      wordCount = 500
    } = parameters;
    
    let prompt = `Write content`;
    
    if (topic) {
      prompt += ` about ${topic}`;
    }
    
    prompt += `.\n\n`;
    
    if (purpose) {
      prompt += `The purpose of this content is to ${purpose}.\n\n`;
    }
    
    prompt += `Use a ${toneOfVoice} tone of voice.\n\n`;
    
    prompt += `The content should be approximately ${wordCount} words in length.\n\n`;
    
    prompt += `Format the content in ${format} format.\n\n`;
    
    prompt += `Make the content clear, engaging, and valuable to the reader.`;
    
    return prompt;
  }
}

// Export a singleton instance
module.exports = new AIService();
