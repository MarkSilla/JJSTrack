import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const pricingApi = {
  // Get all pricing
  getAllPricing: async () => {
    try {
      const response = await api.get('/pricing');
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing:', error);
      throw error;
    }
  },

  // Get pricing by service type
  getPricingByType: async (serviceType) => {
    try {
      const response = await api.get(`/pricing/${serviceType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing for type:', error);
      throw error;
    }
  },

  // Create or update pricing
  saveOrUpdatePricing: async (serviceType, pricingData) => {
    try {
      const response = await api.put(`/pricing/${serviceType}`, {
        serviceType,
        ...pricingData
      });
      return response.data;
    } catch (error) {
      console.error('Error saving pricing:', error);
      throw error;
    }
  },

  // Delete pricing
  deletePricing: async (serviceType) => {
    try {
      const response = await api.delete(`/pricing/${serviceType}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting pricing:', error);
      throw error;
    }
  },
};

export default api;
