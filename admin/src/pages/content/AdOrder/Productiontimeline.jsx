import React from 'react';
import { Clock, Check, User, CalendarClock } from 'lucide-react';

export default function ProductionTimeline({ activeOrderSteps, currentStepIdx, onStepClick, orderId, isForApproval, hasSchedule }) {
    const showScheduleHint = !hasSchedule;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                Production Progress
            </h3>
            {
                showScheduleHint && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold leading-tight text-amber-800">
                        <CalendarClock size={12} className="mt-0.5 shrink-0" />
                        Pickup schedule pending production team assignment.
                    </div>
                )
            }
            <div className="relative pl-3 space-y-3">
                <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gray-50" />
                {activeOrderSteps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx || step.done;
                    const isCurrent = idx === currentStepIdx;
                    const label = (step?.label || step) || `Step ${idx + 1}`;
                    return (
                        <div
                            key={idx}
                            className="relative flex items-start gap-3 cursor-pointer group"
                            onClick={() => onStepClick(orderId, idx)}
                        >
                            <div className="relative z-10 bg-white py-0.5">
                                {isCompleted ? (
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-4 ring-white -ml-2">
                                        <Check size={13} strokeWidth={3} />
                                    </div>
                                ) : isCurrent ? (
                                    <div className="w-4 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-50 -ml-0.5" />
                                ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 bg-white -ml-0.5" />
                                )}
                            </div>
                            <div className="flex-1 -mt-0.5 pb-2">
                                <div className={`text-[13px] font-black tracking-tight transition-colors flex items-center justify-between ${(isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-400'}`}>
                                    <span>{typeof label === 'string' ? label : String(label)}</span>
                                    {(isCompleted || isCurrent) && step.worker && (
                                        <span className="text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                                            <User size={8} className="inline mr-1" />{step.worker}
                                        </span>
                                    )}
                                </div>
                                {(step?.time || step?.date) && (isCompleted || isCurrent) && (
                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-gray-600 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">
                                        {step.date && (
                                            <div><span className="font-bold text-gray-400 uppercase text-[9px] mr-1.5">Date:</span> {step.date}</div>
                                        )}
                                        {step.time && (
                                            <div><span className="font-bold text-gray-400 uppercase text-[9px] mr-1.5">Time:</span> {step.time}</div>
                                        )}
                                        {step.endTime && (
                                            <div><span className="font-bold text-gray-400 uppercase text-[9px] mr-1.5">End:</span> {step.endTime}</div>
                                        )}
                                    </div>
                                )}
                                {isCurrent && !isCompleted && idx < activeOrderSteps.length && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onStepClick(orderId, idx); }}
                                        className="mt-2 bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors shadow-sm w-full sm:w-auto border-none cursor-pointer"
                                    >
                                        Complete {label}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
