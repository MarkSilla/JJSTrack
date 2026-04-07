import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
    "Completed": { color: "bg-emerald-100 text-emerald-700", label: "Completed", dot: "bg-emerald-500" },
    "In Progress": { color: "bg-blue-100 text-blue-700", label: "In Progress", dot: "bg-blue-500" },
    "Pending": { color: "bg-amber-100 text-amber-700", label: "Pending", dot: "bg-amber-500" },
};

const TYPE_CONFIG = {
    "Team Jersey": { color: "bg-indigo-100 text-indigo-700" },
    "Organization": { color: "bg-teal-100 text-teal-700" },
    "Repair": { color: "bg-orange-100 text-orange-700" },
};

const OrderCard = ({ order, onClick, getDerivedStatus, getActiveStepIndex }) => {
    const derivedStatus = getDerivedStatus(order);
    const statusConf = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG['Pending'];
    const typeConf = TYPE_CONFIG[order.serviceType] || TYPE_CONFIG['Team Jersey'];
    const stepIdx = getActiveStepIndex(order);
    const steps = order.steps || [];
    const currentStep = steps[stepIdx]?.label || steps[stepIdx] || 'Pending';
    const progressPercent = steps.length > 1 ? Math.round((stepIdx / (steps.length - 1)) * 100) : 0;

    return (
        <div
            onClick={() => onClick(order.id)}
            className="md:hidden bg-white rounded-3xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 active:scale-[0.98] relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 -z-0 translate-x-1/2 -translate-y-1/2" />

            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-gray-400 tracking-wider font-mono">
                    {order.id.slice(0, 10)}...
                </span>
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider ${statusConf.color}`}>
                        {statusConf.label}
                    </span>
                </div>
            </div>

            {/* Customer + Item */}
            <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{order.customer}</h3>
            <div className="flex items-center gap-2 mb-3">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeConf?.color}`}>
                    {order.serviceType}
                </span>
                <span className="text-xs font-medium text-gray-500 truncate max-w-[180px]">{order.item}</span>
            </div>

            {/* Assigned By */}
            <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-semibold text-gray-400">Assigned by</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{order.assignedBy || 'Admin'}</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        <div className={`w-2 h-2 rounded-full ${statusConf.dot}`} />
                        {typeof currentStep === 'string' ? currentStep : String(currentStep)}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                        {progressPercent}%
                    </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Bottom — Due date + Arrow */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Due: {order.invoice?.dueDate
                        ? new Date(order.invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : order.estimatedCompletion || 'N/A'}
                </span>
                <ChevronRight size={16} className="text-gray-300" />
            </div>
        </div>
    );
};

export default OrderCard;
