import React from 'react';
import { Check } from 'lucide-react';
import { STEP_ICON } from './Constants.js';

export default function WorkflowProgress({ activeOrderSteps, currentStepIdx, onStepClick, orderId, isForApproval }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative">
            {isForApproval && (
                <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-700">Please Approve the Order First</p>
                    </div>
                </div>
            )}
            <div className={isForApproval ? 'opacity-40 pointer-events-none' : ''}>
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400">Workflow Progress</h3>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                    {currentStepIdx >= activeOrderSteps.length - 1
                        ? 'Ready for Pickup'
                        : `Step ${currentStepIdx + 1} of ${activeOrderSteps.length}`}
                </span>
            </div>
            <div className="relative flex justify-between items-start px-4">
                <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 rounded-full z-0" />
                <div
                    className="absolute top-4 left-4 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full z-0 transition-all duration-500"
                    style={{
                        width: activeOrderSteps.length <= 1
                            ? '0%'
                            : `${Math.min(100, (currentStepIdx / (activeOrderSteps.length - 1)) * 100)}%`
                    }}
                />
                {activeOrderSteps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const label = step.label || step;
                    const Icon = STEP_ICON[label.toLowerCase()] || null;
                    return (
                        <div
                            key={idx}
                            className="relative z-10 flex flex-col items-center gap-2 flex-1"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white shadow-sm shrink-0
                            ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-gray-300 text-white ring-slate-100' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                {isCompleted ? <Check size={14} strokeWidth={3} /> : Icon ? <Icon size={14} /> : null}
                            </div>
                            <span className={`text-[10px] font-bold text-center leading-tight px-0.5 max-w-[60px] break-words
                            ${isCompleted ? 'text-green-600' : isCurrent ? 'text-green-600' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
