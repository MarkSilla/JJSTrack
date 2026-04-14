import { SERVICE_STEPS, PIECE_RATES } from '../pages/content/AdOrder/Constants.js';

export const fmt = (value = 0) => {
    const amount = Number(value) || 0;
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const isOverdue = (dueDateStr) => {
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
};

const normalizeOrderStatus = (status) => String(status || '').trim().toLowerCase();
const isCompletedStatus = (order) => {
    const statusKey = normalizeOrderStatus(order.status);
    if (["completed", "complete", "released", "pick-up", "pick up", "pickup", "ready", "ready for pickup", "readyforpickup"].includes(statusKey)) return true;
    return Array.isArray(order.steps) && order.steps.length > 0 && order.steps.every(step => Boolean(step?.done));
};

export const getDerivedStatus = (order) => {
    if (order?.status === "Cancelled") return "Cancelled";
    const normalizedStatus = normalizeOrderStatus(order?.status);
    if (normalizedStatus === "released") return "Released";
    const needsApproval = order?.serviceType === 'Team Jersey' || order?.serviceType === 'Organization';
    const hasPickupDate = Boolean(order?.pickupDate || order?.invoice?.dueDate || order?.estimatedCompletion);
    if (needsApproval && !hasPickupDate) return "For Approval";
    if (order.status !== 'Completed' && order.status !== 'Complete' && isOverdue(order.invoice?.dueDate)) return "Overdue";
    if (order.status === "In Progress" || order.status === "In-Progress") return "In Progress";
    if (isCompletedStatus(order)) return "Completed";
    return "Pending";
};

export const getActiveStepIndex = (order, orderTracking) => {
    if (!order) return 0;
    if (order.steps && order.steps.length > 0) {
        const activeIdx = order.steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = order.steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : order.steps.length - 1;
    }
    if (orderTracking[order.id] !== undefined) return orderTracking[order.id];
    const steps = SERVICE_STEPS[order.serviceType] || SERVICE_STEPS["Team Jersey"];
    if (order.status === "Complete" || order.status === "Completed") return steps.length - 1;
    if (order.status === "In Progress" || order.status === "In-Progress") return 1;
    return 0;
};

export const computeOrderEarnings = (order, employeeId) => {
    if (!employeeId) return null;
    const items = order.invoice?.items || [];
    let total = 0;
    const lines = items.map(item => {
        const key = item.itemType || item.description;
        const rate = PIECE_RATES[key] || 0;
        const earned = rate * item.qty;
        total += earned;
        return { label: item.description, qty: item.qty, rate, earned };
    }).filter(l => l.rate > 0);
    return lines.length > 0 ? { lines, total } : null;
};

export const getDropDate = (order) => {
    if (!order || !order.steps) return 'N/A';
    try {
        const droppedOffStep = order.steps.find(s => s.label?.toLowerCase().includes('drop'));
        if (droppedOffStep?.date) {
            const dateObj = new Date(droppedOffStep.date);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
        }
    } catch (e) {
        console.error('Date formatting error:', e);
    }
    return 'N/A';
};
