import axios from 'axios';
import { API_BASE_URL } from './api.js';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
};

export default api;
