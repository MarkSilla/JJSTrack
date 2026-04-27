import React from 'react';
import { Check, Package, Brush, Printer, Scissors, Truck, AlertCircle } from 'lucide-react';
import { MdOutlineIron } from 'react-icons/md';
import {
    canStaffAccessStep,
    formatWorkflowRoleLabel,
    getCurrentStaffRole,
    getWorkflowStepAccessLabel,
    getWorkflowStepRequiredRole,
} from '../../../utils/workflowAccess.js';

const STEP_ICONS = {
    "Dropped Off": Package,
    "Drop Off": Package,
    "Layout": Brush,
    "Printing": Printer,
    "Pressing": MdOutlineIron,
    "Sewing": Scissors,
    "Pick-up": Truck,
    "default": Package
};

const STEP_STATUS = {
    completed: {
        dot: 'bg-emerald-500 text-white ring-4 ring-emerald-50',
        label: 'text-emerald-700 font-bold',
    },
    active: {
        dot: 'bg-blue-600 text-white ring-4 ring-blue-100 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-blue-500/20',
        label: 'text-blue-700 font-bold',
    },
    upcoming: {
        dot: 'bg-gray-200 text-gray-400 ring-4 ring-gray-50',
        label: 'text-gray-400 font-medium',
    },
};

const OrderStatusTracker = ({ steps = [], currentStepIdx = 0, onStepClick }) => {
    if (!steps.length) return null;

    const progressWidth = steps.length <= 1
        ? '0%'
        : `${Math.min(100, (currentStepIdx / (steps.length - 1)) * 100)}%`;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs uppercase tracking-widest font-black text-gray-400">
                    Production Status
                </h3>
                {currentStepIdx < steps.length && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        <AlertCircle size={12} />
                        Role-based workflow access
                    </div>
                )}
            </div>

            {/* Desktop horizontal tracker */}
            <div className="hidden md:block">
                <div className="relative pt-2">
                    <div className="absolute left-14 right-14 h-0.5 bg-gray-100 z-0 top-7">
                        <div
                            className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-700 ease-out"
                            style={{ width: progressWidth }}
                        />
                    </div>

                    <div className="relative flex items-start justify-between z-10 w-full">
                        {steps.map((step, idx) => {
                            const label = typeof step === 'string' ? step : (step.step || step.label);
                            const isCompleted = idx < currentStepIdx || step.done;
                            const isCurrent = idx === currentStepIdx && !step.done;
                            const staffRole = getCurrentStaffRole();
                            const canAccess = isCurrent && canStaffAccessStep(label, staffRole);
                            const requiredRole = getWorkflowStepRequiredRole(label);
                            const config = isCompleted ? STEP_STATUS.completed : isCurrent ? STEP_STATUS.active : STEP_STATUS.upcoming;
                            const Icon = STEP_ICONS[label] || STEP_ICONS.default;

                            return (
                                <div key={idx} className="relative z-10 flex flex-col items-center w-28 text-center">
                                    <button
                                        onClick={() => canAccess && onStepClick && onStepClick(idx)}
                                        disabled={!canAccess}
                                        title={canAccess ? '' : `Only ${formatWorkflowRoleLabel(requiredRole)} can access this step`}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-none outline-none ${config.dot} ${!canAccess && isCurrent ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {isCompleted ? (
                                            <Check size={18} strokeWidth={3} />
                                        ) : (
                                            <Icon size={18} strokeWidth={2.5} />
                                        )}
                                    </button>
                                    <div className="mt-3 flex flex-col items-center">
                                        <span className={`text-xs uppercase tracking-wider font-black ${config.label}`}>
                                            {label}
                                        </span>
                                        {isCompleted && step.time && (
                                            <span className="text-xs font-bold text-gray-400 mt-1">{step.time}</span>
                                        )}
                                        {isCurrent && (
                                            <span className={`text-xs font-black uppercase mt-0.5 tracking-tight ${canAccess ? 'text-blue-500' : 'text-gray-400'}`}>
                                                {canAccess ? 'In Progress' : getWorkflowStepAccessLabel(label, staffRole)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile vertical tracker */}
            <div className="md:hidden space-y-4">
                {steps.map((step, idx) => {
                    const label = typeof step === 'string' ? step : (step.step || step.label);
                    const isCompleted = idx < currentStepIdx || step.done;
                    const isCurrent = idx === currentStepIdx && !step.done;
                    const staffRole = getCurrentStaffRole();
                    const canAccess = isCurrent && canStaffAccessStep(label, staffRole);
                    const requiredRole = getWorkflowStepRequiredRole(label);
                    const config = isCompleted ? STEP_STATUS.completed : isCurrent ? STEP_STATUS.active : STEP_STATUS.upcoming;
                    const isLast = idx === steps.length - 1;
                    const Icon = STEP_ICONS[label] || STEP_ICONS.default;

                    return (
                        <div key={idx} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => canAccess && onStepClick && onStepClick(idx)}
                                    disabled={!canAccess}
                                    title={canAccess ? '' : `Only ${formatWorkflowRoleLabel(requiredRole)} can access this step`}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-none outline-none ${config.dot} ${!canAccess && isCurrent ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {isCompleted ? (
                                        <Check size={16} strokeWidth={3} />
                                    ) : (
                                        <Icon size={16} strokeWidth={2.5} />
                                    )}
                                </button>
                                {!isLast && (
                                    <div className={`w-0.5 h-8 mt-1 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                                )}
                            </div>
                            <div className="pt-1">
                                <span className={`text-xs uppercase tracking-wider font-black ${config.label}`}>
                                    {label}
                                </span>
                                {isCompleted && step.time && (
                                    <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                        Finished at {step.time}
                                    </div>
                                )}
                                {isCurrent && (
                                    <div className={`text-xs font-black uppercase mt-0.5 ${canAccess ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {canAccess ? 'Tap to complete' : getWorkflowStepAccessLabel(label, staffRole)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderStatusTracker;
