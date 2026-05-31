import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { orderApi } from '../../services/orderApi.js';
import { bookingApi } from '../../services/bookingApi.js';
import { staffApi } from '../../services/staffApi.js';
import { mapStaffToEmployee } from '../../utils/mapStaffToEmployee.js';
import { EMPLOYEE_POOL, SERVICE_STEPS } from './AdOrder/Constants.js';
import OrderDetail from './AdOrder/Orderdetail';
import DropOffStartConfirmationModal from './AdOrder/DropOffStartConfirmationModal.jsx';
import ProductionAssignmentModal from './AdOrder/ProductionAssignmentModal.jsx';
import { getActiveStepIndex, getDerivedStatus } from '../../utils/helpers.js';
import { computeOrderEarnings, convertBooking } from './AdOrder.jsx';
import useOrderFeedSocket from '../../hooks/useOrderFeedSocket.js';
import { SkeletonBlock } from '../../components/SkeletonLoaders.jsx';

const FALLBACK_REFRESH_MS = 60000;
const EMPTY_ASSIGNMENTS = {
    tailor: '',
    presser: '',
    layoutArtist: '',
};

const normalizeStepLabel = (label = '') =>
    String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ');

const isDropOffStep = (label = '') => ['dropped off', 'drop off'].includes(normalizeStepLabel(label));

const getAdminActorName = () => {
    try {
        const rawUser = localStorage.getItem('adminUser');
        if (!rawUser) return 'Admin';

        const parsedUser = JSON.parse(rawUser);
        return parsedUser?.fullName || parsedUser?.name || parsedUser?.email || 'Admin';
    } catch {
        return 'Admin';
    }
};

const toFallbackEmployee = (employee = {}, index = 0) => ({
    _id: employee._id || employee.id || `fallback-${index}`,
    id: employee.id || `EMP-${String(index + 1).padStart(3, '0')}`,
    fullName: employee.fullName || employee.name || 'Unnamed Staff',
    name: employee.name || employee.fullName || 'Unnamed Staff',
    position: employee.position || employee.role || 'Tailor',
    role: employee.role || employee.position || 'Employee',
    dept: employee.dept || 'Production',
});

const getFallbackStaffPool = () => EMPLOYEE_POOL.map((employee, index) => toFallbackEmployee(employee, index));

const getOrderSteps = (order = {}) => {
    if (Array.isArray(order?.steps) && order.steps.length > 0) {
        return order.steps;
    }

    const fallbackSteps = SERVICE_STEPS[order?.serviceType] || SERVICE_STEPS['Team Jersey'] || [];
    return fallbackSteps.map((label) => ({ label, done: false, active: false }));
};

const getVisibleProductionRoles = (order = {}) => {
    const stepLabels = getOrderSteps(order).map((step) => normalizeStepLabel(step?.label || step));
    const roles = [];

    if (stepLabels.includes('layout') || stepLabels.includes('printing')) roles.push('layoutArtist');
    if (stepLabels.includes('pressing')) roles.push('presser');
    if (stepLabels.includes('sewing') || roles.length === 0) roles.push('tailor');

    return roles;
};

const getNormalizedAssignments = (orderOrAssignments = {}) => ({
    tailor: String(orderOrAssignments?.tailor ?? orderOrAssignments?.staffAssignments?.tailor ?? orderOrAssignments?.assignedTailor ?? '').trim(),
    presser: String(orderOrAssignments?.presser ?? orderOrAssignments?.staffAssignments?.presser ?? '').trim(),
    layoutArtist: String(orderOrAssignments?.layoutArtist ?? orderOrAssignments?.staffAssignments?.layoutArtist ?? '').trim(),
});

const hasPickupSchedule = (order = {}) =>
    Boolean(order?.pickupDate || order?.invoice?.dueDate || order?.estimatedCompletion);

const hasAnyAssignedProductionRole = (order = {}) => {
    const requiredRoles = getVisibleProductionRoles(order);
    const assignments = getNormalizedAssignments(order);
    return requiredRoles.some((roleKey) => Boolean(String(assignments?.[roleKey] || '').trim()));
};

const isProductionAssignmentLocked = (order = {}) => {
    const derivedStatus = getDerivedStatus(order);
    return derivedStatus === 'Completed' || derivedStatus === 'Released';
};

const updateTailorAssignmentCache = (targetOrderId, tailorName) => {
    try {
        const rawAssignments = localStorage.getItem('assignments');
        const parsedAssignments = rawAssignments ? JSON.parse(rawAssignments) : {};
        const nextAssignments = { ...parsedAssignments, [targetOrderId]: tailorName };
        localStorage.setItem('assignments', JSON.stringify(nextAssignments));
    } catch {
        // Ignore local cache errors. Backend persistence is the source of truth.
    }
};

export default function OrderDetailPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [assignmentDraft, setAssignmentDraft] = useState(EMPTY_ASSIGNMENTS);
    const [assignmentSaving, setAssignmentSaving] = useState(false);
    const [dropOffConfirm, setDropOffConfirm] = useState({
        open: false,
        orderId: null,
        stepIndex: null,
    });
    const [assignmentModal, setAssignmentModal] = useState({
        open: false,
        mode: 'manage',
        orderId: null,
        stepIndex: null,
    });
    const [pickupScheduleRequest, setPickupScheduleRequest] = useState(null);

    const [orderTracking, setOrderTracking] = useState(() => {
        try {
            const savedTracking = localStorage.getItem('orderTracking');
            return savedTracking ? JSON.parse(savedTracking) : {};
        } catch {
            return {};
        }
    });

    const fetchAll = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
                setError(null);
            }

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

            const activeItems = allItems.filter((item) => !item?.isArchived);
            activeItems.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
            setOrders(activeItems);
        } catch (fetchError) {
            console.error('Failed to fetch orders:', fetchError);
            if (!silent) {
                setError('Failed to load order details.');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    const fetchStaffList = useCallback(async () => {
        try {
            const response = await staffApi.getAllStaff();
            const rawStaff = Array.isArray(response?.staff)
                ? response.staff
                : Array.isArray(response?.data)
                    ? response.data
                    : [];

            if (rawStaff.length === 0) {
                setStaffList(getFallbackStaffPool());
                return;
            }

            setStaffList(rawStaff.map((staff, index) => mapStaffToEmployee(staff, index)));
        } catch (staffError) {
            console.warn('Failed to fetch staff list. Using fallback employee pool.', staffError);
            setStaffList(getFallbackStaffPool());
        }
    }, []);

    useEffect(() => {
        fetchAll(false);
        fetchStaffList();

        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            fetchAll(true);
        }, FALLBACK_REFRESH_MS);

        return () => window.clearInterval(intervalId);
    }, [fetchAll, fetchStaffList]);

    useOrderFeedSocket(() => {
        fetchAll(true);
    });

    const activeOrder = useMemo(
        () => orders.find((order) => (order.id || order._id) === orderId) ?? null,
        [orders, orderId]
    );

    const activeOrderSteps = useMemo(() => getOrderSteps(activeOrder), [activeOrder]);

    const currentStepIdx = useMemo(
        () => getActiveStepIndex(activeOrder, orderTracking),
        [activeOrder, orderTracking]
    );

    const activeStaffAssignments = useMemo(
        () => getNormalizedAssignments(activeOrder || EMPTY_ASSIGNMENTS),
        [activeOrder]
    );

    const earningsPreview = useMemo(() => {
        if (!activeOrder) return null;
        const assignedTailor = activeStaffAssignments.tailor || activeOrder?.assignedTailor || '';
        return computeOrderEarnings(activeOrder, assignedTailor);
    }, [activeOrder, activeStaffAssignments]);

    const targetModalOrder = useMemo(
        () => orders.find((order) => (order.id || order._id) === assignmentModal.orderId) ?? null,
        [assignmentModal.orderId, orders]
    );

    const pendingDropOffOrder = useMemo(
        () => orders.find((order) => (order.id || order._id) === dropOffConfirm.orderId) ?? null,
        [dropOffConfirm.orderId, orders]
    );

    const visibleModalRoles = useMemo(
        () => getVisibleProductionRoles(targetModalOrder || pendingDropOffOrder || activeOrder || {}),
        [activeOrder, pendingDropOffOrder, targetModalOrder]
    );

    const updateTrackingCache = useCallback((targetOrderId, updatedSteps, stepIndex) => {
        const nextIndex = (() => {
            let candidate = stepIndex + 1;
            while (candidate < updatedSteps.length && updatedSteps[candidate]?.done) {
                candidate += 1;
            }

            if (candidate >= updatedSteps.length) {
                return Math.max(updatedSteps.length - 1, 0);
            }

            return candidate;
        })();

        setOrderTracking((previousTracking) => {
            const nextTracking = { ...previousTracking, [targetOrderId]: nextIndex };
            localStorage.setItem('orderTracking', JSON.stringify(nextTracking));
            return nextTracking;
        });
    }, []);

    const buildWorkflowProgress = useCallback((order, stepIndex) => {
        const sourceSteps = getOrderSteps(order);
        const actorName = getAdminActorName();
        const now = new Date();
        const completionDate = now.toISOString().split('T')[0];
        const completionTime = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        let nextStepIndex = stepIndex + 1;
        while (nextStepIndex < sourceSteps.length && sourceSteps[nextStepIndex]?.done) {
            nextStepIndex += 1;
        }

        const updatedSteps = sourceSteps.map((step, index) => {
            const baseStep = typeof step === 'string' ? { label: step } : { ...step };

            if (index < stepIndex) {
                return { ...baseStep, active: false };
            }

            if (index === stepIndex) {
                return {
                    ...baseStep,
                    done: true,
                    active: false,
                    date: completionDate,
                    time: completionTime,
                    worker: actorName,
                };
            }

            if (index === nextStepIndex && nextStepIndex < sourceSteps.length) {
                return { ...baseStep, active: true };
            }

            return { ...baseStep, active: false };
        });

        return {
            updatedSteps,
            isLastStep: nextStepIndex >= sourceSteps.length,
        };
    }, []);

    const closeAssignmentModal = useCallback(() => {
        if (assignmentSaving) return;

        setAssignmentModal({
            open: false,
            mode: 'manage',
            orderId: null,
            stepIndex: null,
        });
        setAssignmentDraft(EMPTY_ASSIGNMENTS);
    }, [assignmentSaving]);

    const validateAssignments = useCallback((order, draft) => {
        const requiredRoles = getVisibleProductionRoles(order);
        const missingRoles = requiredRoles.filter((roleKey) => !String(draft?.[roleKey] || '').trim());

        if (missingRoles.length === 0) return true;

        const roleLabels = {
            layoutArtist: 'Layout Artist',
            presser: 'Presser',
            tailor: 'Tailor',
        };

        toast.error(`Please assign ${missingRoles.map((roleKey) => roleLabels[roleKey]).join(', ')} before continuing.`);
        return false;
    }, []);

    const persistAssignmentsOnly = useCallback(async (order, nextAssignments) => {
        const normalizedAssignments = getNormalizedAssignments(nextAssignments);
        const assignedTailor = normalizedAssignments.tailor || '';
        const entityId = order._id || order.id;
        const patch = {
            assignedTailor,
            staffAssignments: normalizedAssignments,
        };

        if (order.isBooking) {
            await bookingApi.updateBooking(entityId, patch);
        } else {
            await orderApi.updateOrder(entityId, patch);
        }

        updateTailorAssignmentCache(order.id || order._id, assignedTailor);
        await fetchAll(true);
        toast.success('Production team assignments updated.');
    }, [fetchAll]);

    const persistStepProgress = useCallback(async (order, stepIndex, nextAssignments = null) => {
        const { updatedSteps, isLastStep } = buildWorkflowProgress(order, stepIndex);
        const entityId = order._id || order.id;
        const patch = {
            steps: updatedSteps,
            ...(stepIndex === 0 ? { status: 'In Progress' } : {}),
            ...(isLastStep ? { status: 'Completed' } : {}),
        };

        if (nextAssignments) {
            const normalizedAssignments = getNormalizedAssignments(nextAssignments);
            patch.assignedTailor = normalizedAssignments.tailor || '';
            patch.staffAssignments = normalizedAssignments;
        }

        if (order.isBooking) {
            await bookingApi.updateBooking(entityId, patch);
        } else {
            await orderApi.updateOrder(entityId, patch);
        }

        updateTrackingCache(order.id || order._id, updatedSteps, stepIndex);

        if (nextAssignments) {
            updateTailorAssignmentCache(order.id || order._id, patch.assignedTailor || '');
        }

        await fetchAll(true);
        toast.success(
            nextAssignments
                ? 'Order marked as dropped off. Work progress started and production team assigned.'
                : 'Production progress updated.'
        );
    }, [buildWorkflowProgress, fetchAll, updateTrackingCache]);

    const handleStepClick = useCallback((targetOrderId, stepIndex) => {
        const targetOrder = orders.find((order) => (order.id || order._id) === targetOrderId);
        if (!targetOrder) return;

        const step = getOrderSteps(targetOrder)[stepIndex];
        const stepLabel = step?.label || step;
        const normalizedTargetOrderId = targetOrder.id || targetOrder._id;

        if (isDropOffStep(stepLabel)) {
            setDropOffConfirm({
                open: true,
                orderId: targetOrderId,
                stepIndex,
            });
            return;
        }

        if (!hasPickupSchedule(targetOrder)) {
            setPickupScheduleRequest({
                orderId: normalizedTargetOrderId,
                mode: 'approve',
                requestedAt: Date.now(),
            });
            toast.error('Set the pickup date and time before continuing production.');
            return;
        }

        persistStepProgress(targetOrder, stepIndex).catch((progressError) => {
            console.error('Failed to update production progress:', progressError);
            toast.error(progressError?.response?.data?.message || 'Failed to update production progress.');
        });
    }, [orders, persistStepProgress]);

    const handleManageAssignments = useCallback((targetOrderId) => {
        const targetOrder = orders.find((order) => (order.id || order._id) === targetOrderId);
        if (!targetOrder) return;
        if (isProductionAssignmentLocked(targetOrder)) {
            toast.error('Production team can no longer be managed once an order is completed or released.');
            return;
        }
        if (!hasAnyAssignedProductionRole(targetOrder)) {
            toast.error('Assign the production team from the drop-off workflow step first.');
            return;
        }

        setAssignmentDraft(getNormalizedAssignments(targetOrder));
        setAssignmentModal({
            open: true,
            mode: 'manage',
            orderId: targetOrderId,
            stepIndex: null,
        });
    }, [orders]);

    const handleDropOffConfirmed = useCallback(() => {
        if (!pendingDropOffOrder) return;

        setAssignmentDraft(getNormalizedAssignments(pendingDropOffOrder));
        setDropOffConfirm({
            open: false,
            orderId: null,
            stepIndex: null,
        });
        setAssignmentModal({
            open: true,
            mode: 'start',
            orderId: pendingDropOffOrder.id || pendingDropOffOrder._id,
            stepIndex: dropOffConfirm.stepIndex,
        });
    }, [dropOffConfirm.stepIndex, pendingDropOffOrder]);

    const handleAssignmentDraftChange = useCallback((roleKey, value) => {
        setAssignmentDraft((previousDraft) => ({
            ...previousDraft,
            [roleKey]: value,
        }));
    }, []);

    const handleAssignmentModalConfirm = useCallback(async () => {
        if (!targetModalOrder) return;
        if (isProductionAssignmentLocked(targetModalOrder)) {
            toast.error('Production team can no longer be managed once an order is completed or released.');
            closeAssignmentModal();
            return;
        }
        if (!validateAssignments(targetModalOrder, assignmentDraft)) return;

        try {
            setAssignmentSaving(true);
            const shouldPromptPickupSchedule =
                assignmentModal.mode === 'start' && !hasPickupSchedule(targetModalOrder);

            if (assignmentModal.mode === 'start') {
                await persistStepProgress(targetModalOrder, assignmentModal.stepIndex, assignmentDraft);
            } else {
                await persistAssignmentsOnly(targetModalOrder, assignmentDraft);
            }

            closeAssignmentModal();

            if (shouldPromptPickupSchedule) {
                setPickupScheduleRequest({
                    orderId: targetModalOrder.id || targetModalOrder._id,
                    mode: 'approve',
                    requestedAt: Date.now(),
                });
            }
        } catch (saveError) {
            console.error('Failed to save assignment flow:', saveError);
            toast.error(saveError?.response?.data?.message || 'Failed to save production assignments.');
        } finally {
            setAssignmentSaving(false);
        }
    }, [
        assignmentDraft,
        assignmentModal.mode,
        assignmentModal.stepIndex,
        closeAssignmentModal,
        persistAssignmentsOnly,
        persistStepProgress,
        targetModalOrder,
        validateAssignments,
    ]);

    const handleApprovePickupDate = async (targetOrderId, pickupDate, pickupSlot) => {
        if (!pickupDate) return false;

        const targetOrder = orders.find((order) => (order.id || order._id) === targetOrderId);
        if (!targetOrder) return false;

        const entityId = targetOrder._id || targetOrder.id;
        const linkedBookingId =
            targetOrder?.bookingId?._id ||
            targetOrder?.bookingId?.id ||
            targetOrder?.bookingId ||
            null;

        try {
            if (targetOrder.isBooking) {
                await bookingApi.updateBooking(entityId, {
                    pickupDate,
                    status: 'Pending',
                    ...(pickupSlot ? { pickupSlot } : {}),
                });
            } else {
                const updates = [
                    orderApi.updateOrder(entityId, {
                        pickupDate,
                        ...(pickupSlot ? { pickupSlot } : {}),
                        estimatedCompletion: pickupDate,
                        status: 'Pending',
                    }),
                ];

                if (linkedBookingId) {
                    updates.push(
                        bookingApi.updateBooking(linkedBookingId, {
                            pickupDate,
                            status: 'Pending',
                            ...(pickupSlot ? { pickupSlot } : {}),
                        })
                    );
                }

                await Promise.all(updates);
            }

            await fetchAll(true);
            toast.success('Pickup schedule updated successfully.');
            return true;
        } catch (scheduleError) {
            console.error('Failed to update pickup schedule:', scheduleError);
            toast.error(scheduleError?.response?.data?.message || 'Failed to update schedule. Please try again.');
            return false;
        }
    };

    if (loading) {
        return (
            <div className="font-inter min-h-screen bg-slate-50 p-3 lg:p-6">
                <SkeletonBlock className="mb-4 h-5 w-36" />
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="space-y-3">
                            <SkeletonBlock className="h-4 w-44" />
                            <SkeletonBlock className="h-7 w-72" />
                            <SkeletonBlock className="h-3 w-56 bg-slate-100" />
                        </div>
                        <SkeletonBlock className="h-24 w-44 bg-slate-100" />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map((item) => (
                                <SkeletonBlock key={item} className="h-20 w-full bg-slate-100" />
                            ))}
                        </div>
                        <div className="space-y-3">
                            {[0, 1, 2].map((item) => (
                                <SkeletonBlock key={item} className="h-24 w-full bg-slate-100" />
                            ))}
                        </div>
                    </div>
                </div>
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
                <p className="text-gray-500 font-medium">
                    Order not found: <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{orderId}</code>
                </p>
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                >
                    <ArrowLeft size={16} /> Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="font-inter min-h-screen bg-slate-50 flex flex-col p-3 lg:p-6 pb-20">
            <div className="mb-4">
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 bg-transparent border-none cursor-pointer transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Orders
                </button>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <OrderDetail
                    activeOrder={activeOrder}
                    activeOrderSteps={activeOrderSteps}
                    currentStepIdx={currentStepIdx}
                    staffAssignments={activeStaffAssignments}
                    earningsPreview={earningsPreview}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    setActiveOrderId={() => navigate('/admin/orders')}
                    handleStepClick={handleStepClick}
                    handleManageAssignments={handleManageAssignments}
                    handleApprovePickupDate={handleApprovePickupDate}
                    pickupScheduleRequest={pickupScheduleRequest}
                    onPickupScheduleRequestHandled={() => setPickupScheduleRequest(null)}
                    onArchiveSuccess={() => navigate('/admin/archives')}
                />
            </div>

            <DropOffStartConfirmationModal
                isOpen={dropOffConfirm.open}
                order={pendingDropOffOrder}
                onClose={() => setDropOffConfirm({ open: false, orderId: null, stepIndex: null })}
                onConfirm={handleDropOffConfirmed}
            />

            <ProductionAssignmentModal
                isOpen={assignmentModal.open}
                mode={assignmentModal.mode}
                order={targetModalOrder}
                staffList={staffList}
                value={assignmentDraft}
                requiredRoles={visibleModalRoles}
                isSaving={assignmentSaving}
                onChange={handleAssignmentDraftChange}
                onClose={closeAssignmentModal}
                onConfirm={handleAssignmentModalConfirm}
            />
        </div>
    );
}
