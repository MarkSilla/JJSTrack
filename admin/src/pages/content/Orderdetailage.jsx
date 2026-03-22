/**
 * OrderDetailPage.jsx
 *
 * Standalone page for /orders/:orderId
 *
 * Responsibilities:
 *  - Reads `orderId` from the URL via `useParams`
 *  - Fetches all orders + bookings (same logic as AdOrder)
 *  - Finds the matching order using (order.id || order._id) === orderId
 *  - Renders <OrderDetail> in full-page mode (no side panel)
 *  - Back button navigates to /orders
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { orderApi } from '../../services/orderApi.js';
import { bookingApi } from '../../services/bookingApi.js';
import { EMPLOYEE_POOL, SERVICE_STEPS, PIECE_RATES } from './AdOrder/Constants.js';

import OrderDetail from './AdOrder/Orderdetail';
import AssignConfirmationModal from './AdOrder/Assignedconfirmationmodal';

// ─── Re-use helpers exported from AdOrder ────────────────────────────────────
// If you have a shared utils/helpers.js, import from there instead.
import {
    getDerivedStatus,
    getActiveStepIndex,
    computeOrderEarnings,
    convertBooking,
} from './AdOrder.jsx';

// ─── Page Component ───────────────────────────────────────────────────────────

export default function OrderDetailPage() {
    const { orderId } = useParams();   // /order/:orderId
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [orderTracking, setOrderTracking] = useState(() => {
        try { const s = localStorage.getItem('orderTracking'); return s ? JSON.parse(s) : {}; }
        catch { return {}; }
    });

    const [assignments, setAssignments] = useState(() => {
        try { const s = localStorage.getItem('assignments'); return s ? JSON.parse(s) : {}; }
        catch { return {}; }
    });

    const [assignConfirm, setAssignConfirm] = useState({ show: false, orderId: null, empId: null });

    // ── Fetch orders (identical logic to AdOrder) ──────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                setError(null);

                const [orderRes, bookingRes] = await Promise.allSettled([
                    orderApi.getAllOrders(),
                    bookingApi.getAllBookings(),
                ]);

                let allItems = [];

                if (orderRes.status === 'fulfilled') {
                    const data = orderRes.value?.orders || orderRes.value?.data || [];
                    allItems.push(...(Array.isArray(data) ? data : []));
                }

                if (bookingRes.status === 'fulfilled') {
                    const data = bookingRes.value?.bookings || bookingRes.value?.data || [];
                    allItems.push(...(Array.isArray(data) ? data : []).map(convertBooking));
                }

                allItems.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
                setOrders(allItems);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
                setError('Failed to load order details.');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // ── Find the active order using (order.id || order._id) === orderId ────────
    const activeOrder = useMemo(
        () => orders.find(o => (o.id || o._id) === orderId) ?? null,
        [orders, orderId]
    );

    const activeOrderSteps = useMemo(
        () => activeOrder?.steps
            || (activeOrder
                ? (SERVICE_STEPS[activeOrder.serviceType] || SERVICE_STEPS['Team Jersey']).map(label => ({ label }))
                : []),
        [activeOrder]
    );

    const currentStepIdx = useMemo(
        () => getActiveStepIndex(activeOrder, orderTracking),
        [activeOrder, orderTracking]
    );

    const assignedEmployee = useMemo(() => {
        if (!activeOrder) return null;
        const empId = assignments[activeOrder.id || activeOrder._id];
        return empId ? EMPLOYEE_POOL.find(e => e.id === empId) : null;
    }, [activeOrder, assignments]);

    const earningsPreview = useMemo(() => {
        if (!activeOrder) return null;
        return computeOrderEarnings(activeOrder, assignments[activeOrder.id || activeOrder._id]);
    }, [activeOrder, assignments]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleStepClick = (targetOrderId, stepIndex) => {
        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) !== targetOrderId || !order.steps) return order;

                const updatedSteps = [...order.steps];
                if (!updatedSteps[stepIndex]) return order;

                const now = new Date();
                updatedSteps[stepIndex] = {
                    ...updatedSteps[stepIndex],
                    date: now.toISOString().split('T')[0],
                    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    done: true,
                    active: true,
                };

                const patch = { steps: updatedSteps };
                if (stepIndex === 0) patch.status = 'In Progress';

                const idToUse = order._id || order.id;
                if (order.isBooking) {
                    bookingApi.updateBooking(idToUse, patch).catch(console.error);
                } else {
                    orderApi.updateOrder(idToUse, patch).catch(console.error);
                }

                return { ...order, steps: updatedSteps };
            })
        );

        setOrderTracking(prev => {
            const order = orders.find(o => (o.id || o._id) === targetOrderId);
            let nextIdx = stepIndex + 1;
            if (order?.steps) {
                while (nextIdx < order.steps.length && order.steps[nextIdx]?.done) nextIdx++;
            }
            const updated = { ...prev, [targetOrderId]: nextIdx };
            localStorage.setItem('orderTracking', JSON.stringify(updated));
            return updated;
        });
    };

    const handleAssign = (targetOrderId, empId) => {
        setAssignConfirm({ show: true, orderId: targetOrderId, empId });
    };

    const confirmAssign = () => {
        const { orderId: targetId, empId } = assignConfirm;
        const employee = EMPLOYEE_POOL.find(e => e.id === empId);
        const assignedTailorName = employee ? employee.name : empId;

        setAssignments(prev => {
            const updated = { ...prev, [targetId]: empId };
            localStorage.setItem('assignments', JSON.stringify(updated));
            return updated;
        });

        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) !== targetId) return order;
                const idToUse = order._id || order.id;
                if (order.isBooking) {
                    bookingApi.updateBooking(idToUse, { assignedTailor: assignedTailorName }).catch(console.error);
                } else {
                    orderApi.assignEmployee(idToUse, empId).catch(console.error);
                }
                return { ...order, assignedTailor: assignedTailorName };
            })
        );

        setAssignConfirm({ show: false, orderId: null, empId: null });
    };

    const cancelAssign = () => setAssignConfirm({ show: false, orderId: null, empId: null });

    const handleApprovePickupDate = (targetOrderId, pickupDate) => {
        if (!pickupDate) return;

        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) !== targetOrderId) return order;

                const idToUse = order._id || order.id;
                const patch = { pickupDate, status: 'Pending' };

                if (order.isBooking) {
                    bookingApi.updateBooking(idToUse, patch).catch(console.error);
                } else {
                    orderApi.updateOrder(idToUse, patch).catch(console.error);
                }

                return {
                    ...order,
                    status: 'Pending',
                    pickupDate,
                    estimatedCompletion: pickupDate,
                    invoice: { ...(order.invoice || {}), dueDate: pickupDate },
                };
            })
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="font-inter min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-gray-400 text-sm font-medium">Loading order...</div>
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

    if (!activeOrder) {
        return (
            <div className="font-inter min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500 font-medium">Order not found: <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{orderId}</code></p>
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                >
                    <ArrowLeft size={16} /> Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="font-inter min-h-screen bg-slate-50 flex flex-col p-3 lg:p-6 pb-20">
            {/* ── Page-level back navigation ─────────────────────────────── */}
            <div className="mb-4">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 bg-transparent border-none cursor-pointer transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Orders
                </button>
            </div>

            {/* ── Full-page detail panel ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <OrderDetail
                    activeOrder={activeOrder}
                    activeOrderSteps={activeOrderSteps}
                    currentStepIdx={currentStepIdx}
                    assignedEmployee={assignedEmployee}
                    earningsPreview={earningsPreview}
                    assignments={assignments}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    /*
                     * setActiveOrderId is replaced by navigate('/orders').
                     * OrderDetail calls setActiveOrderId(null) when the user hits the
                     * back arrow inside the header. We map that to navigate('/orders').
                     */
                    setActiveOrderId={() => navigate('/orders')}
                    handleStepClick={handleStepClick}
                    handleAssign={handleAssign}
                    handleApprovePickupDate={handleApprovePickupDate}
                />
            </div>

            <AssignConfirmationModal
                assignConfirm={assignConfirm}
                onConfirm={confirmAssign}
                onCancel={cancelAssign}
            />
        </div>
    );
}