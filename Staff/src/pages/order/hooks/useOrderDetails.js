import { useMemo } from 'react';
import { MOCK_ORDERS, CURRENT_STAFF } from '../mock/mockData';

const SERVICE_STEPS = {
    "Team Jersey": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Organization": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Repair": ["Drop Off", "Cutting", "Sewing", "Pick-up"],
};

const useOrderDetails = (orderId) => {
    const order = useMemo(() => {
        if (!orderId) return null;
        const found = MOCK_ORDERS.find(o => o.id === orderId && o.assignedTo === CURRENT_STAFF);
        return found || null;
    }, [orderId]);

    const steps = useMemo(() => {
        if (!order) return [];
        return order.steps || order.productionProgress || SERVICE_STEPS[order.serviceType] || SERVICE_STEPS["Team Jersey"];
    }, [order]);

    const currentStepIdx = useMemo(() => {
        if (!order || !steps) return 0;
        const activeIdx = steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : steps.length - 1;
    }, [order, steps]);

    const statusLabel = useMemo(() => {
        if (!order) return 'Pending';
        if (order.status === 'In Progress' || order.status === 'In-Progress') return 'In Progress';
        if (order.status === 'Completed' || order.status === 'Complete') return 'Completed';
        return 'Pending';
    }, [order]);

    return { order, steps, currentStepIdx, statusLabel };
};

export default useOrderDetails;
