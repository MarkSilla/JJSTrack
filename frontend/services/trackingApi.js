import { getNotificationUpdatesWebSocketUrl } from './notificationApi.js';

export const getTrackingUpdatesWebSocketUrl = () => getNotificationUpdatesWebSocketUrl();

export default {
  getTrackingUpdatesWebSocketUrl,
};
