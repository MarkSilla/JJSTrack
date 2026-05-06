import mongoose from 'mongoose';
import orderModel from '../models/orderModel.js';
import bookingModel from '../models/bookingModel.js';
import notificationModel from '../models/notificationModel.js';
import { createNotification } from './notificationHelpers.js';
import { getPrimaryRepairOptionName } from './repairDisplay.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOWS = new Set([0, 1, 2]);
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

const reminderSyncStateByUser = new Map();

const normalizeEntityId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || '';

const parseScheduleDate = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return null;

  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const parsedDate = new Date(year, month, day, 12, 0, 0, 0);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    12,
    0,
    0,
    0
  );
};

const getTodayReference = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
};

const getDaysUntilSchedule = (scheduleDate, todayReference) =>
  Math.round((scheduleDate.getTime() - todayReference.getTime()) / DAY_MS);

const formatReminderDate = (scheduleDate) =>
  scheduleDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatDateKey = (scheduleDate) => {
  const year = scheduleDate.getFullYear();
  const month = String(scheduleDate.getMonth() + 1).padStart(2, '0');
  const day = String(scheduleDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getReminderStage = (daysUntilSchedule) => {
  if (daysUntilSchedule <= 0) return 'today';
  if (daysUntilSchedule === 1) return 'tomorrow';
  return 'soon';
};

const getStageTitleSuffix = (daysUntilSchedule) => {
  if (daysUntilSchedule <= 0) return 'due today';
  if (daysUntilSchedule === 1) return 'due tomorrow';
  return 'coming up';
};

const getOrderReferenceLabel = (order = {}) =>
  order.orderId || `Order ${String(order._id || '').slice(-6).toUpperCase()}`;

const getOrderSubjectLabel = (order = {}) =>
  String(order?.item || order?.serviceType || 'order').trim() || 'order';

const getBookingReferenceLabel = (booking = {}) =>
  booking.bookingId || `Booking ${String(booking._id || '').slice(-6).toUpperCase()}`;

const getBookingSubjectLabel = (booking = {}) => {
  if (booking?.bookingType === 'jersey') {
    return String(booking?.teamName || booking?.service || 'Team Jersey').trim() || 'Team Jersey';
  }

  if (booking?.bookingType === 'organizational') {
    return String(booking?.orgName || booking?.service || 'Organization').trim() || 'Organization';
  }

  if (booking?.bookingType === 'repair') {
    return getPrimaryRepairOptionName(booking, 'Repair');
  }

  return String(booking?.service || 'booking').trim() || 'booking';
};

const getPickupSlotSuffix = (pickupSlot = '') =>
  pickupSlot ? ` at ${String(pickupSlot).trim()}` : '';

const getOrderSchedule = (order = {}) => {
  if (order?.pickupDate) {
    return {
      date: order.pickupDate,
      source: 'pickup',
      label: 'pickup',
    };
  }

  if (order?.estimatedCompletion) {
    return {
      date: order.estimatedCompletion,
      source: 'estimated-completion',
      label: 'estimated completion',
    };
  }

  return null;
};

const buildReminderMessage = ({
  subjectLabel,
  referenceLabel,
  scheduleLabel = 'pickup',
  scheduleDate,
  daysUntilSchedule,
  pickupSlot = '',
}) => {
  const pickupSlotSuffix = getPickupSlotSuffix(pickupSlot);

  if (daysUntilSchedule <= 0) {
    return `Your ${subjectLabel} (${referenceLabel}) is scheduled for ${scheduleLabel} today${pickupSlotSuffix}.`;
  }

  const dateLabel = formatReminderDate(scheduleDate);

  if (daysUntilSchedule === 1) {
    return `Your ${subjectLabel} (${referenceLabel}) is scheduled for ${scheduleLabel} tomorrow, ${dateLabel}${pickupSlotSuffix}.`;
  }

  return `Your ${subjectLabel} (${referenceLabel}) is scheduled for ${scheduleLabel} in ${daysUntilSchedule} days on ${dateLabel}${pickupSlotSuffix}.`;
};

const createOrderReminder = async ({ order, recipientId, todayReference }) => {
  const schedule = getOrderSchedule(order);
  if (!schedule) return null;

  const scheduleDate = parseScheduleDate(schedule.date);
  if (!scheduleDate) return null;

  const daysUntilSchedule = getDaysUntilSchedule(scheduleDate, todayReference);
  if (!REMINDER_WINDOWS.has(daysUntilSchedule)) return null;

  const reminderStage = getReminderStage(daysUntilSchedule);
  const scheduleDateKey = formatDateKey(scheduleDate);
  const reminderKey = `user-order-${order._id}-${schedule.source}-${scheduleDateKey}-${reminderStage}`;

  const existingNotification = await notificationModel.exists({
    audience: 'user',
    recipientId,
    type: 'order',
    entityId: order._id,
    'metadata.reminderKey': reminderKey,
  });

  if (existingNotification) return null;

  const referenceLabel = getOrderReferenceLabel(order);
  const subjectLabel = getOrderSubjectLabel(order);

  return createNotification({
    audience: 'user',
    recipientId,
    type: 'order',
    title: `Order ${getStageTitleSuffix(daysUntilSchedule)}`,
    message: buildReminderMessage({
      subjectLabel,
      referenceLabel,
      scheduleLabel: schedule.label,
      scheduleDate,
      daysUntilSchedule,
      pickupSlot: order?.pickupSlot || '',
    }),
    route: '/order',
    entityId: order._id,
    entityModel: 'Order',
    createdByRole: 'system',
    metadata: {
      event: 'user_order_reminder',
      reminderKey,
      reminderStage,
      scheduleSource: schedule.source,
      scheduleDate: schedule.date,
      pickupSlot: order?.pickupSlot || '',
      daysUntilSchedule,
      orderId: referenceLabel,
      serviceType: order?.serviceType || '',
      subjectLabel,
    },
  });
};

const createBookingReminder = async ({ booking, recipientId, todayReference }) => {
  const scheduleDate = parseScheduleDate(booking?.pickupDate);
  if (!scheduleDate) return null;

  const daysUntilSchedule = getDaysUntilSchedule(scheduleDate, todayReference);
  if (!REMINDER_WINDOWS.has(daysUntilSchedule)) return null;

  const reminderStage = getReminderStage(daysUntilSchedule);
  const scheduleDateKey = formatDateKey(scheduleDate);
  const reminderKey = `user-booking-pickup-${booking._id}-${scheduleDateKey}-${reminderStage}`;

  const existingNotification = await notificationModel.exists({
    audience: 'user',
    recipientId,
    type: 'booking',
    entityId: booking._id,
    'metadata.reminderKey': reminderKey,
  });

  if (existingNotification) return null;

  const referenceLabel = getBookingReferenceLabel(booking);
  const subjectLabel = getBookingSubjectLabel(booking);

  return createNotification({
    audience: 'user',
    recipientId,
    type: 'booking',
    title: `Booking pickup ${getStageTitleSuffix(daysUntilSchedule)}`,
    message: buildReminderMessage({
      subjectLabel,
      referenceLabel,
      scheduleLabel: 'pickup',
      scheduleDate,
      daysUntilSchedule,
      pickupSlot: booking?.pickupSlot || '',
    }),
    route: '/order',
    entityId: booking._id,
    entityModel: 'Booking',
    createdByRole: 'system',
    metadata: {
      event: 'user_order_reminder',
      reminderKey,
      reminderStage,
      scheduleSource: 'pickup',
      pickupDate: booking?.pickupDate || '',
      pickupSlot: booking?.pickupSlot || '',
      daysUntilSchedule,
      bookingId: referenceLabel,
      bookingType: booking?.bookingType || '',
      service: booking?.service || '',
      subjectLabel,
      orderId: normalizeEntityId(booking?.orderId) || null,
    },
  });
};

const syncUpcomingUserOrderNotificationsInternal = async (recipientId) => {
  const todayReference = getTodayReference();

  const [orders, bookings] = await Promise.all([
    orderModel
      .find({
        userId: recipientId,
        status: { $nin: ['Cancelled', 'Released'] },
        isReleased: { $ne: true },
        isArchived: { $ne: true },
        $or: [
          { pickupDate: { $exists: true, $ne: '' } },
          { estimatedCompletion: { $exists: true, $ne: '' } },
        ],
      })
      .select('_id orderId item serviceType pickupDate pickupSlot estimatedCompletion status')
      .lean(),
    bookingModel
      .find({
        userId: recipientId,
        pickupDate: { $exists: true, $ne: '' },
        status: { $nin: ['Cancelled', 'Released'] },
        isPickedUp: { $ne: true },
        isArchived: { $ne: true },
      })
      .select('_id bookingId bookingType service teamName orgName repairDescription pickupDate pickupSlot status orderId')
      .lean(),
  ]);

  let createdCount = 0;

  await Promise.all(
    orders.map(async (order) => {
      const createdNotification = await createOrderReminder({
        order,
        recipientId,
        todayReference,
      });

      if (createdNotification?._id) {
        createdCount += 1;
      }
    })
  );

  await Promise.all(
    bookings.map(async (booking) => {
      const createdNotification = await createBookingReminder({
        booking,
        recipientId,
        todayReference,
      });

      if (createdNotification?._id) {
        createdCount += 1;
      }
    })
  );

  return createdCount;
};

export const syncUpcomingUserOrderNotifications = async ({
  recipientId,
  force = false,
} = {}) => {
  const normalizedRecipientId = normalizeEntityId(recipientId);
  if (!mongoose.isValidObjectId(normalizedRecipientId)) {
    return 0;
  }

  const state = reminderSyncStateByUser.get(normalizedRecipientId) || {
    lastSyncAt: 0,
    promise: null,
  };
  const now = Date.now();

  if (state.promise) {
    return state.promise;
  }

  if (!force && now - state.lastSyncAt < SYNC_COOLDOWN_MS) {
    return 0;
  }

  state.promise = (async () => {
    try {
      const createdCount = await syncUpcomingUserOrderNotificationsInternal(normalizedRecipientId);
      state.lastSyncAt = Date.now();
      return createdCount;
    } catch (error) {
      console.error('Failed to sync user order reminder notifications:', error);
      return 0;
    } finally {
      state.promise = null;
      reminderSyncStateByUser.set(normalizedRecipientId, state);
    }
  })();

  reminderSyncStateByUser.set(normalizedRecipientId, state);
  return state.promise;
};
