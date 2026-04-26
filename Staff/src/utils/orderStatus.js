const CLOSED_STATUSES = new Set([
  'cancelled',
  'completed',
  'complete',
  'released',
  'ready',
  'ready for pickup',
  'readyforpickup',
  'ready-for-pickup',
  'pick-up',
  'pick up',
  'pickup',
]);

const normalizeStatus = (status = '') => String(status || '').trim().toLowerCase();
const normalizeStepLabel = (label = '') =>
  String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
const hasReachedDropOffStep = (steps = []) =>
  Array.isArray(steps) &&
  steps.some((step) => {
    const label = normalizeStepLabel(step?.label);
    return ['dropped off', 'drop off'].includes(label) && Boolean(step?.done || step?.active);
  });

const parseScheduleDate = (value) => {
  if (!value) return null;

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

export const getTaskDueDate = (order = {}) =>
  order?.dueDate || order?.estimatedCompletion || order?.invoice?.dueDate || order?.pickupDate || '';

export const isOverdueTask = (order = {}) => {
  if (!order) return false;

  const normalizedStatus = normalizeStatus(order?.status);
  if (CLOSED_STATUSES.has(normalizedStatus)) return false;

  const dueDate = parseScheduleDate(getTaskDueDate(order));
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
};

export const getStaffDerivedStatus = (order = {}) => {
  if (!order) return 'Pending';

  const normalizedStatus = normalizeStatus(order?.status);

  if (normalizedStatus === 'cancelled') return 'Cancelled';
  if (isOverdueTask(order)) return 'Overdue';
  if (normalizedStatus === 'in progress' || normalizedStatus === 'in-progress') {
    return 'In Progress';
  }
  if (hasReachedDropOffStep(order?.steps)) {
    return 'In Progress';
  }
  if (CLOSED_STATUSES.has(normalizedStatus) && normalizedStatus !== 'cancelled') {
    return 'Completed';
  }

  return 'Pending';
};
