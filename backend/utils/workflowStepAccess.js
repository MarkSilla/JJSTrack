const normalizeText = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

const WORKFLOW_STEP_ROLE_ACCESS = {
  'dropped off': 'admin',
  'drop off': 'admin',
  'pick up': 'admin',
  'pickup': 'admin',
  'layout': 'layout artist',
  'printing': 'layout artist',
  'pressing': 'presser',
  'sewing': 'tailor',
};

const WORKFLOW_ROLE_LABELS = {
  admin: 'Admin',
  'layout artist': 'Layout Artist',
  presser: 'Presser',
  tailor: 'Tailor',
};

const toComparableStep = (step = {}) => ({
  label: String(step?.label || step?.step || ''),
  done: Boolean(step?.done),
  active: Boolean(step?.active),
  date: String(step?.date || ''),
  time: String(step?.time || ''),
  worker: String(step?.worker || ''),
});

const areComparableStepsEqual = (firstStep = {}, secondStep = {}) => {
  const firstComparable = toComparableStep(firstStep);
  const secondComparable = toComparableStep(secondStep);

  return Object.keys(firstComparable).every(
    (key) => firstComparable[key] === secondComparable[key]
  );
};

const isValidNextStepActivation = (previousStep = {}, nextStep = {}) => {
  const previousComparable = toComparableStep(previousStep);
  const nextComparable = toComparableStep(nextStep);

  return (
    previousComparable.label === nextComparable.label &&
    previousComparable.done === nextComparable.done &&
    previousComparable.date === nextComparable.date &&
    previousComparable.time === nextComparable.time &&
    previousComparable.worker === nextComparable.worker &&
    previousComparable.active === false &&
    nextComparable.active === true
  );
};

export const normalizeWorkflowStepLabel = (label = '') => normalizeText(label);

export const getWorkflowStepRequiredRole = (stepLabel = '') =>
  WORKFLOW_STEP_ROLE_ACCESS[normalizeWorkflowStepLabel(stepLabel)] || null;

export const formatWorkflowRoleLabel = (role = '') =>
  WORKFLOW_ROLE_LABELS[normalizeText(role)] || 'authorized staff';

export const getCurrentWorkflowStepIndex = (steps = []) => {
  if (!Array.isArray(steps) || steps.length === 0) return 0;

  const activeIdx = steps.findIndex((step) => Boolean(step?.active));
  if (activeIdx !== -1) return activeIdx;

  const pendingIdx = steps.findIndex((step) => !step?.done);
  return pendingIdx !== -1 ? pendingIdx : steps.length - 1;
};

export const canActorAccessWorkflowStep = (user = {}, stepLabel = '') => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'staff') return false;

  const requiredRole = getWorkflowStepRequiredRole(stepLabel);
  if (!requiredRole) return false;

  const actorRole = normalizeText(user?.position || user?.role);
  return actorRole === requiredRole;
};

export const validateWorkflowStepMutation = ({
  user,
  previousSteps = [],
  nextSteps = [],
}) => {
  if (user?.role === 'admin') {
    return { allowed: true };
  }

  if (user?.role !== 'staff') {
    return {
      allowed: false,
      message: 'Only admin or authorized staff can update workflow steps.',
    };
  }

  const currentSteps = Array.isArray(previousSteps) ? previousSteps : [];
  const updatedSteps = Array.isArray(nextSteps) ? nextSteps : [];
  const maxLength = Math.max(currentSteps.length, updatedSteps.length);
  const changedIndices = [];

  for (let index = 0; index < maxLength; index += 1) {
    if (!areComparableStepsEqual(currentSteps[index], updatedSteps[index])) {
      changedIndices.push(index);
    }
  }

  if (changedIndices.length === 0) {
    return { allowed: true };
  }

  const currentIndex = getCurrentWorkflowStepIndex(currentSteps);
  const completedIndex = changedIndices.find(
    (index) => !currentSteps[index]?.done && Boolean(updatedSteps[index]?.done)
  );

  if (completedIndex === undefined || completedIndex !== currentIndex) {
    return {
      allowed: false,
      message: 'Staff can only complete the current active workflow step.',
    };
  }

  const stepLabel =
    updatedSteps[completedIndex]?.label ||
    updatedSteps[completedIndex]?.step ||
    currentSteps[completedIndex]?.label ||
    currentSteps[completedIndex]?.step ||
    `Step ${completedIndex + 1}`;
  const requiredRole = getWorkflowStepRequiredRole(stepLabel);

  if (!canActorAccessWorkflowStep(user, stepLabel)) {
    return {
      allowed: false,
      message: `Only ${formatWorkflowRoleLabel(requiredRole)} can update the "${stepLabel}" step.`,
    };
  }

  const allowedChangedIndices = new Set([completedIndex]);
  if (completedIndex + 1 < maxLength) {
    allowedChangedIndices.add(completedIndex + 1);
  }

  if (changedIndices.some((index) => !allowedChangedIndices.has(index))) {
    return {
      allowed: false,
      message: 'Staff cannot manipulate workflow steps outside their assigned stage.',
    };
  }

  if (
    allowedChangedIndices.has(completedIndex + 1) &&
    changedIndices.includes(completedIndex + 1) &&
    !isValidNextStepActivation(
      currentSteps[completedIndex + 1],
      updatedSteps[completedIndex + 1]
    )
  ) {
    return {
      allowed: false,
      message: 'Staff can only activate the next workflow step after completing their current stage.',
    };
  }

  return { allowed: true };
};
