import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

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

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('staffToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const orderApi = {
  // Get all orders
  getAllOrders: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get aggregated order stats
  getOrderStats: async () => {
    try {
      const response = await api.get('/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    try {
      const response = await api.put(`/orders/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Update order step
  updateOrderStep: async (id, step) => {
    try {
      const response = await api.put(`/orders/${id}/step`, { step });
      return response.data;
    } catch (error) {
      console.error('Error updating order step:', error);
      throw error;
    }
  },

  // Generic update order - can update any fields including steps
  updateOrder: async (id, data) => {
    try {
      // If updating steps, use the dedicated steps endpoint
      if (data.steps && Object.keys(data).length === 1) {
        const response = await api.put(`/orders/${id}/steps`, { steps: data.steps });
        return response.data;
      }
      // Otherwise use generic update
      const response = await api.put(`/orders/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error?.response?.data || error);
      throw error;
    }
  },

  // Assign employee to order
  assignEmployee: async (id, employeeId) => {
    try {
      const response = await api.put(`/orders/${id}/assign`, { employeeId });
      return response.data;
    } catch (error) {
      console.error('Error assigning employee:', error);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (id) => {
    try {
      const response = await api.put(`/orders/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  // Get QR code for order
  getOrderQR: async (id) => {
    try {
      const response = await api.get(`/orders/${id}/qr`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  // Mark order as released by scanning QR
  markAsReleased: async (orderId, releaseProofImage, releaseNotes, releasedBy) => {
    try {
      const response = await api.post('/orders/qr/release', { orderId, releaseProofImage, releaseNotes, releasedBy });
      return response.data;
    } catch (error) {
      console.error('Error marking order as released:', error);
      throw error;
    }
  },

  // Generate QR codes for all orders (admin only)
  generateMissingQRCodes: async () => {
    try {
      const response = await api.post('/orders/admin/generate-qr');
      return response.data;
    } catch (error) {
      console.error('Error generating QR codes:', error);
      throw error;
    }
  },

  // Archive order
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

  // Unarchive order
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
