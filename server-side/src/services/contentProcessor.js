// src/services/contentProcessor.js
const marked = require('marked');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const logger = require('../utils/logger');
const aiService = require('./aiService');

// Create a DOMPurify instance with JSDOM's window
const window = new JSDOM('').window;
const purify = DOMPurify(window);

class ContentProcessor {
  constructor() {
    // Configure marked options
    marked.setOptions({
      gfm: true,         // GitHub Flavored Markdown
      breaks: true,       // Convert line breaks to <br>
      headerIds: true,    // Add ids to headers
      mangle: false,      // Don't escape HTML
      smartypants: true   // Use "smart" typographic punctuation
    });
  }
  
  /**
   * Process the content with various transformations
   * @param {string} rawContent - The raw content from AI
   * @param {object} options - Processing options
   * @returns {object} Processed content with metadata
   */
  async process(rawContent, options = {}) {
    try {
      logger.info('Processing content', { contentType: options.contentType });
      
      const {
        contentType = 'blog',
        formatType = 'markdown',
        applyKeywordOptimization = false,
        keywords = [],
        targetLength = null,
        sanitize = true
      } = options;
      
      // Initialize metadata
      let metadata = {
        processingSteps: [],
        wordCount: this.countWords(rawContent)
      };
      
      // Extract title if not explicitly provided
      let title = this.extractTitle(rawContent);
      let content = rawContent;
      
      // Apply content-type specific processing
      content = await this.applyTypeSpecificProcessing(content, contentType);
      metadata.processingSteps.push('type-specific-processing');
      
      // Format conversion if needed
      if (formatType !== 'markdown') {
        const formatted = await this.convertFormat(content, formatType);
        content = formatted.content;
        metadata.processingSteps.push('format-conversion');
        metadata.format = formatType;
      }
      
      // SEO optimization if requested
      if (applyKeywordOptimization && keywords && keywords.length > 0) {
        const optimized = await this.optimizeForKeywords(content, keywords, contentType);
        content = optimized.content;
        metadata.keywordOptimization = optimized.metadata;
        metadata.processingSteps.push('keyword-optimization');
      }
      
      // Length adjustment if needed
      if (targetLength) {
        const currentLength = this.countWords(content);
        // Only adjust if difference is more than 10%
        if (Math.abs(currentLength - targetLength) / targetLength > 0.1) {
          const adjusted = await this.adjustLength(content, targetLength);
          content = adjusted.content;
          metadata.lengthAdjustment = adjusted.metadata;
          metadata.processingSteps.push('length-adjustment');
        }
      }
      
      // Sanitize HTML content if needed
      if (sanitize && formatType === 'html') {
        content = this.sanitizeHTML(content);
        metadata.processingSteps.push('sanitization');
      }
      
      // Extract headings and calculate reading time
      const headings = this.extractHeadings(content);
      const finalWordCount = this.countWords(content);
      const readingTime = this.estimateReadingTime(content);
      
      // Update metadata
      metadata = {
        ...metadata,
        headings,
        wordCount: finalWordCount,
        readingTime,
        processingComplete: true
      };
      
      logger.info('Content processing completed', { 
        contentType,
        wordCount: finalWordCount,
        steps: metadata.processingSteps.length
      });
      
      return {
        title,
        content,
        metadata
      };
    } catch (error) {
      logger.error('Error processing content:', error);
      throw new Error(`Content processing failed: ${error.message}`);
    }
  }
  
  /**
   * Extract title from content
   * @param {string} content 
   * @returns {string} Extracted title
   */
  extractTitle(content) {
    // Try to find a markdown H1 (# Title)
    const h1Match = content.match(/^#\s+(.*?)(\n|$)/);
    if (h1Match) {
      return h1Match[1].trim();
    }
    
    // Try to find an HTML <h1> tag
    const htmlH1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (htmlH1Match) {
      return htmlH1Match[1].trim().replace(/<[^>]*>/g, ''); // Remove any HTML tags inside h1
    }
    
    // Try to find the first line ending with a period as a fallback
    const firstSentenceMatch = content.match(/^([^.!?]*[.!?])/);
    if (firstSentenceMatch) {
      const sentence = firstSentenceMatch[1].trim();
      // If it's too long, truncate it
      return sentence.length > 60 ? sentence.substring(0, 57) + '...' : sentence;
    }
    
    // If all else fails, return a generic title
    return 'Untitled Content';
  }
  
  /**
   * Extract headings from content
   * @param {string} content 
   * @returns {Array<object>} Array of headings with level and text
   */
  extractHeadings(content) {
    const headings = [];
    
    // For markdown content
    const markdownHeadingRegex = /^(#{1,6})\s+(.*?)(\n|$)/gm;
    let match;
    
    while ((match = markdownHeadingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim()
      });
    }
    
    // For HTML content
    if (headings.length === 0) {
      const htmlHeadingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
      
      while ((match = htmlHeadingRegex.exec(content)) !== null) {
        headings.push({
          level: parseInt(match[1]),
          text: match[2].trim().replace(/<[^>]*>/g, '') // Remove any HTML tags inside heading
        });
      }
    }
    
    return headings;
  }
  
  /**
   * Count words in text
   * @param {string} text 
   * @returns {number} Word count
   */
  countWords(text) {
    // Handle null or undefined input
    if (!text) return 0;
    
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    // Split by whitespace and filter out empty strings
    return cleanText.split(/\s+/).filter(Boolean).length;
  }
  
  /**
   * Estimate reading time based on word count
   * @param {string} text 
   * @returns {number} Reading time in minutes
   */
  estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
  
  /**
   * Apply content type specific processing
   * @param {string} content 
   * @param {string} contentType 
   * @returns {string} Processed content
   */
  async applyTypeSpecificProcessing(content, contentType) {
    switch (contentType) {
      case 'blog':
        return this.processBlogContent(content);
      case 'product':
        return this.processProductContent(content);
      case 'social':
        return this.processSocialContent(content);
      case 'email':
        return this.processEmailContent(content);
      default:
        return content;
    }
  }
  
  /**
   * Process blog content
   * @param {string} content 
   * @returns {string} Processed content
   */
  processBlogContent(content) {
    // Ensure proper markdown formatting for blog posts
    let processedContent = content;
    
    // Ensure there's a title
    if (!content.startsWith('# ')) {
      const title = this.extractTitle(content);
      processedContent = `# ${title}\n\n${content}`;
    }
    
    // Add a line break after headings if missing
    processedContent = processedContent.replace(/^(#{1,6}.*?)(\n)(?!\n)/gm, '$1\n\n');
    
    // Ensure paragraphs have proper spacing
    processedContent = processedContent.replace(/([^\n])\n([^\n#])/g, '$1\n\n$2');
    
    return processedContent;
  }
  
  /**
   * Process product content
   * @param {string} content 
   * @returns {string} Processed content
   */
  processProductContent(content) {
    // For product descriptions, we want to emphasize features and benefits
    let processedContent = content;
    
    // Make sure features and benefits are properly formatted as lists
    const featureSection = processedContent.match(/(?:features|key features|main features).*?:(.*?)(?:\n\n|\n#|\n\*\*|$)/is);
    if (featureSection && featureSection[1]) {
      const features = featureSection[1].trim();
      // Convert plain text lists to markdown bullet points if they aren't already
      if (!features.includes('- ') && !features.includes('* ')) {
        const formattedFeatures = features
          .split(/\n/)
          .map(line => line.trim())
          .filter(Boolean)
          .map(line => `- ${line}`)
          .join('\n');
        
        processedContent = processedContent.replace(featureSection[0], `**Features:**\n\n${formattedFeatures}\n\n`);
      }
    }
    
    return processedContent;
  }
  
  /**
   * Process social content
   * @param {string} content 
   * @returns {string} Processed content
   */
  processSocialContent(content) {
    // For social media, we need to handle character limits and hashtags
    let processedContent = content;
    
    // Make sure hashtags are properly formatted (no spaces)
    processedContent = processedContent.replace(/#\s+(\w+)/g, '#$1');
    
    return processedContent;
  }
  
  /**
   * Process email content
   * @param {string} content 
   * @returns {string} Processed content
   */
  processEmailContent(content) {
    // For emails, ensure we have proper greeting and sign-off
    let processedContent = content;
    
    // If there's no greeting, add a generic one
    if (!processedContent.match(/^(dear|hello|hi|greetings|hey)/i)) {
      processedContent = `Hello,\n\n${processedContent}`;
    }
    
    // If there's no sign-off, add a generic one
    if (!processedContent.match(/(regards|sincerely|best|thanks|thank you|cheers)[,.]?\s*\n/i)) {
      processedContent = `${processedContent.trim()}\n\nBest regards,\n[Your Name]`;
    }
    
    return processedContent;
  }
  
  /**
   * Convert content between formats
   * @param {string} content 
   * @param {string} targetFormat 
   * @returns {object} Converted content and metadata
   */
  async convertFormat(content, targetFormat) {
    let convertedContent = content;
    let conversionMetadata = { sourceFormat: 'markdown', targetFormat };
    
    try {
      switch (targetFormat) {
        case 'html':
          // Convert markdown to HTML
          convertedContent = marked.parse(content);
          conversionMetadata.success = true;
          break;
          
        case 'plain':
          // Convert markdown to plain text by removing markdown syntax
          convertedContent = content
            .replace(/#+\s+(.*?)(\n|$)/g, '$1\n') // Headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/\*(.*?)\*/g, '$1') // Italic
            .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)') // Links
            .replace(/!\[(.*?)\]\((.*?)\)/g, '[Image: $1]') // Images
            .replace(/```.*?```/gs, '') // Code blocks
            .replace(/`(.*?)`/g, '$1') // Inline code
            .replace(/^\s*[-*+]\s+(.*?)(\n|$)/gm, '• $1\n') // Lists
            .replace(/^\s*\d+\.\s+(.*?)(\n|$)/gm, '• $1\n') // Numbered lists
            .replace(/> (.*?)(\n|$)/gm, '$1\n') // Blockquotes
            .replace(/\n{3,}/g, '\n\n'); // Multiple line breaks
          
          conversionMetadata.success = true;
          break;
          
        default:
          // Default is to keep as markdown
          conversionMetadata.success = false;
          conversionMetadata.message = `Unsupported target format: ${targetFormat}`;
      }
      
      return {
        content: convertedContent,
        metadata: conversionMetadata
      };
    } catch (error) {
      logger.error('Format conversion error:', error);
      return {
        content, // Return original content on error
        metadata: {
          ...conversionMetadata,
          success: false,
          error: error.message
        }
      };
    }
  }
  
  /**
   * Optimize content for SEO keywords
   * @param {string} content 
   * @param {Array<string>} keywords 
   * @param {string} contentType 
   * @returns {object} Optimized content and metadata
   */
  async optimizeForKeywords(content, keywords, contentType) {
    try {
      // Check if keywords are already present and their density
      const contentLower = content.toLowerCase();
      const wordCount = this.countWords(content);
      
      const keywordOccurrences = keywords.map(keyword => {
        const count = (contentLower.match(new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')) || []).length;
        const density = (count / wordCount) * 100;
        return { keyword, count, density };
      });
      
      // Check if optimization is needed
      const needsOptimization = keywordOccurrences.some(k => k.density < 0.5 || k.density > 3);
      
      if (!needsOptimization) {
        return {
          content,
          metadata: {
            keywordOccurrences,
            optimized: false,
            reason: 'Keyword density already optimal'
          }
        };
      }
      
      // For keywords that need optimization, use AI to rewrite content
      const keywordsToOptimize = keywordOccurrences
        .filter(k => k.density < 0.5 || k.density > 3)
        .map(k => k.keyword);
      
      // Generate optimization prompt
      const prompt = `
Please optimize the following ${contentType} content for these keywords: ${keywordsToOptimize.join(', ')}.
Ensure that each keyword appears naturally with a density between 0.5% and 3%.
Maintain the original structure, tone, and meaning of the content.
Do not add any new sections or change the overall structure.

CONTENT TO OPTIMIZE:
${content}
`;
      
      // Use AI service to optimize
      const aiResponse = await aiService.generate(prompt, {
        model: 'gpt-3.5-turbo', // Use faster, cheaper model for optimization
        temperature: 0.3,
        maxTokens: wordCount * 2
      });
      
      // Verify the optimization
      const optimizedContent = aiResponse.content;
      const optimizedWordCount = this.countWords(optimizedContent);
      
      const optimizedKeywordOccurrences = keywords.map(keyword => {
        const optimizedContentLower = optimizedContent.toLowerCase();
        const count = (optimizedContentLower.match(new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')) || []).length;
        const density = (count / optimizedWordCount) * 100;
        return { keyword, count, density };
      });
      
      return {
        content: optimizedContent,
        metadata: {
          originalKeywordOccurrences: keywordOccurrences,
          optimizedKeywordOccurrences,
          optimized: true
        }
      };
    } catch (error) {
      logger.error('Keyword optimization error:', error);
      return {
        content, // Return original content on error
        metadata: {
          error: `Optimization failed: ${error.message}`,
          optimized: false
        }
      };
    }
  }
  
  /**
   * Adjust content length
   * @param {string} content 
   * @param {number} targetLength 
   * @returns {object} Adjusted content and metadata
   */
  async adjustLength(content, targetLength) {
    try {
      const currentLength = this.countWords(content);
      
      // If we're within 10% of target, don't adjust
      if (Math.abs(currentLength - targetLength) / targetLength <= 0.1) {
        return {
          content,
          metadata: {
            originalLength: currentLength,
            targetLength,
            adjustment: 'none',
            reason: 'Already within 10% of target length'
          }
        };
      }
      
      // Determine if we need to expand or condense
      const needsExpansion = currentLength < targetLength;
      
      // Generate adjustment prompt
      let prompt;
      if (needsExpansion) {
        prompt = `
Please expand the following content to approximately ${targetLength} words (current length: ${currentLength} words).
Add more details, examples, or explanations but maintain the original style and structure.
Do not add completely new sections or change the overall message.

CONTENT TO EXPAND:
${content}
`;
      } else {
        prompt = `
Please condense the following content to approximately ${targetLength} words (current length: ${currentLength} words).
Maintain the key points and overall message but remove redundancies and unnecessary details.
Do not remove important information or change the overall structure.

CONTENT TO CONDENSE:
${content}
`;
      }
      
      // Use AI service to adjust length
      const aiResponse = await aiService.generate(prompt, {
        model: 'gpt-3.5-turbo', // Use faster, cheaper model for length adjustment
        temperature: 0.3,
        maxTokens: targetLength * 2
      });
      
      // Verify the adjustment
      const adjustedContent = aiResponse.content;
      const adjustedLength = this.countWords(adjustedContent);
      
      return {
        content: adjustedContent,
        metadata: {
          originalLength: currentLength,
          adjustedLength,
          targetLength,
          adjustment: needsExpansion ? 'expanded' : 'condensed',
          percentChange: ((adjustedLength - currentLength) / currentLength) * 100
        }
      };
    } catch (error) {
      logger.error('Length adjustment error:', error);
      return {
        content, // Return original content on error
        metadata: {
          originalLength: this.countWords(content),
          targetLength,
          adjustment: 'failed',
          error: error.message
        }
      };
    }
  }
  
  /**
   * Sanitize HTML content
   * @param {string} htmlContent 
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(htmlContent) {
    const clean = purify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 
        'b', 'strong', 'i', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
        'blockquote', 'code', 'pre', 'hr', 'br', 'div', 'span', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style',
        'width', 'height', 'align', 'border'
      ],
      ALLOW_DATA_ATTR: false
    });
    
    return clean;
  }
}

// Export a singleton instance
module.exports = new ContentProcessor();
