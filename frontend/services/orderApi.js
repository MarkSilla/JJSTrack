import api from './api.js';

export const orderApi = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Create Order Error:', error);
      throw error;
    }
  },

  // Get all orders
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Get Orders Error:', error);
      throw error;
    }
  },

  // Get order statistics
  getOrderStats: async () => {
    try {
      const response = await api.get('/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Get Order Stats Error:', error);
      throw error;
    }
  },

  // Get single order by ID
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Order By ID Error:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (id, data) => {
    try {
      const response = await api.put(`/orders/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Order Status Error:', error);
      throw error;
    }
  },

  // Update order steps
  updateOrderSteps: async (id, steps) => {
    try {
      const response = await api.put(`/orders/${id}/steps`, { steps });
      return response.data;
    } catch (error) {
      console.error('Update Order Steps Error:', error);
      throw error;
    }
  },

  // Delete order (admin only)
  deleteOrder: async (id) => {
    try {
      const response = await api.delete(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Order Error:', error);
      throw error;
    }
  },
};
