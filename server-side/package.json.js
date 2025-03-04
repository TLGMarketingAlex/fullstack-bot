// package.json
{
  "name": "ai-content-platform-backend",
  "version": "1.0.0",
  "description": "Backend API for AI content generation platform",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "lint": "eslint src/",
    "test": "jest",
    "migrate": "node src/db/migrations/run.js",
    "seed": "node scripts/seed-db.js"
  },
  "dependencies": {
    "amqplib": "^0.10.3",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.4",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.17.4",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "redis": "^4.6.10",
    "sequelize": "^6.35.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "uuid": "^9.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "eslint": "^8.53.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3"
  }
}
