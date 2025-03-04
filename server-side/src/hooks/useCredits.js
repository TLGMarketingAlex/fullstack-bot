// /frontend/src/hooks/useCredits.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useCredits = () => {
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);
        const response = await api.credits.getBalance();
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

  const fetchHistory = async (params = {}) => {
    try {
      setLoading(true);
      const response = await api.credits.getHistory(params);
      setHistory(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch credit history');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async (packageId) => {
    try {
      setLoading(true);
      const response = await api.credits.purchase(packageId);
      setCredits(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to purchase credits');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { credits, history, loading, error, fetchHistory, purchaseCredits };
};
