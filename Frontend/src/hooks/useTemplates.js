// /frontend/src/hooks/useTemplates.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await api.templates.getAll();
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
      const response = await api.templates.create(data);
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
      const response = await api.templates.update(id, data);
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
      await api.templates.delete(id);
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
