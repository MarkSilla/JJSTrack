import bookingModel from '../models/bookingModel.js';
import notificationModel from '../models/notificationModel.js';
import { createNotification } from './notificationHelpers.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOWS = new Set([0, 1, 2]);
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

let lastReminderSyncAt = 0;
let reminderSyncPromise = null;

const parsePickupDate = (value) => {
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
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

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

const getDaysUntilPickup = (pickupDate, todayReference) =>
  Math.round((pickupDate.getTime() - todayReference.getTime()) / DAY_MS);

const formatReminderDate = (pickupDate) =>
  pickupDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatDateKey = (pickupDate) => {
  const year = pickupDate.getFullYear();
  const month = String(pickupDate.getMonth() + 1).padStart(2, '0');
  const day = String(pickupDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getReminderStage = (daysUntilPickup) => {
  if (daysUntilPickup <= 0) return 'today';
  if (daysUntilPickup === 1) return 'tomorrow';
  return 'soon';
};

const getBookingReferenceLabel = (booking = {}) =>
  booking.bookingId || `Booking ${String(booking._id || '').slice(-6).toUpperCase()}`;

const getBookingCustomerName = (booking = {}) =>
  String(booking?.contact?.fullName || 'Customer').trim() || 'Customer';

const getBookingSubjectLabel = (booking = {}) => {
  if (booking?.bookingType === 'jersey') {
    return String(booking?.teamName || booking?.service || 'Team Jersey').trim() || 'Team Jersey';
  }

  if (booking?.bookingType === 'organizational') {
    return String(booking?.orgName || booking?.service || 'Organization').trim() || 'Organization';
  }

  if (booking?.bookingType === 'repair') {
    return String(booking?.service || 'Repair').trim() || 'Repair';
  }

  return String(booking?.service || booking?.teamName || booking?.orgName || '').trim();
};

const getPickupSlotSuffix = (pickupSlot = '') =>
  pickupSlot ? ` at ${String(pickupSlot).trim()}` : '';

const getReminderTitle = (daysUntilPickup) => {
  if (daysUntilPickup <= 0) return 'Booking pickup due today';
  if (daysUntilPickup === 1) return 'Booking pickup due tomorrow';
  return 'Booking pickup is approaching';
};

const getReminderMessage = ({ booking, pickupDate, daysUntilPickup }) => {
  const customerName = getBookingCustomerName(booking);
  const subjectLabel = getBookingSubjectLabel(booking);
  const bookingReference = getBookingReferenceLabel(booking);
  const pickupDateLabel = formatReminderDate(pickupDate);
  const pickupSlotSuffix = getPickupSlotSuffix(booking.pickupSlot);
  const reminderTarget = subjectLabel || `${customerName}'s booking`;

  if (daysUntilPickup <= 0) {
    return `${reminderTarget} (${bookingReference}) is scheduled for pickup today${pickupSlotSuffix}.`;
  }

  if (daysUntilPickup === 1) {
    return `${reminderTarget} (${bookingReference}) is scheduled for pickup tomorrow, ${pickupDateLabel}${pickupSlotSuffix}.`;
  }

  return `${reminderTarget} (${bookingReference}) is scheduled for pickup in ${daysUntilPickup} days on ${pickupDateLabel}${pickupSlotSuffix}.`;
};

const resolveBookingReminderRoute = (booking = {}) => {
  const targetId =
    booking?.orderId?._id?.toString?.() ||
    booking?.orderId?.toString?.() ||
    booking?._id?.toString?.() ||
    '';

  return targetId ? `/admin/orders/${targetId}` : '/admin/orders';
};

const syncUpcomingBookingNotificationsInternal = async () => {
  const todayReference = getTodayReference();

  const candidateBookings = await bookingModel
    .find({
      pickupDate: { $exists: true, $ne: '' },
      status: { $nin: ['Cancelled', 'Released'] },
      isArchived: { $ne: true },
    })
    .select('_id bookingId bookingType service teamName orgName pickupDate pickupSlot status contact orderId')
    .lean();

  let createdCount = 0;

  await Promise.all(
    candidateBookings.map(async (booking) => {
      const pickupDate = parsePickupDate(booking.pickupDate);
      if (!pickupDate) return;

      const daysUntilPickup = getDaysUntilPickup(pickupDate, todayReference);
      if (!REMINDER_WINDOWS.has(daysUntilPickup)) return;

      const reminderStage = getReminderStage(daysUntilPickup);
      const pickupDateKey = formatDateKey(pickupDate);
      const reminderKey = `booking-pickup-${booking._id}-${pickupDateKey}-${reminderStage}`;

      const existingNotification = await notificationModel.exists({
        audience: 'admin',
        type: 'booking',
        entityId: booking._id,
        'metadata.reminderKey': reminderKey,
      });

      if (existingNotification) return;

      const createdNotification = await createNotification({
        audience: 'admin',
        type: 'booking',
        title: getReminderTitle(daysUntilPickup),
        message: getReminderMessage({ booking, pickupDate, daysUntilPickup }),
        route: resolveBookingReminderRoute(booking),
        entityId: booking._id,
        entityModel: 'Booking',
        createdByRole: 'system',
        metadata: {
          event: 'pickup_due_soon',
          reminderKey,
          reminderStage,
          pickupDate: booking.pickupDate,
          pickupSlot: booking.pickupSlot || '',
          daysUntilPickup,
          bookingType: booking.bookingType,
          service: booking.service,
          subjectLabel: getBookingSubjectLabel(booking),
          customerName: getBookingCustomerName(booking),
        },
      });

      if (createdNotification?._id) {
        createdCount += 1;
      }
    })
  );

  return createdCount;
};

export const syncUpcomingBookingNotifications = async ({ force = false } = {}) => {
  const now = Date.now();

  if (reminderSyncPromise) {
    return reminderSyncPromise;
  }

  if (!force && now - lastReminderSyncAt < SYNC_COOLDOWN_MS) {
    return 0;
  }

  reminderSyncPromise = (async () => {
    try {
      const createdCount = await syncUpcomingBookingNotificationsInternal();
      lastReminderSyncAt = Date.now();
      return createdCount;
    } catch (error) {
      console.error('Failed to sync upcoming booking notifications:', error);
      return 0;
    } finally {
      reminderSyncPromise = null;
    }
  })();

  return reminderSyncPromise;
};
