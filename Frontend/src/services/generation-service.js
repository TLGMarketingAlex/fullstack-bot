import api from './api';

const generationService = {
  generateContent: (params) => {
    return api.post('/generation/content', params);
  },
  
  generateVariations: (contentId, params) => {
    return api.post(`/generation/content/${contentId}/variations`, params);
  },
  
  generateFromTemplate: (templateId, params) => {
    return api.post(`/generation/template/${templateId}`, params);
  },
  
  getHistory: (params) => {
    return api.get('/generation/history', { params });
  },
  
  cancelGeneration: (jobId) => {
    return api.post(`/generation/cancel/${jobId}`);
  },
  
  getStatus: (jobId) => {
    return api.get(`/generation/status/${jobId}`);
  },
  
  getModels: () => {
    return api.get('/generation/models');
  },
  
  saveGeneratedContent: (generationId, params) => {
    return api.post(`/generation/${generationId}/save`, params);
  },
  
  generateSeo: (contentId) => {
    return api.post(`/generation/seo/${contentId}`);
  }
};

export default generationService;