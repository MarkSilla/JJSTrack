import mongoose from 'mongoose';
import notificationModel from '../models/notificationModel.js';
import { getRequestActor } from '../utils/requestActor.js';
import { resolveNotificationAudience } from '../utils/notificationHelpers.js';
import { syncUpcomingBookingNotifications } from '../utils/bookingReminderNotifications.js';

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

const getAudienceForRequest = async (req) => {
  const actor = await getRequestActor(req);

  if (!actor) {
    return null;
  }

  return resolveNotificationAudience(actor.role);
};

export const getNotifications = async (req, res) => {
  try {
    const audience = await getAudienceForRequest(req);

    if (!audience) {
      return res.status(403).json({
        success: false,
        message: 'Unable to resolve notification audience',
      });
    }

    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 10;

    if (audience === 'admin') {
      await syncUpcomingBookingNotifications();
    }

    const [notifications, unreadCount] = await Promise.all([
      notificationModel.find({ audience }).sort({ createdAt: -1 }).limit(limit).lean(),
      notificationModel.countDocuments({ audience, isRead: false }),
    ]);

    res.json({
      success: true,
      notifications: notifications.map(serializeNotification),
      unreadCount,
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const audience = await getAudienceForRequest(req);

    if (!audience) {
      return res.status(403).json({
        success: false,
        message: 'Unable to resolve notification audience',
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification id',
      });
    }

    const notification = await notificationModel.findOneAndUpdate(
      { _id: id, audience },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      notification: serializeNotification(notification),
    });
  } catch (error) {
    console.error('Mark Notification As Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const audience = await getAudienceForRequest(req);

    if (!audience) {
      return res.status(403).json({
        success: false,
        message: 'Unable to resolve notification audience',
      });
    }

    const result = await notificationModel.updateMany(
      { audience, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error('Mark All Notifications As Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
    });
  }
};
