import React from 'react';

const STATUS_CONFIG = {
    "Completed": { color: "bg-emerald-100 text-emerald-700", label: "Completed" },
    "In Progress": { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    "Pending": { color: "bg-amber-100 text-amber-700", label: "Pending" },
};

const TYPE_CONFIG = {
    "Team Jersey": { color: "bg-indigo-100 text-indigo-700" },
    "Organization": { color: "bg-teal-100 text-teal-700" },
    "Repair": { color: "bg-orange-100 text-orange-700" },
};

const OrderRow = ({ order, isSelected, onClick, getDerivedStatus, getActiveStepIndex }) => {
    const orderId = order.id;
    const derivedStatus = getDerivedStatus(order);
    const statusConf = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG['Pending'];
    const typeConf = TYPE_CONFIG[order.serviceType] || TYPE_CONFIG['Team Jersey'];
    const stepIdx = getActiveStepIndex(order);
    const steps = order.steps || order.productionProgress || [];
    const currentStep = steps[stepIdx]?.step || steps[stepIdx]?.label || steps[stepIdx] || 'Pending';

    return (
        <tr
            onClick={() => onClick(orderId)}
            className={`cursor-pointer transition-all duration-200 border-b border-gray-50
                ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/70'}`}
        >
            <td className="px-4 py-3.5">
                <span className="text-xs font-bold text-gray-500 tracking-wider">{orderId}</span>
            </td>

            <td className="px-4 py-3.5">
                <span className="text-sm font-bold text-gray-900 block">{order.customer || order.customerName}</span>
                <span className="text-xs font-medium text-gray-400 mt-0.5 block">{order.phone || order.contact}</span>
            </td>

            <td className="px-4 py-3.5 hidden md:table-cell">
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${typeConf?.color}`}>
                    {order.serviceType || order.serviceTitle}
                </span>
            </td>

            <td className="px-4 py-3.5 hidden lg:table-cell">
                <span className="text-xs font-medium text-gray-600 truncate max-w-xs block" title={order.item || order.category}>
                    {order.item || order.category}
                </span>
            </td>

            <td className="px-4 py-3.5">
                <span className={`text-xs font-black uppercase px-2 py-1 rounded-md tracking-wider ${statusConf.color}`}>
                    {statusConf.label}
                </span>
            </td>

            <td className="px-4 py-3.5 hidden xl:table-cell">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${derivedStatus === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    {typeof currentStep === 'string' ? currentStep : String(currentStep)}
                </div>
            </td>

            <td className="px-4 py-3.5 hidden sm:table-cell">
                <span className="text-xs font-bold text-gray-500">
                    {order.dueDate || order.estimatedCompletion || order.invoice?.dueDate || 'N/A'}
                </span>
            </td>
        </tr>
    );
};

export default OrderRow;
