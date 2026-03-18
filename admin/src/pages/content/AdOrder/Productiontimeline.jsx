import React from 'react';
import { Clock, Check, User } from 'lucide-react';

export default function ProductionTimeline({ activeOrderSteps, currentStepIdx, onStepClick, orderId, isForApproval }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative">
            {isForApproval && (
                <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center z-20 backdrop-blur-sm">
                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-700">Locked</p>
                    </div>
                </div>
            )}
            <div className={isForApproval ? 'opacity-40 pointer-events-none' : ''}>
            <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock size={18} className="text-blue-500" />Production Progress
            </h3>
            <div className="relative pl-4 space-y-6">
                <div className="absolute left-[15px] top-3 bottom-5 w-0.5 bg-gray-100" />
                {activeOrderSteps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx || step.done;
                    const isCurrent = idx === currentStepIdx;
                    const label = step.label || step;
                    return (
                        <div
                            key={idx}
                            className={`relative flex items-start gap-4 ${isForApproval ? 'cursor-not-allowed' : 'cursor-pointer group'}`}
                            onClick={() => !isForApproval && onStepClick(orderId, idx)}
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
                                    <span>{label}</span>
                                    {(isCompleted || isCurrent) && step.worker && (
                                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                            <User size={10} className="inline mr-1" />{step.worker}
                                        </span>
                                    )}
                                </div>
                                {(step.time || step.date) && (isCompleted || isCurrent) && (
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
                                        <div><span className="font-semibold text-gray-400">Started:</span> {step.date} - {step.time}</div>
                                        {step.endTime && <div><span className="font-semibold text-gray-400">Completed:</span> {step.endTime}</div>}
                                        {step.duration && <div><span className="font-semibold text-gray-400">Duration:</span> {step.duration}</div>}
                                    </div>
                                )}
                                {isCurrent && !isCompleted && idx < activeOrderSteps.length && !isForApproval && (
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
        </div>
    );
}