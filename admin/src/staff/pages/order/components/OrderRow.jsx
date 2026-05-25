import React from 'react';

const STATUS_CONFIG = {
    "Completed": { color: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", label: "Completed" },
    "Released": { color: "bg-cyan-50 text-cyan-700 border border-cyan-200", dot: "bg-cyan-500", label: "Released" },
    "In Progress": { color: "bg-blue-50 text-blue-700 border border-blue-200", dot: "bg-blue-500", label: "In Progress" },
    "Pending": { color: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-500", label: "Pending" },
    "Overdue": { color: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-500", label: "Overdue" },
};

const TYPE_CONFIG = {
    "Jersey": { color: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
    "Organizational": { color: "bg-teal-50 text-teal-700 border border-teal-200" },
    "Repair": { color: "bg-orange-50 text-orange-700 border border-orange-200" },
};

const OrderRow = ({ order, isSelected, onClick, getDerivedStatus, getActiveStepIndex }) => {
    const orderId = order.id;
    const orderDisplayId = order.displayId || order.orderId || order.bookingId || orderId;
    const derivedStatus = getDerivedStatus(order);
    const statusConf = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG['Pending'];
    const typeConf = TYPE_CONFIG[order.serviceType] || { color: "bg-gray-50 text-gray-600 border border-gray-200" };
    const stepIdx = getActiveStepIndex(order);
    const steps = order.steps || order.productionProgress || [];
    const isFinishedStatus = derivedStatus === 'Completed' || derivedStatus === 'Released';
    const currentStep = isFinishedStatus
        ? derivedStatus
        : steps[stepIdx]?.step || steps[stepIdx]?.label || steps[stepIdx] || 'Pending';
    const rawDueDate = order.dueDate || order.estimatedCompletion || order.invoice?.dueDate || order.pickupDate || 'N/A';
    const formattedDueDate = rawDueDate === 'N/A' ? 'N/A' : new Date(rawDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <tr
            onClick={() => onClick(orderId)}
            className={`cursor-pointer transition-all duration-150 border-b border-gray-100 group
                ${isSelected ? 'bg-blue-50/60 ring-1 ring-inset ring-blue-200' : 'hover:bg-gray-50/80'}`}
        >
            <td className="px-5 py-4">
                <span className="font-inter text-[12px] font-bold text-slate-500 ">
                    #{orderDisplayId.length > 6 ? orderDisplayId.slice(-6) : orderDisplayId}
                </span>
            </td>
            <td className="px-5 py-4">
                <div className="text-sm font-bold text-gray-900 leading-tight">{order.customer || order.customerName}</div>
                <div className="text-[11px] font-medium text-gray-400 mt-0.5">{order.phone || order.contact?.phone || order.contact || 'N/A'}</div>
            </td>
            <td className="px-5 py-4">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider ${typeConf.color}`}>
                    {order.serviceType || order.serviceTitle || '—'}
                </span>
            </td>
            <td className="px-5 py-4">
                <span className="text-xs font-bold text-gray-700 truncate max-w-[150px] block" title={order.item || order.category}>
                    {order.item || order.category || '—'}
                </span>
            </td>
            <td className="px-5 py-4 min-w-[180px]">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                            {typeof currentStep === 'string' ? currentStep : 'Processing'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-900">
                            {isFinishedStatus ? '100%' : `${Math.round(((stepIdx + 1) / (steps.length || 1)) * 100)}%`}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${derivedStatus === 'Released' ? 'bg-cyan-500' : derivedStatus === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: isFinishedStatus ? '100%' : `${((stepIdx + 1) / (steps.length || 1)) * 100}%` }}
                        />
                    </div>
                </div>
            </td>

            {/* Due Date */}
            <td className="px-1 py-4">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${formattedDueDate === 'N/A'
                    ? 'text-gray-400 '
                    : 'text-red-600 '
                    }`}>
                    {formattedDueDate}
                </span>
            </td>

            {/* Status (Last) */}
            <td className="px-5 py-4">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider ${statusConf.color}`}>
                    {statusConf.label}
                </span>
            </td>
        </tr>
    );
};

export default OrderRow;
