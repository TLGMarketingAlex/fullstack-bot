// src/config/database.js
require('dotenv').config();
const { parse } = require('pg-connection-string');

// Parse database URL if provided
let dbConfig = {};
if (process.env.DATABASE_URL) {
  const connectionOptions = parse(process.env.DATABASE_URL);
  dbConfig = {
    host: connectionOptions.host,
    port: connectionOptions.port,
    username: connectionOptions.user,
    password: connectionOptions.password,
    database: connectionOptions.database,
  };
}

// Export config for different environments
module.exports = {
  development: {
    username: dbConfig.username || process.env.DB_USERNAME || 'postgres',
    password: dbConfig.password || process.env.DB_PASSWORD || 'postgres',
    database: dbConfig.database || process.env.DB_NAME || 'ai_content_platform',
    host: dbConfig.host || process.env.DB_HOST || 'localhost',
    port: dbConfig.port || process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'ai_content_platform_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: dbConfig.username || process.env.DB_USERNAME,
    password: dbConfig.password || process.env.DB_PASSWORD,
    database: dbConfig.database || process.env.DB_NAME,
    host: dbConfig.host || process.env.DB_HOST,
    port: dbConfig.port || process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

// Export a single configuration based on the current environment
const env = process.env.NODE_ENV || 'development';
module.exports = module.exports[env];
