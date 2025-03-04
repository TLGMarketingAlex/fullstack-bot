// /frontend/src/hooks/useContentItem.js
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
        const response = await api.content.getById(contentId);
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
      const response = await api.content.update(contentId, data);
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
      const response = await api.generation.generate({
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
