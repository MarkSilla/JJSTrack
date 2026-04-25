import { useMemo, useState, useEffect, useCallback } from 'react';
import { bookingApi } from '../../../services/bookingApi';
import { orderApi } from '../../../services/orderApi.js';
import useOrderFeedSocket from '../../../hooks/useOrderFeedSocket.js';
import {
    mapBookingToTaskDetail,
    mapOrderToTaskDetail,
} from '../../../utils/taskMappers.js';

const SERVICE_STEPS = {
    "Team Jersey": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Organization": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Repair": ["Drop Off", "Cutting", "Sewing", "Pick-up"],
};

const useOrderDetails = (orderId) => {
    const [order, setOrder] = useState(null);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            setOrder(null);
            return;
        }

        try {
            const [bookingResponse, orderResponse] = await Promise.allSettled([
                bookingApi.getBookingById(orderId),
                orderApi.getOrderById(orderId),
            ]);

            if (bookingResponse.status === 'fulfilled') {
                const booking =
                    bookingResponse.value?.booking || bookingResponse.value?.data || bookingResponse.value;

                if (booking?._id || booking?.id) {
                    const mappedOrder = mapBookingToTaskDetail(booking);
                    setOrder(mappedOrder);
                    return;
                }
            }

            if (orderResponse.status === 'fulfilled') {
                const rawOrder = orderResponse.value?.order || orderResponse.value?.data || orderResponse.value;
                const invoice = orderResponse.value?.invoice || rawOrder?.invoice || null;

                if (rawOrder?._id || rawOrder?.id) {
                    const mappedOrder = mapOrderToTaskDetail(rawOrder, invoice);
                    setOrder(mappedOrder);
                    return;
                }
            }

            console.log('No task data found');
            setOrder(null);
        } catch (err) {
            console.error('Error fetching order details:', err);
            setOrder(null);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    useOrderFeedSocket(() => {
        fetchOrderDetails();
    });

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
