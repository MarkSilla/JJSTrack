import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatApi = {
  getConversations: async (params = {}) => {
    const response = await api.get('/chat/conversations', { params });
    return response.data;
  },

  getMessages: async (params = {}) => {
    const response = await api.get('/chat/messages', { params });
    return response.data;
  },

  sendMessage: async (payload) => {
    const response = await api.post('/chat/messages', payload);
    return response.data;
  },

  markConversationRead: async (payload = {}) => {
    const response = await api.patch('/chat/messages/read', payload);
    return response.data;
  },

  editMessage: async ({ messageId, message }) => {
    const response = await api.patch(`/chat/messages/${messageId}`, { message });
    return response.data;
  },

  deleteMessageForEveryone: async ({ messageId }) => {
    const response = await api.delete(`/chat/messages/${messageId}/everyone`);
    return response.data;
  },

  deleteMessageForMe: async ({ messageId }) => {
    const response = await api.delete(`/chat/messages/${messageId}/me`);
    return response.data;
  },
};

export default api;
