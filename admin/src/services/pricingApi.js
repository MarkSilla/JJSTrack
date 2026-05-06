import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { attachAdminAuthInterceptors } from '../utils/adminApiAuth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachAdminAuthInterceptors(api);

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
