import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { registerSocketUpgradeRoute } from './socketUpgradeRouter.js';

let notificationSocketServer = null;

const buildSocketMessage = (type, payload = {}) =>
  JSON.stringify({
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  });

const normalizeEntityId = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  return value?.toString?.() || '';
};

const resolveAudienceFromRole = (role = 'user') => {
  if (role === 'admin') return 'admin';
  if (role === 'staff') return 'staff';
  return 'user';
};

const parseSocketSession = (request) => {
  try {
    const requestUrl = new URL(
      request.url || '',
      `http://${request.headers.host || 'localhost'}`
    );
    const token = requestUrl.searchParams.get('token');

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const userId = mongoose.isValidObjectId(decoded?.id)
      ? String(decoded.id)
      : null;

    return {
      audience: resolveAudienceFromRole(decoded?.role),
      role: decoded?.role || 'user',
      userId,
    };
  } catch (error) {
    return null;
  }
};

const serializeNotification = (notification) => ({
  _id: notification._id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  route: notification.route || '',
  entityId: notification.entityId || null,
  entityModel: notification.entityModel || '',
  isRead: Boolean(notification.isRead),
  readAt: notification.readAt || null,
  createdAt: notification.createdAt,
  metadata: notification.metadata || {},
});

const canReceiveAudience = (session, { audience = 'user', recipientId = '' } = {}) => {
  if (!session?.audience || session.audience !== audience) {
    return false;
  }

  const normalizedRecipientId = normalizeEntityId(recipientId);

  if (session.audience === 'user' && !normalizedRecipientId) {
    return false;
  }

  if (!normalizedRecipientId) {
    return true;
  }

  return session.userId === normalizedRecipientId;
};

const canReceiveNotification = (session, notification = {}) =>
  canReceiveAudience(session, {
    audience: notification?.audience,
    recipientId: notification?.recipientId,
  });

const serializeTrackingUpdate = (tracking = {}) => {
  const entityType =
    tracking?.entityType === 'booking' || tracking?.entityType === 'order'
      ? tracking.entityType
      : '';

  if (!entityType) {
    return null;
  }

  return {
    entityType,
    entityId: normalizeEntityId(tracking?.entityId) || null,
    action: String(tracking?.action || 'updated').trim() || 'updated',
    status: String(tracking?.status || '').trim(),
    orderId: normalizeEntityId(tracking?.orderId) || null,
    bookingId: normalizeEntityId(tracking?.bookingId) || null,
    bookingType: String(tracking?.bookingType || '').trim(),
    serviceType: String(tracking?.serviceType || '').trim(),
    updatedAt: tracking?.updatedAt || new Date().toISOString(),
  };
};

const normalizeFeedChannel = (value = '') => {
  const channel = String(value || '').trim();
  return channel || 'orders';
};

export const attachNotificationSocketServer = (server) => {
  if (notificationSocketServer) {
    return notificationSocketServer;
  }

  notificationSocketServer = new WebSocketServer({
    noServer: true,
  });

  registerSocketUpgradeRoute({
    server,
    path: '/notification-updates',
    socketServer: notificationSocketServer,
  });

  notificationSocketServer.on('connection', (socket, request) => {
    const session = parseSocketSession(request);

    if (!session?.audience) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    socket.notificationSession = session;
    socket.send(
      buildSocketMessage('notification:connected', {
        audience: session.audience,
      })
    );
  });

  return notificationSocketServer;
};

export const broadcastNotificationCreated = (notification) => {
  if (!notificationSocketServer || !notification?._id) {
    return;
  }

  const message = buildSocketMessage('notification:created', {
    notification: serializeNotification(notification),
  });

  notificationSocketServer.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!canReceiveNotification(client.notificationSession, notification)) {
      return;
    }

    client.send(message);
  });
};

export const broadcastTrackingUpdated = ({
  audience = 'user',
  recipientId = '',
  tracking,
} = {}) => {
  if (!notificationSocketServer) {
    return;
  }

  const serializedTracking = serializeTrackingUpdate(tracking);
  if (!serializedTracking) {
    return;
  }

  const normalizedRecipientId = normalizeEntityId(recipientId);
  if (audience === 'user' && !normalizedRecipientId) {
    return;
  }

  const message = buildSocketMessage('tracking:updated', {
    tracking: serializedTracking,
  });

  notificationSocketServer.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    if (
      !canReceiveAudience(client.notificationSession, {
        audience,
        recipientId: normalizedRecipientId,
      })
    ) {
      return;
    }

    client.send(message);
  });
};

export const broadcastFeedRefresh = ({
  audience = 'admin',
  recipientId = '',
  channel = 'orders',
} = {}) => {
  if (!notificationSocketServer) {
    return;
  }

  const normalizedRecipientId = normalizeEntityId(recipientId);
  if (audience === 'user' && !normalizedRecipientId) {
    return;
  }

  const message = buildSocketMessage('feed:refresh', {
    channel: normalizeFeedChannel(channel),
  });

  notificationSocketServer.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    if (
      !canReceiveAudience(client.notificationSession, {
        audience,
        recipientId: normalizedRecipientId,
      })
    ) {
      return;
    }

    client.send(message);
  });
};
