import React from 'react';
import { ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
    "Completed": { color: "bg-emerald-100 text-emerald-700", label: "Completed", dot: "bg-emerald-500" },
    "In Progress": { color: "bg-blue-100 text-blue-700", label: "In Progress", dot: "bg-blue-500" },
    "Pending": { color: "bg-amber-100 text-amber-700", label: "Pending", dot: "bg-amber-500" },
    "Overdue": { color: "bg-red-100 text-red-700", label: "Overdue", dot: "bg-red-500" },
};

const TYPE_CONFIG = {
    "Team Jersey": { color: "bg-indigo-100 text-indigo-700" },
    "Organization": { color: "bg-teal-100 text-teal-700" },
    "Repair": { color: "bg-orange-100 text-orange-700" },
};

const OrderCard = ({ order, onClick, getDerivedStatus, getActiveStepIndex }) => {
    const derivedStatus = getDerivedStatus(order);
    const orderDisplayId = order.displayId || order.orderId || order.bookingId || order.id;
    const statusConf = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG['Pending'];
    const typeConf = TYPE_CONFIG[order.serviceType] || TYPE_CONFIG['Team Jersey'];
    const stepIdx = getActiveStepIndex(order);
    const steps = order.steps || [];
    const currentStep = steps[stepIdx]?.label || steps[stepIdx] || 'Pending';
    const progressPercent = steps.length > 1 ? Math.round((stepIdx / (steps.length - 1)) * 100) : 0;

    return (
        <div
            onClick={() => onClick(order.id)}
            className="md:hidden bg-white rounded-3xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95 relative overflow-hidden group"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="max-w-[170px] truncate text-xs font-bold text-gray-400 tracking-wider font-mono">
                    {orderDisplayId}
                </span>
                <span className={`text-xs font-black uppercase px-2 py-1 rounded-md tracking-wider ${statusConf.color}`}>
                    {statusConf.label}
                </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{order.customer}</h3>
            <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${typeConf?.color}`}>
                    {order.serviceType}
                </span>
                <span className="text-xs font-medium text-gray-500 truncate max-w-xs">{order.item}</span>
            </div>

            <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold text-gray-400">Assigned by</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{order.assignedBy || 'Admin'}</span>
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        <div className={`w-2 h-2 rounded-full ${statusConf.dot}`} />
                        {typeof currentStep === 'string' ? currentStep : String(currentStep)}
                    </div>
                    <span className="text-xs font-bold text-gray-400">{progressPercent}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase">
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
