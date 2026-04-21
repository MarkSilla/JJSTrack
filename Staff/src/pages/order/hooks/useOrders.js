import { useState, useMemo, useEffect, useCallback } from 'react';
import { bookingApi } from '../../../services/bookingApi';

const STATUS_FLOW = ['Pending', 'In Progress', 'Completed'];

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const getDerivedStatus = (order) => {
    if (!order) return 'Pending';
    if (order.status === 'Cancelled') return 'Cancelled';
    if (order.status === 'In Progress' || order.status === 'In-Progress') return 'In Progress';
    // Treat "Ready for Pickup" as "Completed"
    if (order.status === 'Ready' || order.status === 'Ready for Pickup' || order.status === 'ReadyForPickup' || order.status === 'ready-for-pickup') return 'Completed';
    if (order.status === 'Completed' || order.status === 'Complete') return 'Completed';
    return 'Pending';
};

const getActiveStepIndex = (order) => {
    if (!order) return 0;
    if (order.steps && order.steps.length > 0) {
        const activeIdx = order.steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = order.steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : order.steps.length - 1;
    }
    if (order.status === 'Complete' || order.status === 'Completed') return 4;
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

    return parseDateValue(order.dueDate || order.pickupDate || order.createdAt || order.date);
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
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await bookingApi.getAllBookings();
            const bookings = response.bookings || response.data || [];
            
            // Map bookings to order format
            const orders = Array.isArray(bookings) ? bookings.map(booking => ({
                id: booking._id || booking.id,
                displayId: booking.bookingId || booking.orderId || booking._id || booking.id,
                customer: booking.contact?.fullName || booking.customerName || 'Unknown',
                item: booking.service || booking.bookingType || 'Service',
                status: booking.status || 'Pending',
                date: booking.pickupDate || booking.createdAt,
                steps: booking.steps || [],
                assignedTailor: booking.assignedTailor,
                serviceType: capitalize(booking.bookingType) || booking.serviceType || 'Service',
                serviceTitle: booking.service || booking.bookingType || 'Service',
                dueDate: booking.pickupDate || booking.dueDate,
                ...booking
            })) : [];
            
            setStaffOrders(orders);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setError('Failed to load orders.');
            setStaffOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount and auto-refresh every 30 seconds
    useEffect(() => {
        fetchBookings();
        
        const interval = setInterval(fetchBookings, 30000);
        
        return () => clearInterval(interval);
    }, [fetchBookings]);

    const filteredOrders = useMemo(() => {
        let result = staffOrders.filter(o =>
            (o.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(o.displayId || o.orderId || o.bookingId || o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.item || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filterStatus !== 'All') {
            result = result.filter(o => getDerivedStatus(o) === filterStatus);
        }

        return [...result].sort((a, b) => {
            const aTime = getOrderSortTime(a);
            const bTime = getOrderSortTime(b);
            return sortOption === 'date-oldest' ? aTime - bTime : bTime - aTime;
        });
    }, [searchQuery, filterStatus, staffOrders, sortOption]);

    const counts = useMemo(() => {
        const c = { All: 0, Pending: 0, 'In Progress': 0, Completed: 0 };
        staffOrders.forEach(o => {
            const s = getDerivedStatus(o);
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
        getDerivedStatus,
        getActiveStepIndex,
        loading,
        error,
        refetchBookings: fetchBookings,
    };
};

export default useOrders;
