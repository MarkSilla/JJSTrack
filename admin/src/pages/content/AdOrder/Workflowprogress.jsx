import React from 'react';
import { Check, Lock, CalendarClock, ShieldCheck } from 'lucide-react';
import { STEP_ICON } from './Constants.js';

export default function WorkflowProgress({ activeOrderSteps, currentStepIdx, onStepClick, orderId, isForApproval, hasSchedule }) {
    const isLocked = isForApproval || !hasSchedule;
    const lockReason = isForApproval
        ? {
            title: 'Approval Required',
            desc: 'The admin needs to approve this order before the workflow can begin.',
          }
        : !hasSchedule
        ? {
            title: 'No Schedule Set',
            desc: 'A pickup date and time must be scheduled before proceeding with this order.',
          }
        : null;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative">
            {isLocked && lockReason && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center px-6">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2.5">
                            <Lock size={16} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-extrabold text-gray-700 mb-1">{lockReason.title}</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{lockReason.desc}</p>
                    </div>
                </div>
            )}

            <div className={isLocked ? 'opacity-30 pointer-events-none' : ''}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400">Workflow Progress</h3>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                        {currentStepIdx >= activeOrderSteps.length - 1
                            ? 'Ready for Pickup'
                            : `Step ${currentStepIdx + 1} of ${activeOrderSteps.length}`}
                    </span>
                </div>

                {/* Steps row — icons on top, labels below, connector line through icon centers */}
                <div className="relative flex justify-between items-start px-4 pt-2">
                    {/* Background line through center of icons (icons are w-8 h-8 = 32px, so center = 16px from top of icon row) */}
                    <div className="absolute left-8 right-8 h-0.5 bg-gray-100 rounded-full z-0" style={{ top: '16px' }} />
                    <div
                        className="absolute left-8 h-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full z-0 transition-all duration-500"
                        style={{
                            top: '16px',
                            width: activeOrderSteps.length <= 1
                                ? '0%'
                                : `${Math.min(100, (currentStepIdx / (activeOrderSteps.length - 1)) * (100 - (16 / (activeOrderSteps.length * 60)) * 100))}%`
                        }}
                    />
                    {activeOrderSteps.map((step, idx) => {
                        const isCompleted = idx < currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        const label = step.label || step;
                        const Icon = STEP_ICON[label.toLowerCase()] || null;
                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white shadow-sm shrink-0
                                    ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white ring-blue-100' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                    {isCompleted ? <Check size={14} strokeWidth={3} /> : Icon ? <Icon size={14} /> : null}
                                </div>
                                <span className={`text-[10px] font-bold text-center leading-tight px-0.5 max-w-[60px] break-words
                                    ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-500' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}