const normalizeAssignmentValue = (value = '') =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toCandidateString = (value = '') =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

const STAFF_ASSIGNMENT_FIELDS = [
  'assignedTailor',
  'staffAssignments.tailor',
  'staffAssignments.presser',
  'staffAssignments.layoutArtist',
];

export const getAssignmentCandidates = (user = {}) => {
  const firstName = toCandidateString(user?.firstName);
  const lastName = toCandidateString(user?.lastName || user?.surname);
  const composedFullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return Array.from(
    new Set(
      [
        user?._id?.toString?.(),
        user?.id?.toString?.(),
        user?.employeeId,
        user?.name,
        user?.fullName,
        composedFullName,
        user?.email,
      ]
        .map(toCandidateString)
        .filter(Boolean)
    )
  );
};

const buildExactMatcher = (candidate = '') => {
  const normalized = toCandidateString(candidate);
  if (!normalized) return null;

  const pattern = normalized
    .split(' ')
    .map(escapeRegex)
    .join('\\s+');

  return new RegExp(`^\\s*${pattern}\\s*$`, 'i');
};

export const buildAssignmentQuery = (user = {}, field = 'assignedTailor') => {
  const matchers = getAssignmentCandidates(user)
    .map(buildExactMatcher)
    .filter(Boolean);

  if (!matchers.length) return null;

  return { [field]: { $in: matchers } };
};

export const buildStaffAssignmentQuery = (user = {}) => {
  const matchers = getAssignmentCandidates(user)
    .map(buildExactMatcher)
    .filter(Boolean);

  if (!matchers.length) return null;

  return {
    $or: STAFF_ASSIGNMENT_FIELDS.map((field) => ({
      [field]: { $in: matchers },
    })),
  };
};

const getAssignmentValues = (assignmentInput = '') => {
  if (typeof assignmentInput === 'string') {
    return [assignmentInput];
  }

  if (!assignmentInput || typeof assignmentInput !== 'object') {
    return [];
  }

  return [
    assignmentInput.assignedTailor,
    assignmentInput.staffAssignments?.tailor,
    assignmentInput.staffAssignments?.presser,
    assignmentInput.staffAssignments?.layoutArtist,
  ].filter(Boolean);
};

export const isAssignedToUser = (assignmentInput, user = {}) => {
  const normalizedAssignments = getAssignmentValues(assignmentInput)
    .map(normalizeAssignmentValue)
    .filter(Boolean);

  if (!normalizedAssignments.length) return false;

  const candidates = getAssignmentCandidates(user).map(normalizeAssignmentValue);

  return normalizedAssignments.some((assignedValue) =>
    candidates.some((candidate) =>
      candidate.includes(assignedValue) || assignedValue.includes(candidate)
    )
  );
};
