import { API_BASE_URL } from '../utils/apiBaseUrl';
import { getAdminAuthToken } from '../utils/adminApiAuth';

export const getOrderFeedUpdatesWebSocketUrl = () => {
  const token = getAdminAuthToken();
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
