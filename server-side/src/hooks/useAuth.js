// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// src/hooks/useContentItem.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useContentItem = (contentId) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/content/${contentId}`);
        setContent(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch content');
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchContent();
    } else {
      setContent(null);
      setLoading(false);
    }
  }, [contentId]);

  const updateContent = async (data) => {
    try {
      setLoading(true);
      const response = await api.put(`/content/${contentId}`, data);
      setContent(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update content');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (prompt, options) => {
    try {
      setLoading(true);
      const response = await api.post(`/generation/generate`, {
        contentId,
        prompt,
        options
      });
      setContent(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate content');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, error, updateContent, generateContent };
};

// src/hooks/useTemplates.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await api.get('/templates');
        setTemplates(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const createTemplate = async (data) => {
    try {
      setLoading(true);
      const response = await api.post('/templates', data);
      setTemplates([...templates, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create template');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (id, data) => {
    try {
      setLoading(true);
      const response = await api.put(`/templates/${id}`, data);
      setTemplates(templates.map(t => t.id === id ? response.data : t));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update template');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete template');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { templates, loading, error, createTemplate, updateTemplate, deleteTemplate };
};

// src/hooks/useCredits.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useCredits = () => {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);
        const response = await api.get('/credits');
        setCredits(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch credit information');
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  return { credits, loading, error };
};
