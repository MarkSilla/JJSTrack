import bookingModel from '../models/bookingModel.js';
import notificationModel from '../models/notificationModel.js';
import { createNotification } from './notificationHelpers.js';
import { getPrimaryRepairOptionName } from './repairDisplay.js';

const USE_TEST_MODE = false;
const TEST_DELAY_MS = 10 * 1000;
const PROD_LEAD_DAYS = 1;
const DAY_MS = 24 * 60 * 60 * 1000;
const SYNC_INTERVAL_MS = 30 * 1000;
let dropoffReminderInterval = null;
let dropoffReminderSyncPromise = null;

const normalizeEntityId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || '';

const parsePickupDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
};

const getBookingReferenceLabel = (booking = {}) =>
  String(booking?.bookingId || `Booking ${String(booking?._id || '').slice(-6).toUpperCase()}`).trim();

const getBookingTypeLabel = (bookingType = '') => {
  if (bookingType === 'repair') return 'repair';
  if (bookingType === 'jersey') return 'team jersey';
  if (bookingType === 'organizational') return 'organizational';
  return 'booking';
};

const getBookingSubjectLabel = (booking = {}) => {
  if (booking?.bookingType === 'jersey')
    return String(booking?.teamName || booking?.service || 'Team Jersey').trim() || 'Team Jersey';
  if (booking?.bookingType === 'organizational')
    return String(booking?.orgName || booking?.service || 'Organization').trim() || 'Organization';
  if (booking?.bookingType === 'repair')
    return getPrimaryRepairOptionName(booking, 'Repair');
  return String(booking?.service || '').trim() || 'Booking';
};

const formatPickupDate = (pickupDate) =>
  pickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const buildDropoffReminderMessage = (booking, pickupDate) => {
  const bookingReference = getBookingReferenceLabel(booking);
  const bookingTypeLabel = getBookingTypeLabel(booking?.bookingType);
  const subjectLabel = getBookingSubjectLabel(booking);
  const pickupDateLabel = formatPickupDate(pickupDate);
  const slotSuffix = booking?.pickupSlot ? ` at ${String(booking.pickupSlot).trim()}` : '';

  return `Reminder: Please drop off your item(s) for your ${bookingTypeLabel} booking — ${subjectLabel} (${bookingReference}) — at JJSportswear as soon as possible. Your scheduled pickup is on ${pickupDateLabel}${slotSuffix}.`;
};

const syncDropoffReminderNotificationsInternal = async () => {
  const now = new Date();
  let createdCount = 0;

  let query = {
    userId: { $exists: true, $ne: null },
    pickupDate: { $exists: true, $ne: '' },
    status: { $nin: ['Cancelled', 'Released', 'Completed'] },
    isPickedUp: { $ne: true },
    isArchived: { $ne: true },
    $or: [{ orderId: { $exists: false } }, { orderId: null }],
  };
  if (USE_TEST_MODE) {
    delete query.$or;
  }

  const bookings = await bookingModel
    .find(query)
    .select('_id bookingId userId bookingType service teamName orgName repairDescription pickupDate pickupSlot status createdAt orderId')
    .lean();

  await Promise.all(
    bookings.map(async (booking) => {
      const recipientId = normalizeEntityId(booking?.userId);
      if (!recipientId) return;

      if (USE_TEST_MODE) {
        const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null;
        if (!createdAt) return;

        const readyAt = new Date(createdAt.getTime() + TEST_DELAY_MS);
        if (now < readyAt) return;

        const reminderKey = `dropoff-reminder-test-${booking._id}`;
        const exists = await notificationModel.exists({
          audience: 'user',
          recipientId,
          type: 'booking',
          entityId: booking._id,
          'metadata.reminderKey': reminderKey,
        });
        if (exists) return;

        const pickupDate = parsePickupDate(booking?.pickupDate) || new Date();
        const notif = await createNotification({
          audience: 'user',
          recipientId,
          type: 'booking',
          title: 'Drop off your item — pickup date is approaching',
          message: buildDropoffReminderMessage(booking, pickupDate),
          route: '/appointment',
          entityId: booking._id,
          entityModel: 'Booking',
          createdByRole: 'system',
          metadata: {
            event: 'dropoff_reminder',
            reminderKey,
            bookingId: getBookingReferenceLabel(booking),
            bookingType: booking?.bookingType || '',
            service: booking?.service || '',
            pickupDate: booking?.pickupDate || '',
            pickupSlot: booking?.pickupSlot || '',
            testMode: true,
          },
        });

        if (notif?._id) createdCount += 1;
      } else {
        const pickupDate = parsePickupDate(booking?.pickupDate);
        if (!pickupDate) return;

        const todayRef = (() => {
          const t = new Date();
          return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0);
        })();

        const daysUntil = Math.round((pickupDate.getTime() - todayRef.getTime()) / DAY_MS);
        if (daysUntil < 0 || daysUntil > PROD_LEAD_DAYS) return;

        const dateKey = [
          pickupDate.getFullYear(),
          String(pickupDate.getMonth() + 1).padStart(2, '0'),
          String(pickupDate.getDate()).padStart(2, '0'),
        ].join('-');

        const reminderKey = `dropoff-reminder-${booking._id}-${dateKey}`;
        const exists = await notificationModel.exists({
          audience: 'user',
          recipientId,
          type: 'booking',
          entityId: booking._id,
          'metadata.reminderKey': reminderKey,
        });
        if (exists) return;

        const notif = await createNotification({
          audience: 'user',
          recipientId,
          type: 'booking',
          title: daysUntil <= 0
            ? 'Drop off your item — pickup is today!'
            : 'Drop off your item — pickup is tomorrow!',
          message: buildDropoffReminderMessage(booking, pickupDate),
          route: '/appointment',
          entityId: booking._id,
          entityModel: 'Booking',
          createdByRole: 'system',
          metadata: {
            event: 'dropoff_reminder',
            reminderKey,
            bookingId: getBookingReferenceLabel(booking),
            bookingType: booking?.bookingType || '',
            service: booking?.service || '',
            pickupDate: booking?.pickupDate || '',
            pickupSlot: booking?.pickupSlot || '',
            daysUntilPickup: daysUntil,
            testMode: false,
          },
        });

        if (notif?._id) createdCount += 1;
      }
    })
  );

  return createdCount;
};
export const syncDropoffReminderNotifications = async () => {
  if (dropoffReminderSyncPromise) return dropoffReminderSyncPromise;

  dropoffReminderSyncPromise = (async () => {
    try {
      return await syncDropoffReminderNotificationsInternal();
    } catch (error) {
      console.error('[DropoffReminder] Sync failed:', error);
      return 0;
    } finally {
      dropoffReminderSyncPromise = null;
    }
  })();

  return dropoffReminderSyncPromise;
};

export const startDropoffReminderScheduler = () => {
  if (dropoffReminderInterval) return dropoffReminderInterval;
  syncDropoffReminderNotifications().catch((err) =>
    console.error('[DropoffReminder] Initial sync failed:', err)
  );

  const interval = USE_TEST_MODE
    ? SYNC_INTERVAL_MS
    : 60 * 60 * 1000;

  dropoffReminderInterval = setInterval(() => {
    syncDropoffReminderNotifications().catch((err) =>
      console.error('[DropoffReminder] Interval sync failed:', err)
    );
  }, interval);

  console.log(
    `[DropoffReminder] Scheduler started — ${USE_TEST_MODE ? 'TEST MODE (10 s delay, 30 s poll)' : `PRODUCTION MODE (${PROD_LEAD_DAYS}-day lead, 1-hr poll)`}`
  );

  return dropoffReminderInterval;
};
