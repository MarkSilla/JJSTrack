import bookingModel from '../models/bookingModel.js';
import notificationModel from '../models/notificationModel.js';
import { createNotification } from './notificationHelpers.js';

const REMINDER_LEAD_MS = 30 * 60 * 1000;
const SYNC_INTERVAL_MS = 60 * 1000;

const SLOT_START_TIMES = {
  morning: { hours: 8, minutes: 0 },
  afternoon: { hours: 13, minutes: 0 },
  evening: { hours: 17, minutes: 0 },
};

let reminderSyncPromise = null;
let repairReminderInterval = null;

const normalizeEntityId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || '';

const parsePickupDate = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return null;

  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    return {
      year: Number(dateOnlyMatch[1]),
      month: Number(dateOnlyMatch[2]) - 1,
      day: Number(dateOnlyMatch[3]),
    };
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    year: parsedDate.getFullYear(),
    month: parsedDate.getMonth(),
    day: parsedDate.getDate(),
  };
};

const parseStartTime = (pickupSlot = '') => {
  const normalizedSlot = String(pickupSlot || '').trim().toLowerCase();

  if (SLOT_START_TIMES[normalizedSlot]) {
    return SLOT_START_TIMES[normalizedSlot];
  }

  const matchedTime = String(pickupSlot || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!matchedTime) {
    return null;
  }

  let hours = Number(matchedTime[1]) % 12;
  const minutes = Number(matchedTime[2]) || 0;
  const meridiem = String(matchedTime[3] || '').toUpperCase();

  if (meridiem === 'PM') {
    hours += 12;
  }

  return { hours, minutes };
};

const parsePickupStartAt = (pickupDate, pickupSlot) => {
  const pickupDay = parsePickupDate(pickupDate);
  const pickupTime = parseStartTime(pickupSlot);

  if (!pickupDay || !pickupTime) {
    return null;
  }

  return new Date(
    pickupDay.year,
    pickupDay.month,
    pickupDay.day,
    pickupTime.hours,
    pickupTime.minutes,
    0,
    0
  );
};

const getBookingReferenceLabel = (booking = {}) =>
  String(
    booking?.bookingId || `Booking ${String(booking?._id || '').slice(-6).toUpperCase()}`
  ).trim();

const getRepairSubjectLabel = (booking = {}) =>
  String(booking?.repairDescription || booking?.service || 'Repair').trim() || 'Repair';

const getPickupSlotLabel = (pickupSlot = '') => {
  const slotKey = String(pickupSlot || '').trim().toLowerCase();

  if (slotKey === 'morning') return 'Morning (8:00 AM)';
  if (slotKey === 'afternoon') return 'Afternoon (1:00 PM)';
  if (slotKey === 'evening') return 'Evening (5:00 PM)';

  return String(pickupSlot || '').trim() || 'your scheduled slot';
};

const buildReminderMessage = (booking = {}) => {
  const bookingReference = getBookingReferenceLabel(booking);
  const subjectLabel = getRepairSubjectLabel(booking);
  const pickupSlotLabel = getPickupSlotLabel(booking?.pickupSlot);

  return `Your repair booking for ${subjectLabel} (${bookingReference}) is scheduled for pickup in about 30 minutes at ${pickupSlotLabel}.`;
};

const syncRepairPickupReminderNotificationsInternal = async () => {
  const now = new Date();

  const bookings = await bookingModel
    .find({
      bookingType: 'repair',
      userId: { $exists: true, $ne: null },
      pickupDate: { $exists: true, $ne: '' },
      pickupSlot: { $exists: true, $ne: '' },
      status: { $nin: ['Cancelled', 'Released'] },
      isArchived: { $ne: true },
    })
    .select('_id bookingId userId orderId service repairDescription pickupDate pickupSlot status')
    .lean();

  let createdCount = 0;

  await Promise.all(
    bookings.map(async (booking) => {
      const recipientId = normalizeEntityId(booking?.userId);
      if (!recipientId) return;

      const pickupStartAt = parsePickupStartAt(booking?.pickupDate, booking?.pickupSlot);
      if (!pickupStartAt) return;

      const reminderAt = new Date(pickupStartAt.getTime() - REMINDER_LEAD_MS);
      if (now < reminderAt || now >= pickupStartAt) return;

      const reminderKey = `repair-pickup-30m-${booking._id}-${pickupStartAt.getTime()}`;
      const existingNotification = await notificationModel.exists({
        audience: 'user',
        recipientId,
        type: 'booking',
        entityId: booking._id,
        'metadata.reminderKey': reminderKey,
      });

      if (existingNotification) return;

      const createdNotification = await createNotification({
        audience: 'user',
        recipientId,
        type: 'booking',
        title: 'Repair pickup reminder',
        message: buildReminderMessage(booking),
        route: '/appointment',
        entityId: booking._id,
        entityModel: 'Booking',
        createdByRole: 'system',
        metadata: {
          event: 'repair_pickup_reminder',
          reminderKey,
          reminderLeadMinutes: 30,
          bookingId: getBookingReferenceLabel(booking),
          bookingType: booking?.bookingType || 'repair',
          service: booking?.service || '',
          pickupDate: booking?.pickupDate || '',
          pickupSlot: booking?.pickupSlot || '',
          orderId: normalizeEntityId(booking?.orderId) || null,
        },
      });

      if (createdNotification?._id) {
        createdCount += 1;
      }
    })
  );

  return createdCount;
};

export const syncRepairPickupReminderNotifications = async () => {
  if (reminderSyncPromise) {
    return reminderSyncPromise;
  }

  reminderSyncPromise = (async () => {
    try {
      return await syncRepairPickupReminderNotificationsInternal();
    } catch (error) {
      console.error('Failed to sync repair pickup reminder notifications:', error);
      return 0;
    } finally {
      reminderSyncPromise = null;
    }
  })();

  return reminderSyncPromise;
};

export const startRepairPickupReminderScheduler = () => {
  if (repairReminderInterval) {
    return repairReminderInterval;
  }

  syncRepairPickupReminderNotifications().catch((error) => {
    console.error('Initial repair pickup reminder sync failed:', error);
  });

  repairReminderInterval = setInterval(() => {
    syncRepairPickupReminderNotifications().catch((error) => {
      console.error('Repair pickup reminder sync failed:', error);
    });
  }, SYNC_INTERVAL_MS);

  return repairReminderInterval;
};
