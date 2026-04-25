import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';

const getStoredToken = () =>
  localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken') || '';

export const getNotificationUpdatesWebSocketUrl = () => {
  const token = getStoredToken();
  if (!token) {
    return '';
  }

  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/notification-updates';
  url.search = new URLSearchParams({ token }).toString();
  url.hash = '';
  return url.toString();
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const notificationApi = {
  getNotifications: async (limit = 20) => {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export default api;
