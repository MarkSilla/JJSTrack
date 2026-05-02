import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const orderApi = {
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
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
