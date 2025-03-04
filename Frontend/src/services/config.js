/**
 * Application configuration
 */

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CONTENT: '/content',
  CONTENT_EDITOR: '/content/:id',
  NEW_CONTENT: '/content/new',
  TEMPLATES: '/templates',
  TEMPLATE_EDITOR: '/templates/:id',
  NEW_TEMPLATE: '/templates/new',
  SETTINGS: '/settings',
  INTEGRATIONS: '/integrations',
  PROFILE: '/profile',
  BILLING: '/billing',
  CREDITS: '/credits',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Content types
export const CONTENT_TYPES = {
  BLOG_POST: 'blog_post',
  ARTICLE: 'article',
  PRODUCT_DESCRIPTION: 'product_description',
  SOCIAL_POST: 'social_post',
  EMAIL: 'email',
  AD_COPY: 'ad_copy',
  META_DESCRIPTION: 'meta_description',
};

// AI model options
export const AI_MODELS = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
  EXPERT: 'expert',
};

// Integration platforms
export const INTEGRATION_PLATFORMS = {
  WORDPRESS: 'wordpress',
  SHOPIFY: 'shopify',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  MAILCHIMP: 'mailchimp',
  HUBSPOT: 'hubspot',
};

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
};

// Toast notification configuration
export const TOAST_CONFIG = {
  AUTO_CLOSE: 5000,
  POSITION: 'top-right',
};

export default {
  API_CONFIG,
  ROUTES,
  STORAGE_KEYS,
  CONTENT_TYPES,
  AI_MODELS,
  INTEGRATION_PLATFORMS,
  PAGINATION,
  TOAST_CONFIG,
};