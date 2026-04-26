import { useState, useMemo, useEffect, useCallback } from 'react';
import { bookingApi } from '../../../services/bookingApi';
import { orderApi } from '../../../services/orderApi.js';
import useOrderFeedSocket from '../../../hooks/useOrderFeedSocket.js';
import {
    isStandaloneBookingTask,
    mapBookingToTask,
    mapOrderToTask,
} from '../../../utils/taskMappers.js';
import { getStaffDerivedStatus } from '../../../utils/orderStatus.js';

const FALLBACK_REFRESH_MS = 60000;

const getActiveStepIndex = (order) => {
    if (!order) return 0;
    if (order.steps && order.steps.length > 0) {
        const activeIdx = order.steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = order.steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : order.steps.length - 1;
    }
    const derivedStatus = getStaffDerivedStatus(order);
    if (derivedStatus === 'Completed' || derivedStatus === 'Released') return 4;
    if (order.status === 'In Progress' || order.status === 'In-Progress') return 1;
    return 0;
};

const getOrderSortTime = (order) => {
    const parseDateValue = (value) => {
        if (!value) return 0;
        const date = new Date(value);
        return Number.isFinite(date.getTime()) ? date.getTime() : 0;
    };

    if (Array.isArray(order.steps) && order.steps.length > 0) {
        const doneSteps = order.steps.filter(step => step?.done && step?.date);
        if (doneSteps.length > 0) {
            const latestDone = doneSteps.reduce((latest, step) =>
                parseDateValue(step.date) > parseDateValue(latest.date) ? step : latest,
                doneSteps[0]
            );
            const latestTime = parseDateValue(latestDone.date);
            if (latestTime) return latestTime;
        }
    }

    // Sort by booking creation date (newest first), not by due date
    return parseDateValue(order.createdAt || order.date || 0);
};

const useOrders = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortOption, setSortOption] = useState('date-newest');
    const [staffOrders, setStaffOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch bookings function
    const fetchBookings = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
                setError(null);
            }
            const [bookingResponse, orderResponse] = await Promise.allSettled([
                bookingApi.getAllBookings(),
                orderApi.getAllOrders(),
            ]);

            const bookingItems =
                bookingResponse.status === 'fulfilled'
                    ? (bookingResponse.value?.bookings || bookingResponse.value?.data || []).filter((item) => !item?.isArchived)
                    : [];
            const orderItems =
                orderResponse.status === 'fulfilled'
                    ? (orderResponse.value?.orders || orderResponse.value?.data || []).filter((item) => !item?.isArchived)
                    : [];

            const mappedBookings = Array.isArray(bookingItems)
                ? bookingItems.filter(isStandaloneBookingTask).map(mapBookingToTask)
                : [];
            const mappedOrders = Array.isArray(orderItems)
                ? orderItems.map(mapOrderToTask)
                : [];

            const mergedTasks = [...mappedOrders, ...mappedBookings].sort((first, second) => {
                const firstTime = getOrderSortTime(first);
                const secondTime = getOrderSortTime(second);
                return secondTime - firstTime;
            });

            setStaffOrders(mergedTasks);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            if (!silent) {
                setError('Failed to load orders.');
                setStaffOrders([]);
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    // Fetch on mount with a slower polling fallback in case the socket disconnects
    useEffect(() => {
        fetchBookings(false);
        
        const interval = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            fetchBookings(true);
        }, FALLBACK_REFRESH_MS);
        
        return () => clearInterval(interval);
    }, [fetchBookings]);

    useOrderFeedSocket(() => {
        fetchBookings(true);
    });

    const filteredOrders = useMemo(() => {
        let result = staffOrders.filter(o =>
            (o.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(o.displayId || o.orderId || o.bookingId || o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.item || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filterStatus !== 'All') {
            result = result.filter(o => getStaffDerivedStatus(o) === filterStatus);
        }

        return [...result].sort((a, b) => {
            const aTime = getOrderSortTime(a);
            const bTime = getOrderSortTime(b);
            return sortOption === 'date-oldest' ? aTime - bTime : bTime - aTime;
        });
    }, [searchQuery, filterStatus, staffOrders, sortOption]);

    const counts = useMemo(() => {
        const c = { All: 0, Pending: 0, Overdue: 0, 'In Progress': 0, Completed: 0, Released: 0 };
        staffOrders.forEach(o => {
            const s = getStaffDerivedStatus(o);
            if (c[s] !== undefined) c[s]++;
            c.All++;
        });
        return c;
    }, [staffOrders]);

    return {
        orders: staffOrders,
        filteredOrders,
        counts,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        isFilterOpen,
        setIsFilterOpen,
        sortOption,
        setSortOption,
        getDerivedStatus: getStaffDerivedStatus,
        getActiveStepIndex,
        loading,
        error,
        refetchBookings: fetchBookings,
    };
};

export default useOrders;
