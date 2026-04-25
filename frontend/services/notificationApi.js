import api from './api.js';

const getStoredToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token') || '';

const getApiBaseUrl = () =>
  api?.defaults?.baseURL || 'http://localhost:4000/api';

export const getNotificationUpdatesWebSocketUrl = () => {
  const token = getStoredToken();
  if (!token) return '';

  const url = new URL(getApiBaseUrl());
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/notification-updates';
  url.search = new URLSearchParams({ token }).toString();
  url.hash = '';
  return url.toString();
};

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

export default notificationApi;
