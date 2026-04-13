import React, { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, AlertCircle, User, Phone, Edit, CalendarClock, XCircle, X, ExternalLink, Link as LinkIcon } from 'lucide-react';
import WorkflowProgress from './Workflowprogress';
import ProductionTimeline from './Productiontimeline';
import TeamRoster from './Teamroster';
import AssignedTailorPanel from './Assignedtailorpanel';
import OrderSummary from './Ordersummary';
import RescheduleModal from './RescheduleModal';
import { getDerivedStatus } from '../../../utils/helpers.js';
import { orderApi } from '../../../services/orderApi.js';
import { bookingApi } from '../../../services/bookingApi.js';

export default function OrderDetail({
    activeOrder,
    activeOrderSteps,
    currentStepIdx,
    assignedEmployee,
    earningsPreview,
    assignments,
    isMenuOpen,
    setIsMenuOpen,
    setActiveOrderId,
    handleStepClick,
    handleAssign,
    handleApprovePickupDate,
}) {
    const [pickupApprovalDate, setPickupApprovalDate] = useState('');
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [approvalMode, setApprovalMode] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [bookingExtras, setBookingExtras] = useState(null);

    const isForApproval = useMemo(() => getDerivedStatus(activeOrder) === 'For Approval', [activeOrder]);
    const isCancelled = useMemo(() => getDerivedStatus(activeOrder) === 'Cancelled', [activeOrder]);
    const canApprovePickup = isForApproval && (activeOrder?.serviceType === 'Team Jersey' || activeOrder?.serviceType === 'Organization');

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
        Boolean(activeOrder?.pickupDate || activeOrder?.invoice?.dueDate || activeOrder?.estimatedCompletion),
        [activeOrder]
    );

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

    const handleRescheduleConfirm = (newDate, newTime) => {
        handleApprovePickupDate(activeOrder.id || activeOrder._id, newDate);
    };

    const handleCancelOrder = () => {
        setShowCancelConfirm(true);
    };

    const confirmCancelOrder = async () => {
        const orderId = activeOrder.id || activeOrder._id;

        try {
            setCancelLoading(true);
            if (activeOrder.isBooking) {
                await bookingApi.cancelBooking(orderId);
            } else {
                await orderApi.cancelOrder(orderId);
            }
            setShowCancelConfirm(false);
            setIsMenuOpen(false);
            setActiveOrderId(null);
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert('Failed to cancel order. Please try again.');
            setShowCancelConfirm(false);
        } finally {
            setCancelLoading(false);
        }
    };

    if (!activeOrder) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
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
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-[11px] lg:text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg tracking-wider">{activeOrder.id}</span>
                        {activeOrder.isBooking && (
                            <span className="text-[11px] lg:text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg tracking-wider">BOOKING</span>
                        )}
                        {activeOrder.priority === 'Rush' && (
                            <span className="flex items-center gap-1 text-[11px] lg:text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg tracking-wider">
                                <AlertCircle size={14} /> RUSH
                            </span>
                        )}
                        {getDerivedStatus(activeOrder) === 'Overdue' && (
                            <span className="text-[11px] lg:text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg tracking-wider">OVERDUE</span>
                        )}
                        {isForApproval && (
                            <span className="text-[11px] lg:text-xs font-bold text-violet-700 bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg tracking-wider">FOR APPROVAL</span>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-white rounded-xl transition-all shadow-sm bg-transparent cursor-pointer"
                        >
                            <MoreHorizontal size={20} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 z-20">
                                <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer">
                                    <Edit size={16} className="text-gray-400" /> Edit Order
                                </button>
                                <button
                                    onClick={() => { setShowRescheduleModal(true); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 bg-transparent border-none cursor-pointer"
                                >
                                    <CalendarClock size={16} className="text-gray-400" /> Reschedule
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCancelConfirm(true);
                                        setIsMenuOpen(false);
                                    }}
                                    disabled={activeOrder.status === 'Cancelled'}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-colors mt-1 bg-transparent border-none cursor-pointer"
                                >
                                    <XCircle size={16} className="text-red-500" /> Cancel Order
                                </button>
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-5 custom-scrollbar relative" onClick={() => setIsMenuOpen(false)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                    <div className="col-span-2 flex flex-col gap-5">
                        <WorkflowProgress
                            activeOrderSteps={activeOrderSteps}
                            currentStepIdx={currentStepIdx}
                            onStepClick={handleStepClick}
                            orderId={activeOrder.id}
                            isForApproval={isForApproval}
                            hasSchedule={hasSchedule}
                        />
                        <ProductionTimeline
                            activeOrderSteps={activeOrderSteps}
                            currentStepIdx={currentStepIdx}
                            onStepClick={handleStepClick}
                            orderId={activeOrder.id}
                            isForApproval={isForApproval}
                            hasSchedule={hasSchedule}
                        />
                        <TeamRoster players={activeOrder.players} />
                    </div>
                    <div className="col-span-1 flex flex-col gap-4 lg:gap-5">
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                            <h4 className="text-[11px] font-black tracking-wider uppercase mb-2 text-gray-400">Quick Actions</h4>
                            {canApprovePickup && (
                                <button
                                    onClick={() => { setApprovalMode(true); setShowRescheduleModal(true); }}
                                    className="w-full rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 p-3 font-bold text-xs text-violet-700 uppercase tracking-wider transition-colors border-none cursor-pointer"
                                >
                                    Set Pickup Date & Time
                                </button>
                            )}
                            <button className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border-none cursor-pointer">
                                <Edit size={18} /> Edit Order Details
                            </button>
                            <button
                                onClick={() => setShowRescheduleModal(true)}
                                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border"
                            >
                                <CalendarClock size={18} /> Reschedule Delivery
                            </button>
                            {activeOrder.status !== 'Cancelled' && (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="w-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border"
                                >
                                    <XCircle size={18} /> Cancel Order
                                </button>
                            )}
                        </div>
                        <AssignedTailorPanel
                            activeOrder={activeOrder}
                            assignments={assignments}
                            assignedEmployee={assignedEmployee}
                            earningsPreview={earningsPreview}
                            onAssign={handleAssign}
                            isCancelled={isCancelled}
                        />
{imageUrls.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                <h4 className="text-[11px] font-black tracking-wider uppercase mb-4 text-gray-400">Uploaded Images</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {imageUrls.map((src, index) => (
                                        <a
                                            key={`${src}-${index}`}
                                            href={src}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm"
                                        >
                                            <img
                                                src={src}
                                                alt={`Uploaded image ${index + 1}`}
                                                className="w-full h-32 object-cover"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(activeOrder.driveLink || bookingExtras?.driveLink || activeOrder.orgDriveLink || bookingExtras?.orgDriveLink) && (
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                <h4 className="text-[11px] font-black tracking-wider uppercase mb-4 text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded-lg inline-flex items-center gap-1.5">
                                    <ExternalLink size={12} /> Google Drive Link
                                </h4>
                                <a
                                    href={activeOrder.driveLink || bookingExtras?.driveLink || activeOrder.orgDriveLink || bookingExtras?.orgDriveLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-4 text-center hover:bg-indigo-50 transition-colors rounded-xl group border border-gray-100"
                                >
                                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                                        <LinkIcon size={20} className="text-white" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 mb-1 truncate">
                                        Design Reference (Google Drive)
                                    </p>
                                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-100 px-2.5 py-1 rounded-full group-hover:bg-indigo-200 transition-colors">
                                        Open in new tab →
                                    </span>
                                </a>
                            </div>
                        )}
                        <OrderSummary
                            activeOrder={activeOrder}
                            assignedEmployee={assignedEmployee}
                            earningsPreview={earningsPreview}
                        />
                    </div>
                </div>
            </div>

            <RescheduleModal
                isOpen={showRescheduleModal}
                onClose={() => { setShowRescheduleModal(false); setApprovalMode(false); }}
                onConfirm={(date, time) => { handleRescheduleConfirm(date, time); setApprovalMode(false); }}
                mode={approvalMode ? 'approve' : 'reschedule'}
                currentDate={activeOrder?.pickupDate || new Date().toISOString().split('T')[0]}
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
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={cancelLoading}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-transparent border-none cursor-pointer ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-red-700">Order ID: <span className="font-bold">{activeOrder.id}</span></p>
                                <p className="text-xs font-semibold text-red-700 mt-1">Customer: <span className="font-bold">{activeOrder.customer}</span></p>
                            </div>
                        </div>

                        <div className="p-6 flex gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={cancelLoading}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                disabled={cancelLoading}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}