import React from 'react';
import { Clock, Check, User, CalendarClock } from 'lucide-react';

export default function ProductionTimeline({ activeOrderSteps, currentStepIdx, onStepClick, orderId, isForApproval, hasSchedule }) {
    const showScheduleHint = !hasSchedule;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative">
            <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock size={18} className="text-blue-500" />Production Progress
            </h3>
            {showScheduleHint && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-800">
                    <CalendarClock size={14} className="mt-0.5 shrink-0" />
                    Pickup date and time will be set after the production team assignment. Continue the drop-off flow to assign the team first.
                </div>
            )}
            <div className="relative pl-4 space-y-6">
                <div className="absolute left-[15px] top-3 bottom-5 w-0.5 bg-gray-100" />
                {activeOrderSteps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx || step.done;
                    const isCurrent = idx === currentStepIdx;
                    const label = (step?.label || step) || `Step ${idx + 1}`;
                    return (
                        <div
                            key={idx}
                            className="relative flex items-start gap-4 cursor-pointer group"
                            onClick={() => onStepClick(orderId, idx)}
                        >
                            <div className="relative z-10 bg-white py-1">
                                {isCompleted ? (
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-4 ring-white -ml-2.5">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                ) : isCurrent ? (
                                    <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50 -ml-0.5" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white -ml-0.5" />
                                )}
                            </div>
                            <div className="flex-1 -mt-1 pb-4">
                                <div className={`text-sm font-black tracking-wide transition-colors flex items-center justify-between ${(isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-400'}`}>
                                    <span className="min-h-[20px]">{typeof label === 'string' ? label : String(label)}</span>
                                    {(isCompleted || isCurrent) && step.worker && (
                                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                            <User size={10} className="inline mr-1" />{step.worker}
                                        </span>
                                    )}
                                </div>
                                {(step?.time || step?.date) && (isCompleted || isCurrent) && (
                                    <div className="mt-2 space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {step.date && (
                                            <div><span className="font-semibold text-gray-400">Date:</span> {step.date}</div>
                                        )}
                                        {step.time && (
                                            <div><span className="font-semibold text-gray-400">Time:</span> {step.time}</div>
                                        )}
                                        {step.endTime && (
                                            <div><span className="font-semibold text-gray-400">Completed:</span> {step.endTime}</div>
                                        )}
                                        {step.duration && (
                                            <div><span className="font-semibold text-gray-400">Duration:</span> {step.duration}</div>
                                        )}
                                    </div>
                                )}
                                {isCurrent && !isCompleted && idx < activeOrderSteps.length && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onStepClick(orderId, idx); }}
                                        className="mt-3 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm w-full sm:w-auto border-none cursor-pointer"
                                    >
                                        Mark as {label}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
