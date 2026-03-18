import React, { useMemo, useState } from 'react';
import { MoreHorizontal, AlertCircle, User, Phone, Edit, CalendarClock, XCircle } from 'lucide-react';
import WorkflowProgress from './Workflowprogress';
import ProductionTimeline from './Productiontimeline';
import TeamRoster from './Teamroster';
import AssignedTailorPanel from './Assignedtailorpanel';
import OrderSummary from './Ordersummary';
import RescheduleModal from './RescheduleModal';
import { getDerivedStatus } from '../../../utils/helpers.js';

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
    const isForApproval = useMemo(() => getDerivedStatus(activeOrder) === 'For Approval', [activeOrder]);
    const canApprovePickup = isForApproval && (activeOrder?.serviceType === 'Team Jersey' || activeOrder?.serviceType === 'Organization');

    const handleRescheduleConfirm = (newDate, newTime) => {
        handleApprovePickupDate(activeOrder.id || activeOrder._id, newDate);
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
            <div className="p-5 lg:px-8 lg:py-6 border-b border-gray-50 shrink-0">
                <div className="flex justify-between items-start mb-4">
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
                                    onClick={() => {
                                        setShowRescheduleModal(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 bg-transparent border-none cursor-pointer"
                                >
                                    <CalendarClock size={16} className="text-gray-400" /> Reschedule
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors mt-1 bg-transparent border-none cursor-pointer">
                                    <XCircle size={16} className="text-red-500" /> Cancel Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <h1 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight flex items-baseline gap-2">
                    <span className="text-gray-400 font-bold capitalize">{activeOrder.serviceType}</span>
                    <span className="text-gray-300">-</span>
                    {activeOrder.item}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4 opacity-90">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <User size={16} className="text-gray-400" />{activeOrder.invoice?.billTo?.name || activeOrder.customer}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Phone size={16} className="text-gray-400" />{activeOrder.invoice?.billTo?.phone || activeOrder.phone || activeOrder.contact?.phone || 'N/A'}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 lg:p-8 custom-scrollbar relative" onClick={() => setIsMenuOpen(false)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    <div className="col-span-2 flex flex-col gap-8">
                        <WorkflowProgress
                            activeOrderSteps={activeOrderSteps}
                            currentStepIdx={currentStepIdx}
                            onStepClick={handleStepClick}
                            orderId={activeOrder.id}
                        />
                        <ProductionTimeline
                            activeOrderSteps={activeOrderSteps}
                            currentStepIdx={currentStepIdx}
                            onStepClick={handleStepClick}
                            orderId={activeOrder.id}
                            isForApproval={isForApproval}
                        />
                        <TeamRoster players={activeOrder.players} />
                    </div>
                    <div className="col-span-1 flex flex-col gap-6 lg:gap-8">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                            <h4 className="text-[11px] font-black tracking-wider uppercase mb-2 text-gray-400">Quick Actions</h4>
                            {canApprovePickup && (
                                <button
                                    onClick={() => {
                                        setApprovalMode(true);
                                        setShowRescheduleModal(true);
                                    }}
                                    className="w-full rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 p-3 font-bold text-xs text-violet-700 uppercase tracking-wider transition-colors border-none cursor-pointer"
                                >
                                    Set Pickup Date & Time
                                </button>
                            )}
                            <button className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border-none cursor-pointer">
                                <Edit size={18} /> Edit Order Details
                            </button>
                            <button 
                                onClick={() => setShowRescheduleModal(true)}
                                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border"
                            >
                                <CalendarClock size={18} /> Reschedule Delivery
                            </button>
                        </div>
                        <AssignedTailorPanel
                            activeOrder={activeOrder}
                            assignments={assignments}
                            assignedEmployee={assignedEmployee}
                            earningsPreview={earningsPreview}
                            onAssign={handleAssign}
                        />
                        <OrderSummary
                            activeOrder={activeOrder}
                            assignedEmployee={assignedEmployee}
                        />
                    </div>
                </div>
            </div>

            <RescheduleModal 
                isOpen={showRescheduleModal} 
                onClose={() => {
                    setShowRescheduleModal(false);
                    setApprovalMode(false);
                }} 
                onConfirm={(date, time) => {
                    handleRescheduleConfirm(date, time);
                    setApprovalMode(false);
                }}
                mode={approvalMode ? 'approve' : 'reschedule'}
                currentDate={activeOrder?.pickupDate || new Date().toISOString().split('T')[0]}
            />
        </div>
    );
}
