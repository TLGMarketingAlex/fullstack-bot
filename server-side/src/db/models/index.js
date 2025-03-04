// src/db/models/index.js
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
    logging: msg => logger.debug(msg),
    pool: config.pool
  }
);

// Import models
const User = require('./User')(sequelize);
const CreditAccount = require('./CreditAccount')(sequelize);
const ContentItem = require('./ContentItem')(sequelize);
const ContentGeneration = require('./ContentGeneration')(sequelize);
const Template = require('./Template')(sequelize);
const Integration = require('./Integration')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const PaymentRecord = require('./PaymentRecord')(sequelize);

// Define relationships

// User relationships
User.hasOne(CreditAccount, { foreignKey: 'userId', as: 'creditAccount' });
CreditAccount.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ContentItem, { foreignKey: 'userId', as: 'contentItems' });
ContentItem.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ContentGeneration, { foreignKey: 'userId', as: 'contentGenerations' });
ContentGeneration.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Template, { foreignKey: 'userId', as: 'templates' });
Template.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Integration, { foreignKey: 'userId', as: 'integrations' });
Integration.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(PaymentRecord, { foreignKey: 'userId', as: 'paymentRecords' });
PaymentRecord.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

// Content relationships
ContentItem.hasMany(ContentGeneration, { foreignKey: 'contentItemId', as: 'generations' });
ContentGeneration.belongsTo(ContentItem, { foreignKey: 'contentItemId' });

Template.hasMany(ContentItem, { foreignKey: 'templateId', as: 'contentItems' });
ContentItem.belongsTo(Template, { foreignKey: 'templateId' });

// Export models and Sequelize instance
module.exports = {
  sequelize,
  User,
  CreditAccount,
  ContentItem,
  ContentGeneration,
  Template,
  Integration,
  Subscription,
  PaymentRecord
};

// src/db/models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'editor', 'user'),
      defaultValue: 'user'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    }
  }, {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Instance method to check password
  User.prototype.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};

// src/db/models/CreditAccount.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CreditAccount = sequelize.define('CreditAccount', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    planType: {
      type: DataTypes.ENUM('basic', 'pro', 'enterprise', 'custom'),
      defaultValue: 'basic'
    },
    creditsRemaining: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    creditsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    monthlyAllowance: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      allowNull: false
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastRenewalDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return CreditAccount;
};

// src/db/models/ContentItem.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContentItem = sequelize.define('ContentItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Templates',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contentType: {
      type: DataTypes.ENUM('blog', 'product', 'social', 'email', 'custom'),
      defaultValue: 'blog'
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'published', 'archived'),
      defaultValue: 'draft'
    },
    format: {
      type: DataTypes.ENUM('markdown', 'html', 'plain'),
      defaultValue: 'markdown'
    },
    wordCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    publishedUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return ContentItem;
};

// src/db/models/ContentGeneration.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContentGeneration = sequelize.define('ContentGeneration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    contentItemId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'ContentItems',
        key: 'id'
      }
    },
    promptData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    aiProvider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    aiModel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('queued', 'processing', 'completed', 'failed'),
      defaultValue: 'queued'
    },
    creditsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    estimatedCredits: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    processingStartedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completionTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true
  });

  return ContentGeneration;
};

// src/db/models/Template.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Template = sequelize.define('Template', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contentType: {
      type: DataTypes.ENUM('blog', 'product', 'social', 'email', 'custom'),
      defaultValue: 'blog'
    },
    structure: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    promptTemplate: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    defaultParameters: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true
  });

  return Template;
};

// src/db/models/Integration.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Integration = sequelize.define('Integration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('wordpress', 'shopify', 'google_docs', 'custom'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    credentials: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error'),
      defaultValue: 'inactive'
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return Integration;
};

// src/db/models/Subscription.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    planId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'canceled', 'past_due', 'trialing'),
      defaultValue: 'active'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paddleSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paddleCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true
  });

  return Subscription;
};

// src/db/models/PaymentRecord.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentRecord = sequelize.define('PaymentRecord', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Subscriptions',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('subscription', 'one_time', 'refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paddleTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true
  });

  return PaymentRecord;
};
