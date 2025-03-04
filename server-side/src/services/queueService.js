// src/services/queueService.js
const amqp = require('amqplib');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const config = require('../config/queue');

class QueueService extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.channel = null;
    this.connected = false;
    this.connecting = false;
    this.queues = {};
    
    // Queue definitions
    this.queueDefinitions = {
      'content-generation': {
        durable: true,
        deadLetterExchange: 'dlx.content-generation'
      },
      'content-publishing': {
        durable: true,
        deadLetterExchange: 'dlx.content-publishing'
      },
      'notification': {
        durable: true,
        deadLetterExchange: 'dlx.notification'
      }
    };
    
    // Configure reconnection
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // Start with 5 seconds
  }
  
  // Initialize connection
  async connect() {
    if (this.connected || this.connecting) {
      return;
    }
    
    this.connecting = true;
    
    try {
      logger.info('Connecting to RabbitMQ...');
      
      this.connection = await amqp.connect(config.url);
      this.channel = await this.connection.createChannel();
      
      // Setup error handlers
      this.connection.on('error', err => {
        logger.error('RabbitMQ connection error:', err);
        this.handleConnectionError();
      });
      
      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleConnectionError();
      });
      
      // Initialize queues
      await this.setupQueues();
      
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;
      logger.info('Connected to RabbitMQ successfully');
      
      this.emit('connected');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.connecting = false;
      this.handleConnectionError();
      
      throw error;
    }
  }
  
  // Handle connection errors and reconnect
  handleConnectionError() {
    this.connected = false;
    this.channel = null;
    this.connection = null;
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Implement exponential backoff for reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts));
      this.reconnectAttempts++;
      
      logger.info(`Attempting to reconnect to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          logger.error('Reconnection attempt failed:', error);
        }
      }, delay);
    } else {
      logger.error(`Failed to reconnect to RabbitMQ after ${this.maxReconnectAttempts} attempts`);
      this.emit('reconnect_failed');
    }
  }
  
  // Setup queues and exchanges
  async setupQueues() {
    // Create each queue with its dead letter exchange
    for (const [queueName, options] of Object.entries(this.queueDefinitions)) {
      // Create dead letter exchange
      const dlx = options.deadLetterExchange;
      await this.channel.assertExchange(dlx, 'fanout', { durable: true });
      
      // Create dead letter queue
      const dlq = `${queueName}.dlq`;
      await this.channel.assertQueue(dlq, { durable: true });
      await this.channel.bindQueue(dlq, dlx, '');
      
      // Create main queue with dead letter configuration
      await this.channel.assertQueue(queueName, {
        durable: options.durable,
        arguments: {
          'x-dead-letter-exchange': dlx
        }
      });
      
      this.queues[queueName] = true;
      
      logger.info(`Queue ${queueName} setup completed with DLQ configuration`);
    }
  }
  
  // Ensure connection before operations
  async ensureConnection() {
    if (!this.connected) {
      await this.connect();
    }
  }
  
  // Enqueue a message
  async enqueue(queue, message, options = {}) {
    await this.ensureConnection();
    
    if (!this.queues[queue]) {
      throw new Error(`Queue ${queue} is not defined`);
    }
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    await this.channel.sendToQueue(queue, messageBuffer, {
      persistent: true,
      messageId: message.id || message.generationId || undefined,
      ...options
    });
    
    logger.debug(`Message enqueued to ${queue}`, { 
      messageId: message.id || message.generationId,
      queue 
    });
    
    return true;
  }
  
  // Start consuming messages
  async consume(queue, handler, options = {}) {
    await this.ensureConnection();
    
    if (!this.queues[queue]) {
      throw new Error(`Queue ${queue} is not defined`);
    }
    
    // Set prefetch count for consumer
    await this.channel.prefetch(options.prefetch || 1);
    
    // Start consuming
    const { consumerTag } = await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      
      const messageId = msg.properties.messageId;
      
      try {
        // Parse message
        const content = JSON.parse(msg.content.toString());
        
        logger.debug(`Processing message from ${queue}`, { 
          messageId,
          queue 
        });
        
        // Process message with handler
        await handler(content);
        
        // Acknowledge message
        this.channel.ack(msg);
        
        logger.debug(`Successfully processed message from ${queue}`, { 
          messageId,
          queue 
        });
      } catch (error) {
        logger.error(`Error processing message from ${queue}:`, error);
        
        // Handle retry logic
        const retryCount = (msg.properties.headers && msg.properties.headers['x-retry-count']) || 0;
        
        if (retryCount < (options.maxRetries || 3)) {
          // Retry with incremented count
          const retryMessage = msg.content;
          const retryOptions = {
            persistent: true,
            messageId,
            headers: {
              'x-retry-count': retryCount + 1,
              'x-original-queue': queue
            }
          };
          
          // Add delay before retry using a delay exchange pattern
          setTimeout(async () => {
            try {
              await this.channel.sendToQueue(queue, retryMessage, retryOptions);
              this.channel.ack(msg);
              
              logger.info(`Retrying message from ${queue} (attempt ${retryCount + 1})`, { 
                messageId,
                queue 
              });
            } catch (retryError) {
              logger.error(`Failed to retry message from ${queue}:`, retryError);
              this.channel.nack(msg, false, false); // Send to DLQ
            }
          }, (options.retryDelay || 5000) * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          // Max retries reached, send to dead letter queue
          logger.warn(`Max retries reached for message from ${queue}, sending to DLQ`, { 
            messageId,
            queue,
            retryCount 
          });
          
          this.channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });
    
    logger.info(`Started consuming from queue ${queue}`, { consumerTag });
    
    return consumerTag;
  }
  
  // Cancel consumer
  async cancelConsumer(consumerTag) {
    await this.ensureConnection();
    await this.channel.cancel(consumerTag);
    
    logger.info(`Cancelled consumer ${consumerTag}`);
    
    return true;
  }
  
  // Remove a message from the queue (by message ID)
  async removeFromQueue(queue, messageId) {
    await this.ensureConnection();
    
    if (!this.queues[queue]) {
      throw new Error(`Queue ${queue} is not defined`);
    }
    
    // This is a workaround since RabbitMQ doesn't support direct message removal
    // We'll consume all messages, acknowledge the ones we want to keep, and requeue the rest
    let found = false;
    
    // Get message count
    const { messageCount } = await this.channel.assertQueue(queue);
    
    if (messageCount === 0) {
      throw new Error(`Queue ${queue} is empty`);
    }
    
    // Create temporary consumer to look for the message
    const tempConsumerTag = await this.channel.consume(queue, (msg) => {
      if (!msg) return;
      
      const currentMessageId = msg.properties.messageId;
      const content = JSON.parse(msg.content.toString());
      
      // Check if this is the message we want to remove
      if (currentMessageId === messageId || content.id === messageId || content.generationId === messageId) {
        // Acknowledge (remove) this message
        this.channel.ack(msg);
        found = true;
        
        logger.info(`Removed message ${messageId} from queue ${queue}`);
      } else {
        // Put message back in the queue
        this.channel.nack(msg, false, true);
      }
    }, { noAck: false });
    
    // Cancel temporary consumer after a reasonable time
    setTimeout(async () => {
      try {
        await this.channel.cancel(tempConsumerTag);
      } catch (error) {
        logger.error(`Error cancelling temporary consumer:`, error);
      }
    }, 5000);
    
    if (!found) {
      throw new Error(`Message ${messageId} not found in queue ${queue}`);
    }
    
    return found;
  }
  
  // Close connection
  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    
    if (this.connection) {
      await this.connection.close();
    }
    
    this.connected = false;
    this.channel = null;
    this.connection = null;
    
    logger.info('Closed RabbitMQ connection');
    
    return true;
  }
}

// Export a singleton instance
const queueService = new QueueService();

module.exports = { queueService };
