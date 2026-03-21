import React, { useState, useMemo, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { orderApi } from '../../services/orderApi.js';
import { bookingApi } from '../../services/bookingApi.js';

// Constants
import {
    EMPLOYEE_POOL,
    ASSIGNABLE_EMPLOYEES,
    STATUS_CONFIG,
    TYPE_CONFIG,
    SERVICE_STEPS,
    PRIORITY_CONFIG,
    PIECE_RATES,
} from './AdOrder/Constants.js';

// Components
import KPICards from './AdOrder/Kpicards';
import OrderList from './AdOrder/Orderlist';
import OrderDetail from './AdOrder/Orderdetail';
import AssignConfirmationModal from './AdOrder/Assignedconfirmationmodal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isOverdue = (dueDateStr) => {
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
};

const getDerivedStatus = (order) => {
    if (!order) return "Pending";
    // Check for cancelled first
    if (order.status === 'Cancelled') return 'Cancelled';
    const needsApproval = order?.serviceType === 'Team Jersey' || order?.serviceType === 'Organization';
    const hasPickupDate = Boolean(order?.pickupDate || order?.invoice?.dueDate || order?.estimatedCompletion);
    if (needsApproval && !hasPickupDate) return "For Approval";
    if (order.status !== 'Completed' && order.status !== 'Complete' && isOverdue(order.invoice?.dueDate)) return "Overdue";
    if (order.status === "In Progress" || order.status === "In-Progress") return "In Progress";
    if (order.status === "Ready") return "Ready";
    if (order.status === "Completed" || order.status === "Complete") return "Completed";
    return "Pending";
};

const getActiveStepIndex = (order, orderTracking) => {
    if (!order) return 0;
    if (orderTracking[order.id] !== undefined) return orderTracking[order.id];
    if (order.steps && order.steps.length > 0) {
        const activeIdx = order.steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = order.steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : order.steps.length - 1;
    }
    const steps = SERVICE_STEPS[order.serviceType] || SERVICE_STEPS["Team Jersey"];
    if (order.status === "Complete" || order.status === "Completed") return steps.length - 1;
    if (order.status === "In Progress" || order.status === "In-Progress") return 1;
    return 0;
};

const computeOrderEarnings = (order, employeeId) => {
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

const getDropDate = (order) => {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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

    useEffect(() => {
        const fetchOrdersAndBookings = async () => {
            try {
                setLoading(true);
                setError(null);

                const [orderResponse, bookingResponse] = await Promise.allSettled([
                    orderApi.getAllOrders(),
                    bookingApi.getAllBookings()
                ]);

                let allItems = [];

                if (orderResponse.status === 'fulfilled') {
                    const orderData = orderResponse.value?.orders || orderResponse.value?.data || [];
                    allItems.push(...(Array.isArray(orderData) ? orderData : []));
                }

                if (bookingResponse.status === 'fulfilled') {
                    const bookingData = bookingResponse.value?.bookings || bookingResponse.value?.data || [];
                    const bookingsArray = Array.isArray(bookingData) ? bookingData : [];

                    const convertedBookings = bookingsArray.map(booking => {
                        let validDate = null;
                        if (booking.pickupDate) { const p = new Date(booking.pickupDate); if (!isNaN(p)) validDate = p.toISOString(); }

                        let dropDate = 'N/A';
                        try {
                            const droppedOffStep = booking.steps?.find(s => s.label?.toLowerCase().includes('drop') && s.date);
                            if (droppedOffStep?.date) {
                                const dateObj = new Date(droppedOffStep.date);
                                if (!isNaN(dateObj.getTime())) dropDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            }
                        } catch (e) { console.error('Date formatting error:', e); }

                        return {
                            ...booking,
                            id: booking.id || booking._id,
                            orderId: booking._id,
                            customer: booking.contact?.fullName || booking.customerName || 'Unknown',
                            item: booking.service || booking.bookingType || 'Service',
                            serviceType: booking.bookingType === 'jersey' ? 'Team Jersey'
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
                                items: booking.items?.length > 0 ? booking.items
                                    : booking.selectedOptions?.length > 0
                                        ? booking.selectedOptions.map(opt => ({ description: opt.name || 'Service', qty: opt.quantity || 1, unitPrice: opt.price || 0, addOnPrice: 0 }))
                                        : [{ description: booking.service || booking.bookingType || 'Service', qty: 1, unitPrice: 0, addOnPrice: 0 }],
                            },
                            contact: booking.contact || {},
                            phone: booking.contact?.phone || 'N/A',
                            email: booking.contact?.email || 'N/A',
                            address: booking.contact?.address || 'N/A',
                        };
                    });
                    allItems.push(...convertedBookings);
                }

                allItems.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
                setOrders(allItems);
                if (allItems.length > 0) setActiveOrderId(allItems[0].id || allItems[0]._id);
            } catch (err) {
                console.error('Failed to fetch orders and bookings:', err);
                setError('Failed to load orders.');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrdersAndBookings();
    }, []);

    // ─── Derived State ────────────────────────────────────────────────────────

    const filteredOrders = useMemo(() => {
        let result = orders.filter(o =>
            (o.customer || o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.id || o._id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.item || o.itemType || o.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Filter by status
        if (filterStatus === 'In Progress') result = result.filter(o => getDerivedStatus(o) === 'In Progress');
        else if (filterStatus === 'Ready') result = result.filter(o => getDerivedStatus(o) === 'Ready');
        else if (filterStatus === 'Overdue') result = result.filter(o => getDerivedStatus(o) === 'Overdue');
        else if (filterStatus === 'For Approval') result = result.filter(o => getDerivedStatus(o) === 'For Approval');
        else if (filterStatus === 'Cancelled') result = result.filter(o => getDerivedStatus(o) === 'Cancelled');
        else if (filterStatus === 'All') result = result.filter(o => getDerivedStatus(o) !== 'Cancelled'); // Hide cancelled by default

        return result;
    }, [searchQuery, filterStatus, orders]);

    const counts = useMemo(() => {
        const c = { All: 0, 'For Approval': 0, 'In Progress': 0, 'Ready': 0, 'Overdue': 0, 'Cancelled': 0 };
        orders.forEach(o => {
            const s = getDerivedStatus(o);
            if (c[s] !== undefined) c[s]++;
            if (s !== 'Cancelled') c.All++; // All count excludes cancelled
        });
        return c;
    }, [orders]);

    const activeOrder = useMemo(() =>
        orders.find(o => (o.id || o._id) === activeOrderId) ?? null,
        [activeOrderId, orders]
    );
    const activeOrderSteps = useMemo(() =>
        activeOrder?.steps || (activeOrder ? (SERVICE_STEPS[activeOrder.serviceType] || SERVICE_STEPS['Team Jersey']).map(label => ({ label })) : []),
        [activeOrder]
    );
    const currentStepIdx = useMemo(() => getActiveStepIndex(activeOrder, orderTracking), [activeOrder, orderTracking]);
    const assignedEmployee = useMemo(() => {
        if (!activeOrder) return null;
        const empId = assignments[activeOrder.id || activeOrder._id];
        return empId ? EMPLOYEE_POOL.find(e => e.id === empId) : null;
    }, [activeOrder, assignments]);
    const earningsPreview = useMemo(() => {
        if (!activeOrder) return null;
        return computeOrderEarnings(activeOrder, assignments[activeOrder.id || activeOrder._id]);
    }, [activeOrder, assignments]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleStepClick = (orderId, stepIndex) => {
        const orderToUpdate = orders.find(o => (o.id || o._id) === orderId);
        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) === orderId && order.steps) {
                    const updatedSteps = [...order.steps];
                    if (updatedSteps[stepIndex]) {
                        const now = new Date();
                        const dateStr = now.toISOString().split('T')[0];
                        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                        updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], date: dateStr, time: timeStr, done: true, active: true };
                        const isBooking = !!order.bookingType;
                        const orderIdToUse = order._id || order.id;

                        // If marking "Dropped Off" step (index 0) as done, change status to "In Progress"
                        const updateData = { steps: updatedSteps };
                        if (stepIndex === 0) {
                            updateData.status = "In Progress";
                        }

                        if (isBooking) {
                            bookingApi.updateBooking(orderIdToUse, updateData).catch(err => console.error(err));
                        } else {
                            orderApi.updateOrder(orderIdToUse, updateData).catch(err => console.error(err));
                        }
                    }
                    return { ...order, steps: updatedSteps };
                }
                return order;
            })
        );

        setOrderTracking(prev => {
            let nextStepIdx = stepIndex + 1;
            if (orderToUpdate?.steps && nextStepIdx < orderToUpdate.steps.length) {
                while (nextStepIdx < orderToUpdate.steps.length && orderToUpdate.steps[nextStepIdx]?.done) nextStepIdx++;
            }
            const updated = { ...prev, [orderId]: nextStepIdx };
            localStorage.setItem('orderTracking', JSON.stringify(updated));
            return updated;
        });
    };

    const handleAssign = (orderId, empId) => {
        setAssignConfirm({ show: true, orderId, empId });
    };

    const confirmAssign = () => {
        const { orderId, empId } = assignConfirm;
        const employee = EMPLOYEE_POOL.find(e => e.id === empId);
        const assignedTailorName = employee ? employee.name : empId;

        setAssignments(prev => {
            const updated = { ...prev, [orderId]: empId };
            localStorage.setItem('assignments', JSON.stringify(updated));
            return updated;
        });

        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) === orderId) {
                    const isBooking = !!order.bookingType;
                    const orderIdToUse = order._id || order.id;
                    if (isBooking) {
                        bookingApi.updateBooking(orderIdToUse, { assignedTailor: assignedTailorName }).catch(err => console.error(err));
                    } else {
                        orderApi.assignEmployee(orderIdToUse, empId).catch(err => console.error(err));
                    }
                    return { ...order, assignedTailor: assignedTailorName };
                }
                return order;
            })
        );

        setAssignConfirm({ show: false, orderId: null, empId: null });
    };

    const cancelAssign = () => setAssignConfirm({ show: false, orderId: null, empId: null });

    const handleApprovePickupDate = (orderId, pickupDate) => {
        if (!pickupDate) return;

        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) === orderId) {
                    const isBooking = !!order.bookingType;
                    const orderIdToUse = order._id || order.id;
                    const patch = { pickupDate, status: 'Pending' };

                    if (isBooking) {
                        bookingApi.updateBooking(orderIdToUse, patch).catch(err => console.error(err));
                    } else {
                        orderApi.updateOrder(orderIdToUse, patch).catch(err => console.error(err));
                    }

                    return {
                        ...order,
                        status: 'Pending',
                        pickupDate,
                        estimatedCompletion: pickupDate,
                        invoice: { ...(order.invoice || {}), dueDate: pickupDate },
                    };
                }
                return order;
            })
        );
    };


    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="font-inter min-h-screen bg-slate-50 flex flex-col p-3 lg:p-6 pb-20">

            <KPICards counts={counts} />

            <div className="flex gap-6">
                <OrderList
                    filteredOrders={filteredOrders}
                    activeOrderId={activeOrderId}
                    setActiveOrderId={setActiveOrderId}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isFilterOpen={isFilterOpen}
                    setIsFilterOpen={setIsFilterOpen}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    counts={counts}
                    orderTracking={orderTracking}
                    assignments={assignments}
                />

                <div className={`flex-1 flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-64px)] ${activeOrder ? 'flex' : 'hidden lg:flex'}`}>
                    {activeOrder && (
                        <OrderDetail
                            activeOrder={activeOrder}
                            activeOrderSteps={activeOrderSteps}
                            currentStepIdx={currentStepIdx}
                            assignedEmployee={assignedEmployee}
                            earningsPreview={earningsPreview}
                            assignments={assignments}
                            isMenuOpen={isMenuOpen}
                            setIsMenuOpen={setIsMenuOpen}
                            setActiveOrderId={setActiveOrderId}
                            handleStepClick={handleStepClick}
                            handleAssign={handleAssign}
                            handleApprovePickupDate={handleApprovePickupDate}
                        />
                    )}
                </div>
            </div>

            <AssignConfirmationModal
                assignConfirm={assignConfirm}
                onConfirm={confirmAssign}
                onCancel={cancelAssign}
            />
        </div>
    );
}