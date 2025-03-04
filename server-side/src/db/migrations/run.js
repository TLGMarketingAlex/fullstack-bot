// src/db/migrations/run.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../../config/database');
const logger = require('../../utils/logger');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    logging: msg => logger.debug(msg)
  }
);

async function runMigrations() {
  try {
    // Check connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get all executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM migrations ORDER BY id ASC'
    );
    
    const executedMigrationNames = executedMigrations.map(m => m.name);
    
    // Get all migration files
    const migrationFiles = fs.readdirSync(path.join(__dirname, 'scripts'))
      .filter(file => file.endsWith('.js'))
      .sort();
    
    // Execute migrations that haven't been executed yet
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        logger.info(`Executing migration: ${file}`);
        
        // Execute migration
        const migration = require(path.join(__dirname, 'scripts', file));
        await migration.up(sequelize.queryInterface, Sequelize);
        
        // Record migration
        await sequelize.query(
          'INSERT INTO migrations (name) VALUES (?)',
          {
            replacements: [file]
          }
        );
        
        logger.info(`Migration executed successfully: ${file}`);
      }
    }
    
    logger.info('All migrations have been executed successfully');
  } catch (error) {
    logger.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

// src/db/migrations/scripts/001-create-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'editor', 'user'),
        defaultValue: 'user'
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verificationToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resetPasswordToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resetPasswordExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};

// src/db/migrations/scripts/002-create-credit-accounts.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CreditAccounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      planType: {
        type: Sequelize.ENUM('basic', 'pro', 'enterprise', 'custom'),
        defaultValue: 'basic'
      },
      creditsRemaining: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      creditsUsed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      monthlyAllowance: {
        type: Sequelize.INTEGER,
        defaultValue: 1000,
        allowNull: false
      },
      renewalDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastRenewalDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CreditAccounts');
  }
};

// src/db/migrations/scripts/003-create-templates.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      contentType: {
        type: Sequelize.ENUM('blog', 'product', 'social', 'email', 'custom'),
        defaultValue: 'blog'
      },
      structure: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      promptTemplate: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      defaultParameters: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isSystem: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Templates');
  }
};

// src/db/migrations/scripts/004-create-content-items.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ContentItems', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      templateId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      contentType: {
        type: Sequelize.ENUM('blog', 'product', 'social', 'email', 'custom'),
        defaultValue: 'blog'
      },
      status: {
        type: Sequelize.ENUM('draft', 'generated', 'published', 'archived'),
        defaultValue: 'draft'
      },
      format: {
        type: Sequelize.ENUM('markdown', 'html', 'plain'),
        defaultValue: 'markdown'
      },
      wordCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      publishedUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ContentItems');
  }
};

// src/db/migrations/scripts/005-create-content-generations.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ContentGenerations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      contentItemId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'ContentItems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      promptData: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      aiProvider: {
        type: Sequelize.STRING,
        allowNull: true
      },
      aiModel: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('queued', 'processing', 'completed', 'failed'),
        defaultValue: 'queued'
      },
      creditsUsed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      estimatedCredits: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      processingStartedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completionTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ContentGenerations');
  }
};

// src/db/migrations/scripts/006-create-integrations.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Integrations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('wordpress', 'shopify', 'google_docs', 'custom'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      config: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      credentials: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'error'),
        defaultValue: 'inactive'
      },
      lastSyncAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Integrations');
  }
};

// src/db/migrations/scripts/007-create-subscriptions.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      planId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'canceled', 'past_due', 'trialing'),
        defaultValue: 'active'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelAtPeriodEnd: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      paddleSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paddleCustomerId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Subscriptions');
  }
};

// src/db/migrations/scripts/008-create-payment-records.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PaymentRecords', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subscriptionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM('subscription', 'one_time', 'refund'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paddleTransactionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PaymentRecords');
  }
};

// src/db/migrations/scripts/009-create-seed-data.js
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin user
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('adminpassword', 10);
    
    await queryInterface.bulkInsert('Users', [{
      id: adminId,
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    // Create credit account for admin
    await queryInterface.bulkInsert('CreditAccounts', [{
      id: uuidv4(),
      userId: adminId,
      planType: 'enterprise',
      creditsRemaining: 100000,
      creditsUsed: 0,
      monthlyAllowance: 100000,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    // Create system templates
    const templateIds = [uuidv4(), uuidv4(), uuidv4()];
    
    await queryInterface.bulkInsert('Templates', [
      {
        id: templateIds[0],
        userId: adminId,
        name: 'Blog Post - Standard',
        description: 'A standard blog post template with introduction, main points, and conclusion',
        contentType: 'blog',
        structure: JSON.stringify([
          { id: 'title', type: 'heading', content: '# Title Goes Here' },
          { id: 'intro', type: 'text', content: 'Introduction goes here. Provide context and hook the reader.' },
          { id: 'section1', type: 'heading', content: '## First Main Point' },
          { id: 'section1-content', type: 'text', content: 'Content for the first main point.' },
          { id: 'section2', type: 'heading', content: '## Second Main Point' },
          { id: 'section2-content', type: 'text', content: 'Content for the second main point.' },
          { id: 'section3', type: 'heading', content: '## Third Main Point' },
          { id: 'section3-content', type: 'text', content: 'Content for the third main point.' },
          { id: 'conclusion', type: 'heading', content: '## Conclusion' },
          { id: 'conclusion-content', type: 'text', content: 'Summarize the key points and provide a call to action.' }
        ]),
        promptTemplate: 'Write a comprehensive blog post about {topic} targeting {targetAudience}. Include an introduction that hooks the reader, at least three main points with supporting details, and a conclusion with a call to action.',
        defaultParameters: JSON.stringify({
          wordCount: 1500,
          creativity: 0.7,
          seoOptimize: true
        }),
        isPublic: true,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: templateIds[1],
        userId: adminId,
        name: 'Product Description',
        description: 'Template for compelling product descriptions',
        contentType: 'product',
        structure: JSON.stringify([
          { id: 'title', type: 'heading', content: '# Product Name' },
          { id: 'tagline', type: 'text', content: 'A brief, compelling tagline for the product.' },
          { id: 'overview', type: 'text', content: 'Overview of what the product is and what problem it solves.' },
          { id: 'features', type: 'heading', content: '## Key Features' },
          { id: 'features-list', type: 'text', content: '- Feature 1\n- Feature 2\n- Feature 3' },
          { id: 'benefits', type: 'heading', content: '## Benefits' },
          { id: 'benefits-content', type: 'text', content: 'Explain how the features translate into benefits for the customer.' },
          { id: 'specifications', type: 'heading', content: '## Specifications' },
          { id: 'specifications-content', type: 'text', content: 'Technical details and specifications.' },
          { id: 'cta', type: 'text', content: 'Call to action - encourage purchase or further exploration.' }
        ]),
        promptTemplate: 'Create a compelling product description for {productName}. Highlight its unique features, benefits to the customer, and key specifications. Include a strong call to action.',
        defaultParameters: JSON.stringify({
          wordCount: 500,
          creativity: 0.6,
          seoOptimize: true
        }),
        isPublic: true,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: templateIds[2],
        userId: adminId,
        name: 'Social Media Post',
        description: 'Short, engaging social media content',
        contentType: 'social',
        structure: JSON.stringify([
          { id: 'content', type: 'text', content: 'Main post content goes here.' },
          { id: 'hashtags', type: 'text', content: '#hashtag1 #hashtag2 #hashtag3' }
        ]),
        promptTemplate: 'Write an engaging social media post for {platform} about {topic}. The goal is to {goal}. Include relevant hashtags.',
        defaultParameters: JSON.stringify({
          wordCount: 100,
          creativity: 0.8,
          seoOptimize: false
        }),
        isPublic: true,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Create sample content item
    const contentItemId = uuidv4();
    
    await queryInterface.bulkInsert('ContentItems', [{
      id: contentItemId,
      userId: adminId,
      templateId: templateIds[0],
      title: 'Sample Blog Post',
      content: '# Sample Blog Post\n\nThis is a sample blog post created automatically.\n\n## Introduction\n\nIn this blog post, we will explore the capabilities of our AI content generation platform.\n\n## Features\n\n- AI-powered content generation\n- Template-based content creation\n- WordPress integration\n\n## Conclusion\n\nThank you for trying our platform!',
      contentType: 'blog',
      status: 'generated',
      format: 'markdown',
      wordCount: 56,
      metadata: JSON.stringify({
        generationCompleted: true
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    // Create sample generation record
    await queryInterface.bulkInsert('ContentGenerations', [{
      id: uuidv4(),
      userId: adminId,
      contentItemId,
      promptData: JSON.stringify({
        topic: 'AI content generation',
        targetAudience: 'content marketers',
        wordCount: 500
      }),
      aiProvider: 'mock',
      aiModel: 'mock-model-v1',
      status: 'completed',
      creditsUsed: 56,
      estimatedCredits: 500,
      processingStartedAt: new Date(Date.now() - 1000 * 60),
      completionTime: new Date(),
      metadata: JSON.stringify({
        wordCount: 56
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ContentGenerations', null, {});
    await queryInterface.bulkDelete('ContentItems', null, {});
    await queryInterface.bulkDelete('Templates', null, {});
    await queryInterface.bulkDelete('CreditAccounts', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
