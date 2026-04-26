const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_WINDOW_DAYS = 2;

const CLOSED_STATUSES = new Set(['cancelled', 'released', 'completed', 'complete']);

const normalizeStatus = (status = '') => String(status || '').trim().toLowerCase();

const isClosedStatus = (status = '') => CLOSED_STATUSES.has(normalizeStatus(status));

export const parseScheduleDate = (value = '') => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return null;

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T00:00:00`)
    : new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const getTodayReference = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatScheduleDateLabel = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const getDaysUntilSchedule = (scheduleDate, todayReference = getTodayReference()) =>
  Math.round((scheduleDate.getTime() - todayReference.getTime()) / DAY_MS);

const getRelativeLabel = (daysUntilSchedule) => {
  if (daysUntilSchedule < 0) {
    const overdueDays = Math.abs(daysUntilSchedule);
    return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
  }

  if (daysUntilSchedule === 0) return 'Due today';
  if (daysUntilSchedule === 1) return 'Due tomorrow';
  return `Due in ${daysUntilSchedule} days`;
};

const getBookingSubjectLabel = (booking = {}) => {
  if (booking.bookingType === 'jersey') {
    return booking.teamName || booking.service || 'Team Jersey';
  }

  if (booking.bookingType === 'organizational') {
    return booking.orgName || booking.service || 'Organization';
  }

  if (booking.bookingType === 'repair') {
    return booking.service || booking.repairDescription || 'Repair';
  }

  return booking.service || booking.teamName || booking.orgName || 'Booking';
};

const getOrderSubjectLabel = (order = {}) =>
  order.item || order.serviceType || 'Order';

const sortDueAlerts = (items = []) =>
  [...items].sort((left, right) => {
    if (left.daysUntilSchedule !== right.daysUntilSchedule) {
      return left.daysUntilSchedule - right.daysUntilSchedule;
    }

    return left.scheduleDateValue.localeCompare(right.scheduleDateValue);
  });

const buildAlertEntry = ({
  entityType,
  id,
  reference,
  customerName,
  subjectLabel,
  scheduleValue,
  status,
  route,
  daysUntilSchedule,
}) => {
  const scheduleDate = parseScheduleDate(scheduleValue);
  if (!scheduleDate) return null;

  const kind =
    daysUntilSchedule < 0
      ? 'overdue'
      : daysUntilSchedule <= DUE_SOON_WINDOW_DAYS
        ? 'dueSoon'
        : null;

  if (!kind) return null;

  return {
    id,
    _id: id,
    entityType,
    reference: String(reference || id || '').trim() || 'Reference',
    customerName: String(customerName || 'Customer').trim() || 'Customer',
    subjectLabel: String(subjectLabel || 'Task').trim() || 'Task',
    scheduleLabel: formatScheduleDateLabel(scheduleDate),
    scheduleDateValue: scheduleDate.toISOString(),
    daysUntilSchedule,
    relativeLabel: getRelativeLabel(daysUntilSchedule),
    status: String(status || '').trim() || 'Pending',
    route: route || '',
    alertKey: `${entityType}:${id}:${kind}:${formatDateKey(scheduleDate)}`,
    kind,
  };
};

export const buildDueDateAlerts = ({
  orders = [],
  bookings = [],
  routeBuilder = ({ id }) => id || '',
} = {}) => {
  const todayReference = getTodayReference();
  const dueSoonItems = [];
  const overdueItems = [];

  (Array.isArray(orders) ? orders : []).forEach((order) => {
    if (isClosedStatus(order?.status)) return;

    const scheduleValue = order?.estimatedCompletion || order?.invoice?.dueDate;
    const scheduleDate = parseScheduleDate(scheduleValue);
    if (!scheduleDate) return;

    const daysUntilSchedule = getDaysUntilSchedule(scheduleDate, todayReference);
    const entry = buildAlertEntry({
      entityType: 'order',
      id: order?._id || order?.id,
      reference: order?.orderId || order?.displayId,
      customerName: order?.customer || order?.contact?.fullName || order?.userId?.fullName,
      subjectLabel: getOrderSubjectLabel(order),
      scheduleValue,
      status: order?.status,
      route: routeBuilder({ id: order?._id || order?.id, entityType: 'order', item: order }),
      daysUntilSchedule,
    });

    if (!entry) return;

    if (entry.kind === 'overdue') overdueItems.push(entry);
    if (entry.kind === 'dueSoon') dueSoonItems.push(entry);
  });

  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    if (booking?.orderId || booking?.isArchived || isClosedStatus(booking?.status)) return;

    const scheduleValue = booking?.pickupDate;
    const scheduleDate = parseScheduleDate(scheduleValue);
    if (!scheduleDate) return;

    const daysUntilSchedule = getDaysUntilSchedule(scheduleDate, todayReference);
    const entry = buildAlertEntry({
      entityType: 'booking',
      id: booking?._id || booking?.id,
      reference: booking?.bookingId || booking?.displayId,
      customerName: booking?.contact?.fullName || booking?.customerName,
      subjectLabel: getBookingSubjectLabel(booking),
      scheduleValue,
      status: booking?.status,
      route: routeBuilder({ id: booking?._id || booking?.id, entityType: 'booking', item: booking }),
      daysUntilSchedule,
    });

    if (!entry) return;

    if (entry.kind === 'overdue') overdueItems.push(entry);
    if (entry.kind === 'dueSoon') dueSoonItems.push(entry);
  });

  return {
    dueSoonItems: sortDueAlerts(dueSoonItems),
    overdueItems: sortDueAlerts(overdueItems),
  };
};
