import { API_BASE_URL } from '../utils/apiBaseUrl';

const getStoredToken = () => localStorage.getItem('adminToken') || '';

export const getOrderFeedUpdatesWebSocketUrl = () => {
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

export default {
  getOrderFeedUpdatesWebSocketUrl,
};
