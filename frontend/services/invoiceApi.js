import api from './api.js';

export const invoiceApi = {
  // Create a new invoice
  createInvoice: async (invoiceData) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Create Invoice Error:', error);
      throw error;
    }
  },

  // Get all invoices
  getInvoices: async (params = {}) => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      console.error('Get Invoices Error:', error);
      throw error;
    }
  },

  // Get invoice statistics
  getInvoiceStats: async () => {
    try {
      const response = await api.get('/invoices/stats');
      return response.data;
    } catch (error) {
      console.error('Get Invoice Stats Error:', error);
      throw error;
    }
  },

  // Get single invoice by ID
  getInvoiceById: async (id) => {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Invoice By ID Error:', error);
      throw error;
    }
  },

  // Update invoice
  updateInvoice: async (id, data) => {
    try {
      const response = await api.put(`/invoices/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Invoice Error:', error);
      throw error;
    }
  },

  // Update invoice status
  updateInvoiceStatus: async (id, data) => {
    try {
      const response = await api.put(`/invoices/${id}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Update Invoice Status Error:', error);
      throw error;
    }
  },

  // Delete invoice (admin only)
  deleteInvoice: async (id) => {
    try {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Invoice Error:', error);
      throw error;
    }
  },
};
