import React, { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, AlertCircle, User, Phone, CalendarClock, XCircle, X, ExternalLink, Link as LinkIcon, Archive, FileText, ChevronLeft, ClipboardList, Eye, QrCode, Package } from 'lucide-react';
import { MdInfo } from 'react-icons/md';
import { toast } from 'sonner';
import WorkflowProgress from './Workflowprogress';
import ProductionTimeline from './Productiontimeline';
import TeamRoster from './Teamroster';
import AssignedTailorPanel from './Assignedtailorpanel';
import OrderSummary from './Ordersummary';
import RescheduleModal from './RescheduleModal';
import GDriveLogo from '../../../assets/gdrive.jpg';
import { getDerivedStatus } from '../../../utils/helpers.js';
import { orderApi } from '../../../services/orderApi.js';
import { bookingApi } from '../../../services/bookingApi.js';

export default function OrderDetail({
    activeOrder,
    activeOrderSteps,
    currentStepIdx,
    staffAssignments,
    earningsPreview,
    isMenuOpen,
    setIsMenuOpen,
    setActiveOrderId,
    handleStepClick,
    handleManageAssignments,
    handleApprovePickupDate,
    pickupScheduleRequest,
    onPickupScheduleRequestHandled,
    onArchiveSuccess,
}) {
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [approvalMode, setApprovalMode] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [bookingExtras, setBookingExtras] = useState(null);
    const [showZoomModal, setShowZoomModal] = useState(false);
    const [zoomImageIdx, setZoomImageIdx] = useState(0);

    const derivedStatus = useMemo(() => getDerivedStatus(activeOrder), [activeOrder]);
    const isForApproval = useMemo(() => derivedStatus === 'For Approval', [derivedStatus]);
    const isCancelled = useMemo(() => derivedStatus === 'Cancelled', [derivedStatus]);
    const isRescheduleLocked = useMemo(
        () => derivedStatus === 'Completed' || derivedStatus === 'Released',
        [derivedStatus]
    );
    const isAssignmentLocked = useMemo(
        () => derivedStatus === 'Completed' || derivedStatus === 'Released',
        [derivedStatus]
    );
    const canArchive = useMemo(
        () => !activeOrder?.isArchived && (derivedStatus === 'Released' || derivedStatus === 'Cancelled'),
        [activeOrder?.isArchived, derivedStatus]
    );

    useEffect(() => {
        let isMounted = true;

        const loadBookingExtras = async () => {
            const bookingId = activeOrder?.bookingId || activeOrder?.booking?._id || activeOrder?.booking?.id;
            if (!bookingId) {
                setBookingExtras(null);
                return;
            }

            try {
                const response = await bookingApi.getBookingById(bookingId);
                if (isMounted) {
                    setBookingExtras(response.booking || null);
                }
            } catch (error) {
                console.error('Failed to load booking extras:', error);
                if (isMounted) {
                    setBookingExtras(null);
                }
            }
        };

        loadBookingExtras();

        return () => {
            isMounted = false;
        };
    }, [activeOrder]);



    const hasSchedule = useMemo(() =>
        Boolean(
            bookingExtras?.pickupDate ||
            activeOrder?.pickupDate ||
            activeOrder?.invoice?.dueDate ||
            activeOrder?.estimatedCompletion
        ),
        [activeOrder, bookingExtras]
    );

    const scheduleCurrentDate = useMemo(
        () =>
            bookingExtras?.pickupDate ||
            activeOrder?.pickupDate ||
            activeOrder?.estimatedCompletion ||
            activeOrder?.invoice?.dueDate ||
            new Date().toISOString().split('T')[0],
        [activeOrder, bookingExtras]
    );

    const isRescheduleDisabled = useMemo(
        () => isRescheduleLocked || !hasSchedule,
        [hasSchedule, isRescheduleLocked]
    );

    const visibleOrderId = useMemo(() => {
        if (!activeOrder) return '';

        if (activeOrder.isBooking) {
            return activeOrder.displayId || bookingExtras?.bookingId || activeOrder.id || activeOrder._id || '';
        }

        return activeOrder.displayId || activeOrder.orderId || activeOrder.id || activeOrder._id || '';
    }, [activeOrder, bookingExtras]);

    const isOverCapacity = Boolean(activeOrder?.isOverCapacity || bookingExtras?.isOverCapacity);
    const capacitySnapshot = bookingExtras?.capacitySnapshot || activeOrder?.capacitySnapshot || null;
    const capacityLabel = capacitySnapshot
        ? `${capacitySnapshot.totalBookedBefore || capacitySnapshot.bookedBefore || 0}/${capacitySnapshot.totalMax || capacitySnapshot.max || 10}`
        : '';
    const overCapacityStatusText = String(activeOrder?.status || bookingExtras?.status || '').toLowerCase();
    const canDecideOverCapacity =
        Boolean(activeOrder?.isOverCapacity || bookingExtras?.isOverCapacity) &&
        (overCapacityStatusText.includes('for approval') || overCapacityStatusText.includes('pending'));

    const handleOverCapacityDecision = async (nextStatus) => {
        const bookingId = activeOrder?._id || activeOrder?.id || activeOrder?.orderId;
        if (!bookingId) return;

        try {
            const [{ bookingApi }, { toast }] = await Promise.all([
                import('../../../services/bookingApi'),
                import('sonner'),
            ]);

            await bookingApi.updateBooking(
                bookingId,
                nextStatus === 'Cancelled'
                    ? { status: 'Cancelled', cancellationReason: 'Declined by admin (over capacity)' }
                    : { status: 'Approved' }
            );

            toast.success(nextStatus === 'Cancelled' ? 'Booking declined.' : 'Booking approved.');
            window.location.reload();
        } catch (err) {
            console.error('Failed to update over-capacity booking:', err);
            const message = err?.response?.data?.message || 'Failed to update booking.';
            const { toast } = await import('sonner');
            toast.error(message);
        }
    };

    const imageUrls = useMemo(() => {
        const urls = [];
        const append = (value) => {
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (typeof item === 'string' && item) urls.push(item);
                });
            } else if (typeof value === 'string' && value) {
                urls.push(value);
            }
        };

        append(activeOrder?.photos);
        append(activeOrder?.designFile);
        append(activeOrder?.orgDesignFile);
        append(bookingExtras?.photos);
        append(bookingExtras?.designFile);
        append(bookingExtras?.orgDesignFile);

        return Array.from(new Set(urls));
    }, [activeOrder, bookingExtras]);

    const rosterPlayers = useMemo(() => {
        if (Array.isArray(bookingExtras?.players) && bookingExtras.players.length > 0) {
            return bookingExtras.players;
        }

        if (Array.isArray(activeOrder?.players) && activeOrder.players.length > 0) {
            return activeOrder.players;
        }

        if (Array.isArray(bookingExtras?.members) && bookingExtras.members.length > 0) {
            return bookingExtras.members;
        }

        if (Array.isArray(activeOrder?.members) && activeOrder.members.length > 0) {
            return activeOrder.members;
        }

        return [];
    }, [activeOrder, bookingExtras]);

    const rosterInvoiceItems = useMemo(() => {
        if (Array.isArray(activeOrder?.invoice?.items) && activeOrder.invoice.items.length > 0) {
            return activeOrder.invoice.items;
        }

        if (Array.isArray(bookingExtras?.items) && bookingExtras.items.length > 0) {
            return bookingExtras.items;
        }

        return [];
    }, [activeOrder, bookingExtras]);

    const handleRescheduleConfirm = (newDate, newTime) => {
        handleApprovePickupDate(activeOrder.id || activeOrder._id, newDate, newTime);
    };

    useEffect(() => {
        const requestOrderId = pickupScheduleRequest?.orderId;
        const activeEntityId = activeOrder?.id || activeOrder?._id;

        if (!pickupScheduleRequest?.requestedAt || !requestOrderId || !activeEntityId) {
            return;
        }

        if (String(requestOrderId) !== String(activeEntityId)) {
            return;
        }

        if (hasSchedule || isCancelled || isRescheduleLocked) {
            onPickupScheduleRequestHandled?.();
            return;
        }

        setApprovalMode(pickupScheduleRequest?.mode === 'approve');
        setShowRescheduleModal(true);
        onPickupScheduleRequestHandled?.();
    }, [
        activeOrder,
        hasSchedule,
        isCancelled,
        isRescheduleLocked,
        onPickupScheduleRequestHandled,
        pickupScheduleRequest,
    ]);

    const handleCancelOrder = () => {
        setCancelReason('');
        setShowCancelConfirm(true);
    };

    const closeCancelModal = () => {
        if (cancelLoading) return;
        setShowCancelConfirm(false);
        setCancelReason('');
    };

    const confirmCancelOrder = async () => {
        const orderId = activeOrder.id || activeOrder._id;
        const cancellationReason = cancelReason.trim();

        if (!cancellationReason) {
            toast.error('Please enter a cancellation reason.');
            return;
        }

        try {
            setCancelLoading(true);
            if (activeOrder.isBooking) {
                await bookingApi.cancelBooking(orderId, { cancellationReason });
            } else {
                await orderApi.cancelOrder(orderId, { cancellationReason });
            }
            setShowCancelConfirm(false);
            setCancelReason('');
            setIsMenuOpen(false);
            setActiveOrderId(null);
            toast.success('Order cancelled successfully.');
        } catch (error) {
            console.error('Failed to cancel order:', error);
            toast.error('Failed to cancel order. Please try again.');
        } finally {
            setCancelLoading(false);
        }
    };

    const confirmArchiveOrder = async () => {
        const entityId = activeOrder._id || activeOrder.id;

        try {
            setArchiveLoading(true);
            if (activeOrder.isBooking) {
                await bookingApi.archiveBooking(entityId);
            } else {
                await orderApi.archiveOrder(entityId);
            }
            setShowArchiveConfirm(false);
            setIsMenuOpen(false);
            toast.success('Order archived successfully.');
            if (typeof onArchiveSuccess === 'function') {
                onArchiveSuccess();
            } else {
                setActiveOrderId(null);
            }
        } catch (error) {
            console.error('Failed to archive order:', error);
            toast.error('Failed to archive order. Please try again.');
            setShowArchiveConfirm(false);
        } finally {
            setArchiveLoading(false);
        }
    };

    if (!activeOrder) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ClipboardList size={64} className="mb-4 text-gray-200" />
                <p className="font-medium text-sm text-gray-400">Select an order to view production details</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 lg:px-6 lg:py-4 border-b border-gray-50 shrink-0">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setActiveOrderId(null)}
                            className="lg:hidden p-1.5 -ml-2 mr-1 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-lg border-none cursor-pointer"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-[11px] lg:text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg tracking-wider">{visibleOrderId}</span>
                        {activeOrder.isBooking && (
                            <span className="text-[11px] lg:text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg tracking-wider">BOOKING</span>
                        )}
                        {isOverCapacity && (
                            <span
                                className="text-[11px] lg:text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg tracking-wider"
                                title={capacityLabel ? `Capacity: ${capacityLabel} full` : 'Over recommended capacity'}
                            >
                                OVER CAPACITY
                            </span>
                        )}
                        {activeOrder.priority === 'Rush' && (
                            <span className="flex items-center gap-1 text-[11px] lg:text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg tracking-wider">
                                <AlertCircle size={14} /> RUSH
                            </span>
                        )}
                        {derivedStatus === 'Overdue' && (
                            <span className="text-[11px] lg:text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg tracking-wider">OVERDUE</span>
                        )}
                        {isForApproval && (
                            <span className="text-[11px] lg:text-xs font-bold text-violet-700 bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg tracking-wider">FOR APPROVAL</span>
                        )}
                    </div>
                    <div className="relative">

                        {isMenuOpen && (
                            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 z-20">
                                <button
                                    onClick={() => {
                                        if (isRescheduleDisabled) return;
                                        setApprovalMode(false);
                                        setShowRescheduleModal(true);
                                        setIsMenuOpen(false);
                                    }}
                                    disabled={isRescheduleDisabled}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:bg-transparent disabled:cursor-not-allowed flex items-center gap-3 transition-colors border-b border-gray-50 bg-transparent border-none cursor-pointer"
                                >
                                    <CalendarClock size={16} className="text-gray-400" /> Reschedule
                                </button>
                                <button
                                    onClick={() => {
                                        setCancelReason('');
                                        setShowCancelConfirm(true);
                                        setIsMenuOpen(false);
                                    }}
                                    disabled={activeOrder.status === 'Cancelled'}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-colors mt-1 bg-transparent border-none cursor-pointer"
                                >
                                    <XCircle size={16} className="text-red-500" /> Cancel Order
                                </button>
                                {canArchive && (
                                    <button
                                        onClick={() => {
                                            setShowArchiveConfirm(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-3 transition-colors mt-1 bg-transparent border-none cursor-pointer"
                                    >
                                        <Archive size={16} className="text-amber-500" /> Archive Order
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <h1 className="text-lg lg:text-xl font-black text-gray-900 tracking-tight flex items-baseline gap-2">
                    <span className="text-gray-400 font-bold capitalize">{activeOrder.serviceType}</span>
                    <span className="text-gray-300">-</span>
                    {activeOrder.item}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-2 opacity-90">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <User size={16} className="text-gray-400" />{activeOrder.invoice?.billTo?.name || activeOrder.customer}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Phone size={16} className="text-gray-400" />{activeOrder.invoice?.billTo?.phone || activeOrder.phone || activeOrder.contact?.phone || 'N/A'}
                    </div>
                </div>
            </div>

            {/* Client Notes Section */}
            {activeOrder?.notes && (
                <div className="mx-4 lg:mx-6 mb-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-xl shrink-0">
                        <FileText size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black tracking-wider uppercase text-amber-600 mb-1">Client Notes</h4>
                        <p className="text-sm font-semibold text-amber-900 leading-relaxed italic">
                            "{activeOrder.notes}"
                        </p>
                    </div>
                </div>
            )}

            {isOverCapacity && (
                <div className="mx-4 lg:mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-xl shrink-0">
                        <AlertCircle size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black tracking-wider uppercase text-amber-700 mb-1">
                            {capacityLabel ? `Capacity: ${capacityLabel} Full` : 'Over Recommended Capacity'}
                            {canDecideOverCapacity && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOverCapacityDecision('Cancelled')}
                                        className="h-9 rounded-lg border border-amber-300 bg-white px-4 text-[11px] font-black uppercase tracking-wide text-amber-700 transition-colors hover:bg-amber-100"
                                    >
                                        Decline
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOverCapacityDecision('Approved')}
                                        className="h-9 rounded-lg border border-emerald-500 bg-emerald-600 px-4 text-[11px] font-black uppercase tracking-wide text-white transition-colors hover:bg-emerald-700"
                                    >
                                        Approve
                                    </button>
                                </div>
                            )}
                        </h4>
                        <p className="text-sm font-semibold text-amber-900 leading-relaxed">
                            Customer request was still accepted as pending. Approve if the shop can handle it, reject if not, or reschedule the pickup date.
                        </p>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-5 custom-scrollbar relative" onClick={() => setIsMenuOpen(false)}>
                <div className="min-w-0 space-y-5">
                    {/* Top Row: Workflow & Quick Actions */}
                    <div className="grid min-w-0 grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 mb-5">
                        <div className="min-w-0 lg:col-span-8">
                            <WorkflowProgress
                                activeOrderSteps={activeOrderSteps}
                                currentStepIdx={currentStepIdx}
                                onStepClick={handleStepClick}
                                orderId={activeOrder.id}
                                isForApproval={isForApproval}
                                hasSchedule={hasSchedule}
                            />
                        </div>
                        <div className="min-w-0 lg:col-span-4">
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm h-full flex flex-col">
                                <h4 className="text-[11px] font-black tracking-wider uppercase mb-3 text-gray-400">Quick Actions</h4>
                                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 h-full">
                                    <button
                                        onClick={() => {
                                            if (isRescheduleDisabled) return;
                                            setApprovalMode(false);
                                            setShowRescheduleModal(true);
                                            setIsMenuOpen(false);
                                        }}
                                        disabled={isRescheduleDisabled}
                                        className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed text-gray-700 font-bold py-2 px-3 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2 border"
                                    >
                                        <CalendarClock size={16} /> Reschedule
                                    </button>
                                    {activeOrder.status !== 'Cancelled' && (
                                        <button
                                            onClick={() => {
                                                setShowCancelConfirm(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold py-2 px-3 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2 border"
                                        >
                                            <XCircle size={16} /> Cancel
                                        </button>
                                    )}
                                    {canArchive && (
                                        <button
                                            onClick={() => {
                                                setShowArchiveConfirm(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold py-2 px-3 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Archive size={16} /> Archive
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                        <div className="min-w-0 md:col-span-2 flex flex-col gap-5">
                            <AssignedTailorPanel
                                activeOrder={activeOrder}
                                staffAssignments={staffAssignments}
                                earningsPreview={earningsPreview}
                                onManageAssignments={handleManageAssignments}
                                isCancelled={isCancelled}
                                isAssignmentLocked={isAssignmentLocked}
                            />
                            <ProductionTimeline
                                activeOrderSteps={activeOrderSteps}
                                currentStepIdx={currentStepIdx}
                                onStepClick={handleStepClick}
                                orderId={activeOrder.id}
                                isForApproval={isForApproval}
                                hasSchedule={hasSchedule}
                            />
                        </div>
                        <div className="min-w-0 md:col-span-1 flex flex-col gap-4 lg:gap-5">
                            {(imageUrls.length > 0 || activeOrder.driveLink || bookingExtras?.driveLink || activeOrder.orgDriveLink || bookingExtras?.orgDriveLink) && (
                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                        {/* Left Side: Images */}
                                        <div className="p-4 flex flex-col">
                                            <h4 className="text-[11px] font-black tracking-wider uppercase mb-3 text-gray-400">Uploaded Images</h4>
                                            {imageUrls.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                                                    {imageUrls.map((src, index) => (
                                                        <button
                                                            key={`${src}-${index}`}
                                                            onClick={() => { setZoomImageIdx(index); setShowZoomModal(true); }}
                                                            className="block w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm hover:ring-2 hover:ring-blue-100 transition-all cursor-pointer p-0 relative group"
                                                        >
                                                            <img
                                                                src={src}
                                                                alt={`Uploaded image ${index + 1}`}
                                                                className="w-full h-38 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                                                                <div className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md transition-opacity">
                                                                    <Eye size={12} /> View Fullscreen
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-xl py-8">
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No images</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex flex-col">
                                            <h4 className="text-[11px] font-black tracking-wider uppercase mb-3 text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded-lg inline-flex items-center self-start gap-1.5">
                                                <ExternalLink size={12} /> Design References
                                            </h4>
                                            {(activeOrder.driveLink || bookingExtras?.driveLink || activeOrder.orgDriveLink || bookingExtras?.orgDriveLink) ? (
                                                <a
                                                    href={activeOrder.driveLink || bookingExtras?.driveLink || activeOrder.orgDriveLink || bookingExtras?.orgDriveLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 flex flex-col items-center justify-center p-4 text-center hover:bg-indigo-50/30 transition-all rounded-xl group border border-gray-50 hover:border-indigo-100"
                                                >
                                                    <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all border border-gray-50 overflow-hidden">
                                                        <img src={GDriveLogo} alt="Google Drive" className="w-12 h-12 object-contain" />
                                                    </div>
                                                    <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full group-hover:bg-indigo-100 transition-colors">
                                                        Open Link →
                                                    </span>
                                                </a>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-xl py-8">
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No link set</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <OrderSummary
                                activeOrder={activeOrder}
                                earningsPreview={earningsPreview}
                                participants={rosterPlayers}
                                bookingExtras={bookingExtras}
                                serviceType={activeOrder?.serviceType}
                            />
                        </div>
                    </div>
                    {/* Team Roster Section moved to bottom of unified details view */}
                    <div className="mt-5 w-full max-w-full min-w-0">
                        <TeamRoster
                            players={rosterPlayers}
                            invoiceItems={rosterInvoiceItems}
                            teamName={bookingExtras?.teamName || bookingExtras?.orgName || activeOrder?.item || 'N/A'}
                            customerContact={activeOrder?.invoice?.billTo?.phone || activeOrder?.phone || activeOrder?.contact?.phone || 'N/A'}
                            serviceType={activeOrder?.serviceType}
                        />
                    </div>
                </div>
            </div>

            <RescheduleModal
                isOpen={showRescheduleModal && !isRescheduleLocked}
                onClose={() => { setShowRescheduleModal(false); setApprovalMode(false); }}
                onConfirm={(date, time) => { handleRescheduleConfirm(date, time); setApprovalMode(false); }}
                mode={approvalMode ? 'approve' : 'reschedule'}
                currentDate={scheduleCurrentDate}
                isRepairSchedule={
                    String(bookingExtras?.bookingType || activeOrder?.bookingType || activeOrder?.serviceType || '')
                        .trim()
                        .toLowerCase() === 'repair'
                }
            />

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Cancel Order</h2>
                                <p className="text-sm text-gray-500 mt-1">Are you sure you want to cancel this order? This action cannot be undone.</p>
                            </div>
                            <button
                                onClick={closeCancelModal}
                                disabled={cancelLoading}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-transparent border-none cursor-pointer ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-red-700">Order ID: <span className="font-bold">{visibleOrderId}</span></p>
                                <p className="text-xs font-semibold text-red-700 mt-1">Customer: <span className="font-bold">{activeOrder.customer}</span></p>
                            </div>
                            <label className="block">
                                <span className="text-xs font-bold text-gray-700">Reason for cancellation</span>
                                <textarea
                                    value={cancelReason}
                                    onChange={(event) => setCancelReason(event.target.value)}
                                    disabled={cancelLoading}
                                    maxLength={1000}
                                    rows={4}
                                    placeholder="Tell the customer why this order needs to be cancelled..."
                                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-red-300 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60"
                                />
                            </label>
                        </div>

                        <div className="p-6 flex gap-3 border-t border-gray-100">
                            <button
                                onClick={closeCancelModal}
                                disabled={cancelLoading}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                disabled={cancelLoading || !cancelReason.trim()}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Confirmation Modal */}
            {showArchiveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Archive Order</h2>
                                <p className="text-sm text-gray-500 mt-1">Move this released or cancelled record to archives? It will be removed from active admin lists.</p>
                            </div>
                            <button
                                onClick={() => setShowArchiveConfirm(false)}
                                disabled={archiveLoading}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-transparent border-none cursor-pointer ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-amber-700">Order ID: <span className="font-bold">{visibleOrderId}</span></p>
                                <p className="text-xs font-semibold text-amber-700 mt-1">Customer: <span className="font-bold">{activeOrder.invoice?.billTo?.name || activeOrder.customer || activeOrder.customerName || 'N/A'}</span></p>
                            </div>
                        </div>

                        <div className="p-6 flex gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setShowArchiveConfirm(false)}
                                disabled={archiveLoading}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                Keep Active
                            </button>
                            <button
                                onClick={confirmArchiveOrder}
                                disabled={archiveLoading}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                {archiveLoading ? 'Archiving...' : 'Archive Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Zoom Modal */}
            {showZoomModal && imageUrls.length > 0 && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in"
                    onClick={() => setShowZoomModal(false)}
                >
                    <button
                        className="absolute top-6 right-6 lg:top-8 lg:right-8 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 z-50 text-xl cursor-pointer ring-1 ring-white/20 border-none"
                        onClick={() => setShowZoomModal(false)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={imageUrls[zoomImageIdx]}
                        alt="Zoomed Upload"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 cursor-auto"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {imageUrls.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                            {imageUrls.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setZoomImageIdx(i); }}
                                    className={`w-2 h-2 rounded-full transition-all border-none ${i === zoomImageIdx ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/80'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
