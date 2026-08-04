import api from './api.js';

export const pageViewApi = {
  recordPageView: async () => {
    try {
      const response = await api.post('/page-views/record');
      return response.data;
    } catch (error) {
      console.error('Error recording page view:', error);
      return { success: false, count: null };
    }
  },

  getPageViewCount: async () => {
    try {
      const response = await api.get('/page-views');
      return response.data;
    } catch (error) {
      console.error('Error fetching page view count:', error);
      return { success: false, count: null };
    }
  },

  resetPageViewCount: async () => {
    try {
      const response = await api.post('/page-views/reset');
      return response.data;
    } catch (error) {
      console.error('Error resetting page view count:', error);
      return { success: false, count: null };
    }
  },
};
