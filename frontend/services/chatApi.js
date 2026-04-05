import api from './api.js';

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
};

export default chatApi;
