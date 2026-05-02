import { getStoredStaffUser } from './staffSession.js';

const STEP_ROLE_ACCESS = {
    'dropped off': 'admin',
    'drop off': 'admin',
    'pick up': 'admin',
    'pickup': 'admin',
    'layout': 'layout artist',
    'printing': 'layout artist',
    'pressing': 'presser',
    'sewing': 'tailor',
};

const ROLE_LABELS = {
    admin: 'Admin',
    'layout artist': 'Layout Artist',
    presser: 'Presser',
    tailor: 'Tailor',
};

const normalizeText = (value = '') =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ');

export const normalizeWorkflowStepLabel = (label = '') => normalizeText(label);

export const getCurrentStaffRole = () => {
    const staffUser = getStoredStaffUser();
    return staffUser?.position || staffUser?.role || null;
};

export const getCurrentStaffDisplayName = () => {
    const staffUser = getStoredStaffUser();
    return staffUser?.fullName || staffUser?.name || staffUser?.email || 'Staff';
};

export const getWorkflowStepRequiredRole = (stepLabel = '') =>
    STEP_ROLE_ACCESS[normalizeWorkflowStepLabel(stepLabel)] || null;

export const formatWorkflowRoleLabel = (role = '') =>
    ROLE_LABELS[normalizeText(role)] || 'Authorized Staff';

export const canStaffAccessStep = (stepLabel, staffRole) => {
    if (!stepLabel || !staffRole) return false;

    const requiredRole = getWorkflowStepRequiredRole(stepLabel);
    if (!requiredRole) return false;

    return normalizeText(staffRole) === requiredRole;
};

export const getWorkflowStepAccessLabel = (stepLabel, staffRole) => {
    if (!stepLabel) return 'Unavailable';

    if (canStaffAccessStep(stepLabel, staffRole)) {
        return 'Tap to complete';
    }

    const requiredRole = getWorkflowStepRequiredRole(stepLabel);
    if (!requiredRole) return 'Restricted';
    if (requiredRole === 'admin') return 'Admin Only';

    return `For ${formatWorkflowRoleLabel(requiredRole)}`;
};
