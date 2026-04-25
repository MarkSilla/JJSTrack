import orderModel from '../models/orderModel.js';
import bookingModel from '../models/bookingModel.js';
import notificationModel from '../models/notificationModel.js';
import { createNotification } from './notificationHelpers.js';
import { getPrimaryRepairOptionName } from './repairDisplay.js';
import { normalizeWorkflowStatus } from './workflowStatus.js';

const normalizeEntityId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || '';

const buildReadyNotificationKey = (entityType, entityId) =>
  `${entityType}-ready-for-pickup-${String(entityId || '')}`;

const getOrderReferenceLabel = (order = {}) =>
  String(order?.orderId || `Order ${String(order?._id || '').slice(-6).toUpperCase()}`).trim();

const getBookingReferenceLabel = (booking = {}) =>
  String(
    booking?.bookingId || `Booking ${String(booking?._id || '').slice(-6).toUpperCase()}`
  ).trim();

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

  return String(booking?.service || '').trim() || 'Booking';
};

const getBookingTypeLabel = (bookingType = '') => {
  if (bookingType === 'repair') return 'repair';
  if (bookingType === 'jersey') return 'team jersey';
  if (bookingType === 'organizational') return 'organizational';
  return 'booking';
};

export const maybeCreateOrderReadyForPickupNotification = async ({
  req,
  order,
  previousStatus = '',
}) => {
  const nextStatus = normalizeWorkflowStatus(order?.status);
  const normalizedPreviousStatus = normalizeWorkflowStatus(previousStatus);
  const recipientId = normalizeEntityId(order?.userId);

  if (nextStatus !== 'Completed' || normalizedPreviousStatus === 'Completed' || !recipientId) {
    return null;
  }

  const orderReference = getOrderReferenceLabel(order);
  const subjectLabel = String(order?.item || order?.serviceType || 'order').trim() || 'order';
  const pickupDateLabel = String(order?.estimatedCompletion || '').trim();
  const pickupSuffix = pickupDateLabel ? ` Estimated pickup: ${pickupDateLabel}.` : '';
  const readyKey = buildReadyNotificationKey('order', order?._id);

  return createNotification({
    audience: 'user',
    recipientId,
    type: 'order',
    title: 'Order ready for pickup',
    message: `Your ${subjectLabel} (${orderReference}) is ready for pickup.${pickupSuffix}`,
    route: '/order',
    entityId: order?._id,
    entityModel: 'Order',
    metadata: {
      event: 'ready_for_pickup',
      readyKey,
      orderId: orderReference,
      bookingId: normalizeEntityId(order?.bookingId) || null,
      serviceType: order?.serviceType || '',
      estimatedCompletion: order?.estimatedCompletion || '',
    },
    req,
  });
};

export const maybeCreateBookingReadyForPickupNotification = async ({
  req,
  booking,
  previousStatus = '',
}) => {
  const nextStatus = normalizeWorkflowStatus(booking?.status);
  const normalizedPreviousStatus = normalizeWorkflowStatus(previousStatus);
  const recipientId = normalizeEntityId(booking?.userId);

  if (nextStatus !== 'Completed' || normalizedPreviousStatus === 'Completed' || !recipientId) {
    return null;
  }

  if (normalizeEntityId(booking?.orderId)) {
    return null;
  }

  const bookingReference = getBookingReferenceLabel(booking);
  const bookingTypeLabel = getBookingTypeLabel(booking?.bookingType);
  const subjectLabel = getBookingSubjectLabel(booking);
  const pickupSchedule = [booking?.pickupDate, booking?.pickupSlot].filter(Boolean).join(' at ');
  const pickupSuffix = pickupSchedule ? ` Pickup schedule: ${pickupSchedule}.` : '';
  const readyKey = buildReadyNotificationKey('booking', booking?._id);

  return createNotification({
    audience: 'user',
    recipientId,
    type: 'booking',
    title: 'Booking ready for pickup',
    message: `Your ${bookingTypeLabel} booking for ${subjectLabel} (${bookingReference}) is ready for pickup.${pickupSuffix}`,
    route: '/order',
    entityId: booking?._id,
    entityModel: 'Booking',
    metadata: {
      event: 'ready_for_pickup',
      readyKey,
      bookingId: bookingReference,
      bookingType: booking?.bookingType || '',
      service: booking?.service || '',
      pickupDate: booking?.pickupDate || '',
      pickupSlot: booking?.pickupSlot || '',
    },
    req,
  });
};

export const maybeCreateOrderReleasedNotification = async ({
  req,
  order,
  previousReleased = false,
}) => {
  const recipientId = normalizeEntityId(order?.userId);

  if (!order?._id || !order?.isReleased || previousReleased || !recipientId) {
    return null;
  }

  const orderReference = getOrderReferenceLabel(order);
  const subjectLabel = String(order?.item || order?.serviceType || 'order').trim() || 'order';

  return createNotification({
    audience: 'user',
    recipientId,
    type: 'order',
    title: 'Order received',
    message: `You have successfully received your ${subjectLabel} (${orderReference}) after QR verification.`,
    route: '/order',
    entityId: order?._id,
    entityModel: 'Order',
    metadata: {
      event: 'released',
      orderId: orderReference,
      bookingId: normalizeEntityId(order?.bookingId) || null,
      serviceType: order?.serviceType || '',
      releasedAt: order?.releasedAt || null,
      paidAt: order?.paidAt || null,
    },
    req,
  });
};

export const maybeCreateBookingReleasedNotification = async ({
  req,
  booking,
  previousPickedUp = false,
}) => {
  const recipientId = normalizeEntityId(booking?.userId);

  if (!booking?._id || !booking?.isPickedUp || previousPickedUp || !recipientId) {
    return null;
  }

  const bookingReference = getBookingReferenceLabel(booking);
  const bookingTypeLabel = getBookingTypeLabel(booking?.bookingType);
  const subjectLabel = getBookingSubjectLabel(booking);

  return createNotification({
    audience: 'user',
    recipientId,
    type: 'booking',
    title: 'Booking received',
    message: `You have successfully received your ${bookingTypeLabel} booking for ${subjectLabel} (${bookingReference}) after QR verification.`,
    route: '/order',
    entityId: booking?._id,
    entityModel: 'Booking',
    metadata: {
      event: 'released',
      bookingId: bookingReference,
      bookingType: booking?.bookingType || '',
      service: booking?.service || '',
      pickupDate: booking?.pickupDate || '',
      pickupSlot: booking?.pickupSlot || '',
      pickedUpAt: booking?.pickedUpAt || null,
      paidAt: booking?.paidAt || null,
    },
    req,
  });
};

export const syncPendingReadyForPickupNotifications = async () => {
  try {
    const [completedOrders, completedBookings] = await Promise.all([
      orderModel
        .find({
          userId: { $exists: true, $ne: null },
          status: 'Completed',
          isReleased: { $ne: true },
        })
        .select('_id userId bookingId orderId item serviceType estimatedCompletion status')
        .lean(),
      bookingModel
        .find({
          userId: { $exists: true, $ne: null },
          status: 'Completed',
          isPickedUp: { $ne: true },
          isArchived: { $ne: true },
          $or: [{ orderId: { $exists: false } }, { orderId: null }],
        })
        .select('_id bookingId userId bookingType service repairDescription pickupDate pickupSlot status')
        .lean(),
    ]);

    let createdCount = 0;

    await Promise.all(
      completedOrders.map(async (order) => {
        const recipientId = normalizeEntityId(order?.userId);
        const readyKey = buildReadyNotificationKey('order', order?._id);
        if (!recipientId || !readyKey) return;

        const existingNotification = await notificationModel.exists({
          audience: 'user',
          recipientId,
          entityId: order._id,
          'metadata.readyKey': readyKey,
        });

        if (existingNotification) return;

        const createdNotification = await maybeCreateOrderReadyForPickupNotification({
          order,
          previousStatus: 'In Progress',
        });

        if (createdNotification?._id) {
          createdCount += 1;
        }
      }),
    );

    await Promise.all(
      completedBookings.map(async (booking) => {
        const recipientId = normalizeEntityId(booking?.userId);
        const readyKey = buildReadyNotificationKey('booking', booking?._id);
        if (!recipientId || !readyKey) return;

        const existingNotification = await notificationModel.exists({
          audience: 'user',
          recipientId,
          entityId: booking._id,
          'metadata.readyKey': readyKey,
        });

        if (existingNotification) return;

        const createdNotification = await maybeCreateBookingReadyForPickupNotification({
          booking,
          previousStatus: 'In Progress',
        });

        if (createdNotification?._id) {
          createdCount += 1;
        }
      })
    );

    return createdCount;
  } catch (error) {
    console.error('Failed to sync ready-for-pickup notifications:', error);
    return 0;
  }
};
