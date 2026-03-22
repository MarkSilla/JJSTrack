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

export const inventoryApi = {
  // Get all inventory items
  getAllInventory: async () => {
    try {
      const response = await api.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get inventory by ID
  getInventoryById: async (id) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  },

  // Get inventory by category
  getInventoryByCategory: async (category) => {
    try {
      const response = await api.get(`/inventory/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory by category:', error);
      throw error;
    }
  },

  // Create new inventory item
  createInventory: async (data) => {
    try {
      const response = await api.post('/inventory', data);
      return response.data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  // Update inventory item
  updateInventory: async (id, data) => {
    try {
      const response = await api.put(`/inventory/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Adjust stock (increase or decrease)
  adjustStock: async (id, type, amount) => {
    try {
      const response = await api.patch(`/inventory/${id}/adjust`, {
        type,
        amount,
      });
      return response.data;
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  },

  // Archive inventory item
  archiveInventory: async (id) => {
    try {
      const response = await api.patch(`/inventory/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving inventory item:', error);
      throw error;
    }
  },

  // Restore inventory item
  restoreInventory: async (id) => {
    try {
      const response = await api.patch(`/inventory/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring inventory item:', error);
      throw error;
    }
  },

  // Get inventory statistics
  getInventoryStats: async () => {
    try {
      const response = await api.get('/inventory/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  },

  // Search inventory
  searchInventory: async (query, category, status) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);
      if (status) params.append('status', status);

      const response = await api.get(`/inventory/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  },
};
