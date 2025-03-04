import api from './api';

const integrationService = {
  getAll: () => {
    return api.get('/integrations');
  },
  
  getById: (id) => {
    return api.get(`/integrations/${id}`);
  },
  
  connect: (integrationId, credentials) => {
    return api.post(`/integrations/${integrationId}/connect`, credentials);
  },
  
  disconnect: (integrationId) => {
    return api.post(`/integrations/${integrationId}/disconnect`);
  },
  
  getStatus: (integrationId) => {
    return api.get(`/integrations/${integrationId}/status`);
  },
  
  getAvailable: () => {
    return api.get('/integrations/available');
  },
  
  publishContent: (contentId, integrationId, settings) => {
    return api.post(`/integrations/${integrationId}/publish/${contentId}`, settings);
  },
  
  syncContent: (integrationId) => {
    return api.post(`/integrations/${integrationId}/sync`);
  },
  
  getContentPlatforms: () => {
    return api.get('/integrations/platforms');
  },
  
  getSettings: (integrationId) => {
    return api.get(`/integrations/${integrationId}/settings`);
  },
  
  updateSettings: (integrationId, settings) => {
    return api.put(`/integrations/${integrationId}/settings`, settings);
  }
};

export default integrationService;