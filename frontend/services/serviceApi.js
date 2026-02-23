import api from './api.js';

export const serviceApi = {
  // Get all services
  getServices: async (params = {}) => {
    try {
      const response = await api.get('/services', { params });
      return response.data;
    } catch (error) {
      console.error('Get Services Error:', error);
      throw error;
    }
  },

  // Get single service by ID
  getServiceById: async (id) => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Service By ID Error:', error);
      throw error;
    }
  },

  // Create a new service (admin only)
  createService: async (serviceData) => {
    try {
      const response = await api.post('/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('Create Service Error:', error);
      throw error;
    }
  },

  // Update service (admin only)
  updateService: async (id, data) => {
    try {
      const response = await api.put(`/services/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Service Error:', error);
      throw error;
    }
  },

  // Delete service (admin only)
  deleteService: async (id) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Service Error:', error);
      throw error;
    }
  },

  // Seed default services
  seedServices: async () => {
    try {
      const response = await api.post('/services/seed');
      return response.data;
    } catch (error) {
      console.error('Seed Services Error:', error);
      throw error;
    }
  },
};
