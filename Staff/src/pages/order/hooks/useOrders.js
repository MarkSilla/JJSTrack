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

const useOrders = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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
            (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.item || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filterStatus !== 'All') {
            result = result.filter(o => getDerivedStatus(o) === filterStatus);
        }

        return result;
    }, [searchQuery, filterStatus, staffOrders]);

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
        getDerivedStatus,
        getActiveStepIndex,
        loading,
        error,
        refetchBookings: fetchBookings,
    };
};

export default useOrders;
