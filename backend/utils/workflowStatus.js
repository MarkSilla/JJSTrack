const STATUS_ALIASES = new Map([
  ['complete', 'Completed'],
  ['completed', 'Completed'],
  ['in progress', 'In Progress'],
  ['in-progress', 'In Progress'],
  ['cancelled', 'Cancelled'],
  ['canceled', 'Cancelled'],
  ['released', 'Released'],
  ['ready', 'Completed'],
  ['ready for pickup', 'Completed'],
  ['readyforpickup', 'Completed'],
  ['pick up', 'Completed'],
  ['Pick-up', 'Completed'],
]);

const normalizeStatusKey = (status) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

const normalizeStepLabel = (label = '') =>
  String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const normalizeWorkflowStatus = (status) => {
  if (!status) return status;

  const normalized = STATUS_ALIASES.get(normalizeStatusKey(status));
  return normalized || status;
};

export const hasReachedDropOffWorkflowStep = (steps = []) =>
  Array.isArray(steps) &&
  steps.some((step) => {
    const label = normalizeStepLabel(step?.label);
    return ['dropped off', 'drop off'].includes(label) && Boolean(step?.done || step?.active);
  });

export const isReadyForPickupWorkflow = (steps = []) => {
  if (!Array.isArray(steps) || steps.length === 0) {
    return false;
  }

  // Check if the last step (Pick-up) is reached (done or active)
  const lastStep = steps[steps.length - 1];
  return Boolean(lastStep?.done || lastStep?.active);
};

export const resolveWorkflowStatus = ({ currentStatus, requestedStatus, steps }) => {
  const normalizedCurrentStatus = normalizeWorkflowStatus(currentStatus);
  const normalizedRequestedStatus = normalizeWorkflowStatus(requestedStatus);
  const nextStatus = normalizedRequestedStatus || normalizedCurrentStatus;

  if (nextStatus === 'Cancelled' || nextStatus === 'Released') {
    return nextStatus;
  }

  if (isReadyForPickupWorkflow(steps)) {
    return 'Completed';
  }

  if (hasReachedDropOffWorkflowStep(steps)) {
    return 'In Progress';
  }

  return nextStatus;
};

export const resolveEntityWorkflowStatus = (entity = {}) =>
  resolveWorkflowStatus({
    currentStatus: entity?.status,
    steps: entity?.steps,
  });
