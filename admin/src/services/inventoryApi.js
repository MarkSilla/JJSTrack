import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { attachAdminAuthInterceptors } from '../utils/adminApiAuth';

export { API_BASE_URL };

export const getInventoryUpdatesWebSocketUrl = () => {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/inventory-updates';
  url.search = '';
  url.hash = '';
  return url.toString();
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachAdminAuthInterceptors(api);

export const inventoryApi = {
  getInventorySettings: async () => {
    try {
      const response = await api.get('/inventory/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory settings:', error);
      throw error;
    }
  },

  updateInventorySettings: async (settings) => {
    try {
      const response = await api.put('/inventory/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating inventory settings:', error);
      throw error;
    }
  },

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

  // Get recent inventory activity
  getInventoryActivity: async (limit = 20) => {
    try {
      const response = await api.get(`/inventory/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory activity:', error);
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
  adjustStock: async (id, type, amount, options = {}) => {
    try {
      const response = await api.patch(`/inventory/${id}/adjust`, {
        type,
        amount,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  },

  previewFifo: async (id, quantity) => {
    try {
      const response = await api.get(`/inventory/${id}/fifo-preview`, {
        params: { quantity },
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing FIFO deduction:', error);
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
