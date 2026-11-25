import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { clearStoredStaffSession, getStoredStaffToken } from '../utils/staffSession';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredStaffToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getStoredStaffToken()) {
      clearStoredStaffSession();
      window.dispatchEvent(new Event('staff-auth-changed'));
    }
    return Promise.reject(error);
  }
);

export const orderApi = {
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getOrderForQRScan: async (id) => {
    const response = await api.get(`/orders/qr/${encodeURIComponent(id)}`);
    return response.data;
  },

  markAsReleased: async (orderId, releaseProofImage, releaseNotes, releasedBy) => {
    const response = await api.post('/orders/qr/release', { orderId, releaseProofImage, releaseNotes, releasedBy });
    return response.data;
  },

  updateOrder: async (id, data) => {
    if (data?.steps) {
      const response = await api.put(`/orders/${id}/steps`, {
        steps: data.steps,
        ...(data.players ? { players: data.players } : {}),
      });
      return response.data;
    }

    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },
};

export default api;
