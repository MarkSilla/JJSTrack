import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../services/orderApi.js';
import { bookingApi } from '../../services/bookingApi.js';
import { staffApi } from '../../services/staffApi.js';

import {
    EMPLOYEE_POOL,
    STATUS_CONFIG,
    TYPE_CONFIG,
    SERVICE_STEPS,
    PRIORITY_CONFIG,
    PIECE_RATES,
} from './AdOrder/Constants.js';

import KPICards from './AdOrder/Kpicards';
import OrderList from './AdOrder/Orderlist';
import AssignConfirmationModal from './AdOrder/Assignedconfirmationmodal';
import { getDerivedStatus } from '../../utils/helpers.js';

const LIVE_REFRESH_MS = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getActiveStepIndex = (order, orderTracking) => {
    if (!order) return 0;
    if (order.steps && order.steps.length > 0) {
        const activeIdx = order.steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = order.steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : order.steps.length - 1;
    }
    if (orderTracking[order.id] !== undefined) return orderTracking[order.id];
    const steps = SERVICE_STEPS[order.serviceType] || SERVICE_STEPS['Team Jersey'];
    if (order.status === 'Complete' || order.status === 'Completed') return steps.length - 1;
    if (order.status === 'In Progress' || order.status === 'In-Progress') return 1;
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

export const convertBooking = (booking) => {
    let validDate = null;
    if (booking.pickupDate) {
        const p = new Date(booking.pickupDate);
        if (!isNaN(p)) validDate = p.toISOString();
    }

    let dropDate = 'N/A';
    try {
        const droppedOffStep = booking.steps?.find(s => s.label?.toLowerCase().includes('drop') && s.date);
        if (droppedOffStep?.date) {
            const dateObj = new Date(droppedOffStep.date);
            if (!isNaN(dateObj.getTime()))
                dropDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    } catch (e) {
        console.error('Date formatting error:', e);
    }

    return {
        ...booking,
        id: booking.id || booking._id,
        orderId: booking._id,
        customer: booking.contact?.fullName || booking.customerName || 'Unknown',
        item: booking.service || booking.bookingType || 'Service',
        serviceType:
            booking.bookingType === 'jersey' ? 'Team Jersey'
                : booking.bookingType === 'organizational' ? 'Organization'
                    : booking.bookingType === 'repair' ? 'Repair' : 'Service',
        status: booking.status || 'For Approval',
        isBooking: true,
        date: dropDate,
        createdAt: booking.createdAt,
        invoice: {
            dueDate: validDate,
            billTo: {
                name: booking.contact?.fullName || 'Unknown',
                phone: booking.contact?.phone,
                email: booking.contact?.email,
                address: booking.contact?.address,
            },
            items:
                booking.items?.length > 0
                    ? booking.items
                    : booking.selectedOptions?.length > 0
                        ? booking.selectedOptions.map(opt => ({
                            description: opt.name || 'Service',
                            qty: opt.quantity || 1,
                            unitPrice: opt.price || 0,
                            addOnPrice: 0,
                        }))
                        : [{ description: booking.service || booking.bookingType || 'Service', qty: 1, unitPrice: 0, addOnPrice: 0 }],
        },
        contact: booking.contact || {},
        phone: booking.contact?.phone || 'N/A',
        email: booking.contact?.email || 'N/A',
        address: booking.contact?.address || 'N/A',
    };
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdOrder() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortOption, setSortOption] = useState('date-newest');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [orderTracking, setOrderTracking] = useState(() => {
        try { const saved = localStorage.getItem('orderTracking'); return saved ? JSON.parse(saved) : {}; }
        catch { return {}; }
    });
    const [assignments, setAssignments] = useState(() => {
        try { const saved = localStorage.getItem('assignments'); return saved ? JSON.parse(saved) : {}; }
        catch { return {}; }
    });
    const [assignConfirm, setAssignConfirm] = useState({ show: false, orderId: null, empId: null });

    // ─── Fetch Orders & Bookings ──────────────────────────────────────────────

    const fetchOrdersAndBookings = useCallback(async (silent = false) => {
            try {
                if (!silent) {
                    setLoading(true);
                    setError(null);
                }

                if (!silent) {
                    // Fetch staff list for assignments
                    try {
                        const staffResponse = await staffApi.getAllStaff();
                        const staffData = staffResponse.staff || staffResponse.data || [];
                        setStaffList(Array.isArray(staffData) ? staffData : []);
                    } catch (staffErr) {
                        console.warn('Failed to fetch staff list, using fallback:', staffErr);
                        // Fallback to EMPLOYEE_POOL if staffApi fails
                        setStaffList(EMPLOYEE_POOL);
                    }
                }

                const [orderResponse, bookingResponse] = await Promise.allSettled([
                    orderApi.getAllOrders(),
                    bookingApi.getAllBookings(),
                ]);

                let allItems = [];

                if (orderResponse.status === 'fulfilled') {
                    const orderData = orderResponse.value?.orders || orderResponse.value?.data || [];
                    allItems.push(...(Array.isArray(orderData) ? orderData : []));
                }

                if (bookingResponse.status === 'fulfilled') {
                    const bookingData = bookingResponse.value?.bookings || bookingResponse.value?.data || [];
                    const bookingsArray = Array.isArray(bookingData) ? bookingData : [];
                    allItems.push(...bookingsArray.map(convertBooking));
                }

                allItems.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
                setOrders(allItems);
            } catch (err) {
                console.error('Failed to fetch orders and bookings:', err);
                if (!silent) {
                    setError('Failed to load orders.');
                    setOrders([]);
                }
            } finally {
                if (!silent) {
                    setLoading(false);
                }
            }
    }, []);

    useEffect(() => {
        fetchOrdersAndBookings(false);

        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            fetchOrdersAndBookings(true);
        }, LIVE_REFRESH_MS);

        return () => window.clearInterval(intervalId);
    }, [fetchOrdersAndBookings]);

    // ─── Derived State ────────────────────────────────────────────────────────

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

        return parseDateValue(order.invoice?.dueDate || order.estimatedCompletion || order.pickupDate || order.createdAt || order.date);
    };

    const filteredOrders = useMemo(() => {
        let result = orders.filter(o =>
            (o.customer || o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.id || o._id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.item || o.itemType || o.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filterStatus === 'In Progress') result = result.filter(o => getDerivedStatus(o) === 'In Progress');
        else if (filterStatus === 'Released') result = result.filter(o => getDerivedStatus(o) === 'Released');
        else if (filterStatus === 'Overdue') result = result.filter(o => getDerivedStatus(o) === 'Overdue');
        else if (filterStatus === 'For Approval') result = result.filter(o => getDerivedStatus(o) === 'For Approval');
        else if (filterStatus === 'Completed') result = result.filter(o => getDerivedStatus(o) === 'Completed');
        else if (filterStatus === 'Cancelled') result = result.filter(o => getDerivedStatus(o) === 'Cancelled');
        else if (filterStatus === 'All') result = result.filter(o => getDerivedStatus(o) !== 'Cancelled');

        return [...result].sort((a, b) => {
            const aTime = getOrderSortTime(a);
            const bTime = getOrderSortTime(b);
            return sortOption === 'date-oldest' ? aTime - bTime : bTime - aTime;
        });
    }, [searchQuery, filterStatus, orders, sortOption]);

    const counts = useMemo(() => {
        const c = { All: 0, 'For Approval': 0, 'In Progress': 0, Released: 0, Overdue: 0, Completed: 0, Cancelled: 0 };
        orders.forEach(o => {
            const s = getDerivedStatus(o);
            if (c[s] !== undefined) c[s]++;
            if (s !== 'Cancelled') c.All++;
        });
        return c;
    }, [orders]);

    // ─── Navigation handler (replaces setActiveOrderId) ───────────────────────

    const handleOrderClick = (orderId) => {
        navigate(`/admin/orders/${orderId}`);
    };

    // ─── Assign handlers (kept here so they persist across navigation) ────────

    const handleAssign = (orderId, empId) => {
        setAssignConfirm({ show: true, orderId, empId });
    };

    const confirmAssign = () => {
        const { orderId, empId } = assignConfirm;
        
        // empId is now the fullName directly from dropdown
        const assignedTailorName = empId;

        console.log('🎯 Assigning booking:', { orderId, empId, assignedTailorName });

        setAssignments(prev => {
            const updated = { ...prev, [orderId]: assignedTailorName };
            localStorage.setItem('assignments', JSON.stringify(updated));
            return updated;
        });

        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) === orderId) {
                    const isBooking = !!order.bookingType;
                    const orderIdToUse = order._id || order.id;
                    console.log('📤 Updating booking API:', { isBooking, orderIdToUse, assignedTailorName });
                    if (isBooking) {
                        bookingApi.updateBooking(orderIdToUse, { assignedTailor: assignedTailorName })
                            .then(res => console.log('✅ Booking update success:', res))
                            .catch(err => console.error('❌ Booking update error:', err));
                    } else {
                        orderApi.assignEmployee(orderIdToUse, assignedTailorName)
                            .then(res => console.log('✅ Order update success:', res))
                            .catch(err => console.error('❌ Order update error:', err));
                    }
                    return { ...order, assignedTailor: assignedTailorName };
                }
                return order;
            })
        );

        setAssignConfirm({ show: false, orderId: null, empId: null });
    };

    const cancelAssign = () => setAssignConfirm({ show: false, orderId: null, empId: null });

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="font-inter min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-gray-400 text-sm font-medium">Loading orders...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="font-inter min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-red-500 text-sm font-medium">{error}</div>
            </div>
        );
    }

    return (
        <div className="font-inter min-h-screen bg-slate-50 flex flex-col p-3 lg:p-6 pb-20">
            <KPICards counts={counts} />

            <div className="flex gap-6">

                <OrderList
                    filteredOrders={filteredOrders}
                    activeOrderId={null}           /* No active selection on the list page */
                    onOrderClick={handleOrderClick} /* NEW: navigate instead of setActiveOrderId */
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    isFilterOpen={isFilterOpen}
                    setIsFilterOpen={setIsFilterOpen}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    counts={counts}
                    orderTracking={orderTracking}
                    assignments={assignments}
                    fullWidth                      /* NEW: tell OrderList it owns the full width */
                />
            </div>

            <AssignConfirmationModal
                assignConfirm={assignConfirm}
                staffList={staffList}
                onConfirm={confirmAssign}
                onCancel={cancelAssign}
            />
        </div>
    );
}
