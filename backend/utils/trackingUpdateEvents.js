import {
  broadcastFeedRefresh,
  broadcastTrackingUpdated,
} from './notificationSocketServer.js';

const normalizeValue = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  return value?.toString?.() || '';
};

const getRecipientId = (entity = {}) =>
  normalizeValue(entity?.userId?._id || entity?.userId);

export const emitBackofficeOrdersFeedRefresh = () => {
  broadcastFeedRefresh({
    audience: 'admin',
    channel: 'orders',
  });

  broadcastFeedRefresh({
    audience: 'staff',
    channel: 'orders',
  });
};

export const emitOrderTrackingUpdate = (order = {}, action = 'updated') => {
  emitBackofficeOrdersFeedRefresh();

  const recipientId = getRecipientId(order);
  if (!recipientId) {
    return;
  }

  broadcastTrackingUpdated({
    audience: 'user',
    recipientId,
    tracking: {
      entityType: 'order',
      entityId: order?._id,
      action,
      status: order?.status,
      orderId: order?.orderId || order?._id,
      bookingId: order?.bookingId || null,
      serviceType: order?.serviceType || '',
      updatedAt: order?.updatedAt || new Date().toISOString(),
    },
  });
};

export const emitBookingTrackingUpdate = (booking = {}, action = 'updated') => {
  emitBackofficeOrdersFeedRefresh();

  const recipientId = getRecipientId(booking);
  if (!recipientId) {
    return;
  }

  broadcastTrackingUpdated({
    audience: 'user',
    recipientId,
    tracking: {
      entityType: 'booking',
      entityId: booking?._id,
      action,
      status: booking?.status,
      orderId: booking?.orderId || null,
      bookingId: booking?.bookingId || booking?._id,
      bookingType: booking?.bookingType || '',
      serviceType: booking?.service || '',
      updatedAt: booking?.updatedAt || new Date().toISOString(),
    },
  });
};
