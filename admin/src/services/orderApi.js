import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { attachAdminAuthInterceptors } from '../utils/adminApiAuth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAdminArchiveActor = () => {
  try {
    const rawUser = localStorage.getItem('adminUser');
    if (!rawUser) return 'Admin';

    const parsedUser = JSON.parse(rawUser);
    return parsedUser?.fullName || parsedUser?.name || parsedUser?.email || 'Admin';
  } catch {
    return 'Admin';
  }
};

attachAdminAuthInterceptors(api);

export const orderApi = {
  getAllOrders: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  getOrderStats: async () => {
    try {
      const response = await api.get('/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  },

  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const response = await api.put(`/orders/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  updateOrderStep: async (id, step) => {
    try {
      const response = await api.put(`/orders/${id}/step`, { step });
      return response.data;
    } catch (error) {
      console.error('Error updating order step:', error);
      throw error;
    }
  },

  updateOrder: async (id, data) => {
    try {
      if (data.steps && Object.keys(data).length === 1) {
        const response = await api.put(`/orders/${id}/steps`, { steps: data.steps });
        return response.data;
      }
      const response = await api.put(`/orders/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error?.response?.data || error);
      throw error;
    }
  },

  assignEmployee: async (id, employeeId) => {
    try {
      const response = await api.put(`/orders/${id}/assign`, { employeeId });
      return response.data;
    } catch (error) {
      console.error('Error assigning employee:', error);
      throw error;
    }
  },

  cancelOrder: async (id, data = {}) => {
    try {
      const response = await api.put(`/orders/${id}/cancel`, data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  getOrderQR: async (id) => {
    try {
      const response = await api.get(`/orders/${id}/qr`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  markAsReleased: async (orderId, releaseProofImage, releaseNotes, releasedBy) => {
    try {
      const response = await api.post('/orders/qr/release', { orderId, releaseProofImage, releaseNotes, releasedBy });
      return response.data;
    } catch (error) {
      console.error('Error marking order as released:', error);
      throw error;
    }
  },

  generateMissingQRCodes: async () => {
    try {
      const response = await api.post('/orders/admin/generate-qr');
      return response.data;
    } catch (error) {
      console.error('Error generating QR codes:', error);
      throw error;
    }
  },

  archiveOrder: async (id) => {
    try {
      const archivedAt = new Date().toISOString();
      const response = await api.put(`/orders/${id}`, {
        isArchived: true,
        completedAt: archivedAt,
        archivedAt,
        archivedBy: getAdminArchiveActor(),
      });
      return response.data;
    } catch (error) {
      console.error('Error archiving order:', error);
      throw error;
    }
  },

  unarchiveOrder: async (id) => {
    try {
      const response = await api.put(`/orders/${id}`, {
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
      });
      return response.data;
    } catch (error) {
      console.error('Error unarchiving order:', error);
      throw error;
    }
  },
};

export default api;
