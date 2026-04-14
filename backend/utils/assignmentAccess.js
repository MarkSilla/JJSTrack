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

export const isAssignedToUser = (assignedTailor, user = {}) => {
  const normalizedAssignedTailor = normalizeAssignmentValue(assignedTailor);
  if (!normalizedAssignedTailor) return false;

  const candidates = getAssignmentCandidates(user).map(normalizeAssignmentValue);

  return candidates.some(candidate => candidate.includes(normalizedAssignedTailor));
};
