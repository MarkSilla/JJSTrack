import mongoose from 'mongoose';
import bookingModel from '../models/bookingModel.js';
import notificationModel from '../models/notificationModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import { buildAssignmentQuery, getAssignmentCandidates } from './assignmentAccess.js';
import { createNotification } from './notificationHelpers.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOWS = new Set([0, 1, 2]);
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;
const ASSIGNMENT_NOTIFICATION_DEDUPE_WINDOW_MS = 10 * 1000;

const lastReminderSyncAtByStaff = new Map();
const reminderSyncPromiseByStaff = new Map();

const normalizeText = (value = '') =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

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

const getDaysUntilSchedule = (scheduleDate, todayReference) =>
  Math.round((scheduleDate.getTime() - todayReference.getTime()) / DAY_MS);

const formatScheduleDate = (scheduleDate) =>
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

const getOrderReferenceLabel = (order = {}) =>
  String(order?.orderId || `Order ${String(order?._id || '').slice(-6).toUpperCase()}`).trim();

const getBookingReferenceLabel = (booking = {}) =>
  String(
    booking?.bookingId || `Booking ${String(booking?._id || '').slice(-6).toUpperCase()}`
  ).trim();

const getOrderSubjectLabel = (order = {}) =>
  String(order?.item || order?.serviceType || 'Order').trim() || 'Order';

const getBookingSubjectLabel = (booking = {}) => {
  if (booking?.bookingType === 'jersey') {
    return String(booking?.teamName || booking?.service || 'Team Jersey').trim() || 'Team Jersey';
  }

  if (booking?.bookingType === 'organizational') {
    return String(booking?.orgName || booking?.service || 'Organization').trim() || 'Organization';
  }

  if (booking?.bookingType === 'repair') {
    return (
      String(booking?.repairDescription || booking?.service || 'Repair').trim() || 'Repair'
    );
  }

  return String(booking?.service || booking?.bookingType || 'Booking').trim() || 'Booking';
};

const getBookingScheduleLabel = (booking = {}) =>
  [String(booking?.pickupDate || '').trim(), String(booking?.pickupSlot || '').trim()]
    .filter(Boolean)
    .join(' at ');

const getOrderScheduleLabel = (order = {}) => String(order?.estimatedCompletion || '').trim();

const buildAssignmentNotificationSignature = ({
  entityType,
  entityId,
  recipientId,
  event,
  assignedTailor,
  previousAssignedTailor,
}) =>
  [
    entityType,
    normalizeEntityId(entityId),
    normalizeEntityId(recipientId),
    event,
    normalizeText(assignedTailor),
    normalizeText(previousAssignedTailor),
  ].join(':');

const findRecentStaffAssignmentNotification = async ({
  recipientId,
  entityType,
  entityId,
  event,
  assignedTailor,
  previousAssignedTailor = '',
  assignmentSignature = '',
}) => {
  if (!mongoose.isValidObjectId(recipientId) || !mongoose.isValidObjectId(entityId)) {
    return null;
  }

  const normalizedPreviousAssignedTailor = String(previousAssignedTailor || '').trim();
  const duplicatePayloadQuery = {
    'metadata.event': event,
    'metadata.assignedTailor': String(assignedTailor || '').trim(),
  };

  if (normalizedPreviousAssignedTailor) {
    duplicatePayloadQuery['metadata.previousAssignedTailor'] = normalizedPreviousAssignedTailor;
  } else {
    duplicatePayloadQuery.$or = [
      { 'metadata.previousAssignedTailor': { $exists: false } },
      { 'metadata.previousAssignedTailor': '' },
      { 'metadata.previousAssignedTailor': null },
    ];
  }

  return notificationModel
    .findOne({
      audience: 'staff',
      recipientId,
      type: entityType,
      entityId,
      createdAt: {
        $gte: new Date(Date.now() - ASSIGNMENT_NOTIFICATION_DEDUPE_WINDOW_MS),
      },
      $or: [
        { 'metadata.assignmentSignature': String(assignmentSignature || '').trim() },
        duplicatePayloadQuery,
      ],
    })
    .sort({ createdAt: -1 });
};

export const resolveAssignedStaffUser = async (assignedTailor) => {
  const normalizedAssignedTailor = normalizeText(assignedTailor);
  if (!normalizedAssignedTailor) {
    return null;
  }

  if (mongoose.isValidObjectId(normalizedAssignedTailor)) {
    const byId = await userModel.findOne({ _id: normalizedAssignedTailor, role: 'staff' });
    if (byId) {
      return byId;
    }
  }

  const staffUsers = await userModel
    .find({ role: 'staff', accountStatus: { $ne: 'Inactive' } })
    .select('fullName firstName lastName employeeId email');

  return (
    staffUsers.find((staffUser) => {
      const candidates = getAssignmentCandidates(staffUser).map(normalizeText);

      return candidates.some(
        (candidate) =>
          candidate === normalizedAssignedTailor ||
          candidate.includes(normalizedAssignedTailor) ||
          normalizedAssignedTailor.includes(candidate)
      );
    }) || null
  );
};

const buildStaffReminderTitle = (daysUntilSchedule) => {
  if (daysUntilSchedule <= 0) return 'Assigned task due today';
  if (daysUntilSchedule === 1) return 'Assigned task due tomorrow';
  return 'Assigned task due soon';
};

const buildStaffReminderMessage = ({
  entityType,
  entity,
  scheduleDate,
  daysUntilSchedule,
}) => {
  const formattedDate = formatScheduleDate(scheduleDate);

  if (entityType === 'order') {
    const subjectLabel = getOrderSubjectLabel(entity);
    const reference = getOrderReferenceLabel(entity);
    const scheduleLabel = getOrderScheduleLabel(entity);
    const scheduleSuffix = scheduleLabel ? ` Target date: ${scheduleLabel}.` : '';

    if (daysUntilSchedule <= 0) {
      return `${subjectLabel} (${reference}) assigned to you is due today.${scheduleSuffix}`;
    }

    if (daysUntilSchedule === 1) {
      return `${subjectLabel} (${reference}) assigned to you is due tomorrow, ${formattedDate}.${scheduleSuffix}`;
    }

    return `${subjectLabel} (${reference}) assigned to you is due in ${daysUntilSchedule} days on ${formattedDate}.${scheduleSuffix}`;
  }

  const subjectLabel = getBookingSubjectLabel(entity);
  const reference = getBookingReferenceLabel(entity);
  const scheduleLabel = getBookingScheduleLabel(entity);
  const scheduleSuffix = scheduleLabel ? ` Pickup schedule: ${scheduleLabel}.` : '';

  if (daysUntilSchedule <= 0) {
    return `${subjectLabel} (${reference}) assigned to you is due today.${scheduleSuffix}`;
  }

  if (daysUntilSchedule === 1) {
    return `${subjectLabel} (${reference}) assigned to you is due tomorrow, ${formattedDate}.${scheduleSuffix}`;
  }

  return `${subjectLabel} (${reference}) assigned to you is due in ${daysUntilSchedule} days on ${formattedDate}.${scheduleSuffix}`;
};

export const maybeCreateStaffAssignmentNotification = async ({
  req,
  entityType = 'booking',
  entity = {},
  previousAssignedTailor = '',
}) => {
  const normalizedEntityType = entityType === 'order' ? 'order' : 'booking';
  const nextAssignedTailor = String(entity?.assignedTailor || '').trim();
  if (!entity?._id || !nextAssignedTailor) {
    return null;
  }

  const [nextStaffUser, previousStaffUser] = await Promise.all([
    resolveAssignedStaffUser(nextAssignedTailor),
    previousAssignedTailor ? resolveAssignedStaffUser(previousAssignedTailor) : Promise.resolve(null),
  ]);

  if (!nextStaffUser?._id) {
    return null;
  }

  if (
    previousStaffUser?._id &&
    String(previousStaffUser._id) === String(nextStaffUser._id)
  ) {
    return null;
  }

  const isReassigned = Boolean(previousAssignedTailor) && normalizeText(previousAssignedTailor) !== normalizeText(nextAssignedTailor);

  const reference =
    normalizedEntityType === 'order'
      ? getOrderReferenceLabel(entity)
      : getBookingReferenceLabel(entity);
  const subjectLabel =
    normalizedEntityType === 'order'
      ? getOrderSubjectLabel(entity)
      : getBookingSubjectLabel(entity);
  const scheduleLabel =
    normalizedEntityType === 'order'
      ? getOrderScheduleLabel(entity)
      : getBookingScheduleLabel(entity);
  const scheduleSuffix = scheduleLabel ? ` Schedule: ${scheduleLabel}.` : '';
  const normalizedPreviousAssignedTailor = String(previousAssignedTailor || '').trim();
  const assignmentEvent = isReassigned ? 'reassigned_to_staff' : 'assigned_to_staff';
  const assignmentSignature = buildAssignmentNotificationSignature({
    entityType: normalizedEntityType,
    entityId: entity._id,
    recipientId: nextStaffUser._id,
    event: assignmentEvent,
    assignedTailor: nextAssignedTailor,
    previousAssignedTailor: normalizedPreviousAssignedTailor,
  });

  const existingNotification = await findRecentStaffAssignmentNotification({
    recipientId: nextStaffUser._id,
    entityType: normalizedEntityType,
    entityId: entity._id,
    event: assignmentEvent,
    assignedTailor: nextAssignedTailor,
    previousAssignedTailor: normalizedPreviousAssignedTailor,
    assignmentSignature,
  });

  if (existingNotification) {
    return existingNotification;
  }

  return createNotification({
    audience: 'staff',
    recipientId: nextStaffUser._id,
    type: normalizedEntityType,
    title: isReassigned ? 'Task reassigned to you' : 'New task assigned to you',
    message: `${subjectLabel} (${reference}) was ${isReassigned ? 'reassigned' : 'assigned'} to you.${scheduleSuffix}`,
    route: '/staff/orders',
    entityId: entity._id,
    entityModel: normalizedEntityType === 'order' ? 'Order' : 'Booking',
    metadata: {
      event: assignmentEvent,
      entityType: normalizedEntityType,
      orderId: normalizedEntityType === 'order' ? reference : normalizeEntityId(entity?.orderId) || null,
      bookingId: normalizedEntityType === 'booking' ? reference : normalizeEntityId(entity?.bookingId) || null,
      subjectLabel,
      assignedTailor: nextAssignedTailor,
      previousAssignedTailor: normalizedPreviousAssignedTailor,
      scheduleLabel,
      assignmentSignature,
    },
    req,
  });
};

const buildStaffReminderQuery = (staffUser, scheduleField) => {
  const assignmentQuery = buildAssignmentQuery(staffUser, 'assignedTailor');
  if (!assignmentQuery) {
    return null;
  }

  return {
    ...assignmentQuery,
    [scheduleField]: { $exists: true, $ne: '' },
  };
};

const syncUpcomingAssignedTaskNotificationsInternal = async ({ staffUserId }) => {
  if (!mongoose.isValidObjectId(staffUserId)) {
    return 0;
  }

  const staffUser = await userModel.findOne({
    _id: staffUserId,
    role: 'staff',
    accountStatus: { $ne: 'Inactive' },
  });

  if (!staffUser?._id) {
    return 0;
  }

  const todayReference = getTodayReference();
  const orderQuery = buildStaffReminderQuery(staffUser, 'estimatedCompletion');
  const bookingQuery = buildStaffReminderQuery(staffUser, 'pickupDate');

  if (!orderQuery || !bookingQuery) {
    return 0;
  }

  const [orders, bookings] = await Promise.all([
    orderModel
      .find({
        ...orderQuery,
        status: { $nin: ['Cancelled', 'Released', 'Completed'] },
      })
      .select('_id orderId item serviceType estimatedCompletion status assignedTailor bookingId')
      .lean(),
    bookingModel
      .find({
        ...bookingQuery,
        status: { $nin: ['Cancelled', 'Released', 'Completed'] },
        isArchived: { $ne: true },
        $or: [{ orderId: { $exists: false } }, { orderId: null }],
      })
      .select('_id bookingId bookingType service repairDescription teamName orgName pickupDate pickupSlot status assignedTailor orderId')
      .lean(),
  ]);

  let createdCount = 0;

  await Promise.all(
    orders.map(async (order) => {
      const scheduleDate = parseScheduleDate(order?.estimatedCompletion);
      if (!scheduleDate) return;

      const daysUntilSchedule = getDaysUntilSchedule(scheduleDate, todayReference);
      if (!REMINDER_WINDOWS.has(daysUntilSchedule)) return;

      const reminderStage = getReminderStage(daysUntilSchedule);
      const reminderKey = `staff-order-due-${order._id}-${formatDateKey(scheduleDate)}-${reminderStage}`;

      const existingNotification = await notificationModel.exists({
        audience: 'staff',
        recipientId: staffUser._id,
        type: 'order',
        entityId: order._id,
        'metadata.reminderKey': reminderKey,
      });

      if (existingNotification) return;

      const createdNotification = await createNotification({
        audience: 'staff',
        recipientId: staffUser._id,
        type: 'order',
        title: buildStaffReminderTitle(daysUntilSchedule),
        message: buildStaffReminderMessage({
          entityType: 'order',
          entity: order,
          scheduleDate,
          daysUntilSchedule,
        }),
        route: '/staff/orders',
        entityId: order._id,
        entityModel: 'Order',
        createdByRole: 'system',
        metadata: {
          event: 'staff_task_due_soon',
          reminderKey,
          reminderStage,
          entityType: 'order',
          orderId: getOrderReferenceLabel(order),
          bookingId: normalizeEntityId(order?.bookingId) || null,
          subjectLabel: getOrderSubjectLabel(order),
          dueDate: order?.estimatedCompletion || '',
          daysUntilSchedule,
        },
      });

      if (createdNotification?._id) {
        createdCount += 1;
      }
    })
  );

  await Promise.all(
    bookings.map(async (booking) => {
      const scheduleDate = parseScheduleDate(booking?.pickupDate);
      if (!scheduleDate) return;

      const daysUntilSchedule = getDaysUntilSchedule(scheduleDate, todayReference);
      if (!REMINDER_WINDOWS.has(daysUntilSchedule)) return;

      const reminderStage = getReminderStage(daysUntilSchedule);
      const reminderKey = `staff-booking-due-${booking._id}-${formatDateKey(scheduleDate)}-${reminderStage}`;

      const existingNotification = await notificationModel.exists({
        audience: 'staff',
        recipientId: staffUser._id,
        type: 'booking',
        entityId: booking._id,
        'metadata.reminderKey': reminderKey,
      });

      if (existingNotification) return;

      const createdNotification = await createNotification({
        audience: 'staff',
        recipientId: staffUser._id,
        type: 'booking',
        title: buildStaffReminderTitle(daysUntilSchedule),
        message: buildStaffReminderMessage({
          entityType: 'booking',
          entity: booking,
          scheduleDate,
          daysUntilSchedule,
        }),
        route: '/staff/orders',
        entityId: booking._id,
        entityModel: 'Booking',
        createdByRole: 'system',
        metadata: {
          event: 'staff_task_due_soon',
          reminderKey,
          reminderStage,
          entityType: 'booking',
          bookingId: getBookingReferenceLabel(booking),
          subjectLabel: getBookingSubjectLabel(booking),
          pickupDate: booking?.pickupDate || '',
          pickupSlot: booking?.pickupSlot || '',
          daysUntilSchedule,
        },
      });

      if (createdNotification?._id) {
        createdCount += 1;
      }
    })
  );

  return createdCount;
};

export const syncUpcomingAssignedTaskNotifications = async ({
  staffUserId,
  force = false,
} = {}) => {
  const staffKey = String(staffUserId || '').trim();
  if (!staffKey) {
    return 0;
  }

  const now = Date.now();

  if (reminderSyncPromiseByStaff.has(staffKey)) {
    return reminderSyncPromiseByStaff.get(staffKey);
  }

  const lastReminderSyncAt = lastReminderSyncAtByStaff.get(staffKey) || 0;
  if (!force && now - lastReminderSyncAt < SYNC_COOLDOWN_MS) {
    return 0;
  }

  const syncPromise = (async () => {
    try {
      const createdCount = await syncUpcomingAssignedTaskNotificationsInternal({ staffUserId: staffKey });
      lastReminderSyncAtByStaff.set(staffKey, Date.now());
      return createdCount;
    } catch (error) {
      console.error('Failed to sync upcoming assigned task notifications:', error);
      return 0;
    } finally {
      reminderSyncPromiseByStaff.delete(staffKey);
    }
  })();

  reminderSyncPromiseByStaff.set(staffKey, syncPromise);
  return syncPromise;
};
