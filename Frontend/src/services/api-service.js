// src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = refreshResponse.data;
        
        // Save new token
        localStorage.setItem('token', accessToken);
        
        // Update header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out user
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle specific error messages
    const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
    
    // Only show toast for non-auth errors to avoid double error messages in auth forms
    const isAuthEndpoint = error.config.url.includes('/auth/');
    if (!isAuthEndpoint) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// Create specialized service modules
const services = {
  // Auth service
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
    verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
    updateProfile: (profileData) => api.put('/auth/profile', profileData),
    changePassword: (passwordData) => api.put('/auth/change-password', passwordData)
  },
  
  // Content service
  content: {
    getAll: (params) => api.get('/content', { params }),
    getById: (id) => api.get(`/content/${id}`),
    create: (contentData) => api.post('/content', contentData),
    update: (id, contentData) => api.put(`/content/${id}`, contentData),
    delete: (id) => api.delete(`/content/${id}`),
    publish: (id, integrationData) => api.post(`/content/${id}/publish`, integrationData),
    schedule: (id, scheduleData) => api.post(`/content/${id}/schedule`, scheduleData)
  },
  
  // Template service
  templates: {
    getAll: (params) => api.get('/templates', { params }),
    getById: (id) => api.get(`/templates/${id}`),
    create: (templateData) => api.post('/templates', templateData),
    update: (id, templateData) => api.put(`/templates/${id}`, templateData),
    delete: (id) => api.delete(`/templates/${id}`),
    archive: (id, isArchived) => api.patch(`/templates/${id}`, { isArchived })
  },
  
  // Generation service
  generation: {
    create: (generationData) => api.post('/generation', generationData),
    getById: (id) => api.get(`/generation/${id}`),
    getHistory: (params) => api.get('/generation/history', { params }),
    cancel: (id) => api.post(`/generation/${id}/cancel`),
    regenerate: (id, promptUpdates) => api.post(`/generation/${id}/regenerate`, { promptUpdates })
  },
  
  // Credits service
  credits: {
    getBalance: () => api.get('/credits'),
    getHistory: (params) => api.get('/credits/history', { params }),
    purchase: (packageId) => api.post('/credits/purchase', { packageId })
  },
  
  // Integrations service
  integrations: {
    getAll: () => api.get('/integrations'),
    getById: (id) => api.get(`/integrations/${id}`),
    create: (integrationData) => api.post('/integrations', integrationData),
    update: (id, integrationData) => api.put(`/integrations/${id}`, integrationData),
    delete: (id) => api.delete(`/integrations/${id}`),
    testConnection: (id) => api.post(`/integrations/${id}/test`),
    sync: (id) => api.post(`/integrations/${id}/sync`)
  },
  
  // Dashboard service
  dashboard: {
    getStats: () => api.get('/dashboard/stats'),
    getActivityFeed: () => api.get('/dashboard/activity')
  }
};

export default {
  ...services,
  httpClient: api
};
