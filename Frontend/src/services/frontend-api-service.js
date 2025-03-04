// /frontend/src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create base axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
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
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out user
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other error responses
    const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
    
    // Only show toast for non-auth errors (auth components handle their own errors)
    if (!originalRequest.url.includes('/auth/')) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// Content service
const content = {
  getAll: async (params = {}) => {
    return await apiClient.get('/content', { params });
  },
  
  getById: async (id) => {
    return await apiClient.get(`/content/${id}`);
  },
  
  create: async (data) => {
    return await apiClient.post('/content', data);
  },
  
  update: async (id, data) => {
    return await apiClient.put(`/content/${id}`, data);
  },
  
  delete: async (id) => {
    return await apiClient.delete(`/content/${id}`);
  },
  
  publish: async (id, integrationId, publishOptions = {}) => {
    return await apiClient.post(`/content/${id}/publish`, { 
      integrationId, 
      publishOptions 
    });
  },
  
  schedule: async (id, scheduledAt, integrationId, publishOptions = {}) => {
    return await apiClient.post(`/content/${id}/schedule`, { 
      scheduledAt, 
      integrationId, 
      publishOptions 
    });
  }
};

// Template service
const templates = {
  getAll: async (params = {}) => {
    return await apiClient.get('/templates', { params });
  },
  
  getById: async (id) => {
    return await apiClient.get(`/templates/${id}`);
  },
  
  create: async (data) => {
    return await apiClient.post('/templates', data);
  },
  
  update: async (id, data) => {
    return await apiClient.put(`/templates/${id}`, data);
  },
  
  delete: async (id) => {
    return await apiClient.delete(`/templates/${id}`);
  }
};

// Generation service
const generation = {
  create: async (data) => {
    return await apiClient.post('/generation', data);
  },
  
  getStatus: async (id) => {
    return await apiClient.get(`/generation/${id}`);
  },
  
  cancel: async (id) => {
    return await apiClient.post(`/generation/${id}/cancel`);
  },
  
  getHistory: async (params = {}) => {
    return await apiClient.get('/generation/history', { params });
  },
  
  regenerate: async (id, promptUpdates = {}) => {
    return await apiClient.post(`/generation/${id}/regenerate`, { promptUpdates });
  }
};

// Credits service
const credits = {
  getBalance: async () => {
    return await apiClient.get('/credits');
  },
  
  getHistory: async (params = {}) => {
    return await apiClient.get('/credits/history', { params });
  },
  
  purchase: async (packageId) => {
    return await apiClient.post('/credits/purchase', { packageId });
  }
};

// Integrations service
const integrations = {
  getAll: async () => {
    return await apiClient.get('/integrations');
  },
  
  getById: async (id) => {
    return await apiClient.get(`/integrations/${id}`);
  },
  
  create: async (data) => {
    return await apiClient.post('/integrations', data);
  },
  
  update: async (id, data) => {
    return await apiClient.put(`/integrations/${id}`, data);
  },
  
  delete: async (id) => {
    return await apiClient.delete(`/integrations/${id}`);
  },
  
  verify: async (id) => {
    return await apiClient.post(`/integrations/${id}/verify`);
  }
};

// Dashboard service
const dashboard = {
  getStats: async () => {
    return await apiClient.get('/dashboard/stats');
  },
  
  getRecentActivity: async () => {
    return await apiClient.get('/dashboard/activity');
  }
};

// Auth specific methods (not using toast error handling)
const auth = {
  login: async (credentials) => {
    return await apiClient.post('/auth/login', credentials);
  },
  
  register: async (userData) => {
    return await apiClient.post('/auth/register', userData);
  },
  
  refreshToken: async () => {
    return await apiClient.post('/auth/refresh-token');
  },
  
  logout: async () => {
    return await apiClient.post('/auth/logout');
  },
  
  requestPasswordReset: async (email) => {
    return await apiClient.post('/auth/request-password-reset', { email });
  },
  
  resetPassword: async (token, password) => {
    return await apiClient.post(`/auth/reset-password/${token}`, { password });
  },
  
  getCurrentUser: async () => {
    return await apiClient.get('/auth/me');
  },
  
  updateProfile: async (profileData) => {
    return await apiClient.put('/auth/profile', profileData);
  },
  
  changePassword: async (passwordData) => {
    return await apiClient.put('/auth/change-password', passwordData);
  }
};

// Single API object with all services
const api = {
  content,
  templates,
  generation,
  credits,
  integrations,
  dashboard,
  auth
};

export default api;
