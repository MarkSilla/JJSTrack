import React from 'react';
import { Search, Filter } from 'lucide-react';
import { STATUS_CONFIG, TYPE_CONFIG, PRIORITY_CONFIG, SERVICE_STEPS, EMPLOYEE_POOL } from './Constants.js';
import { getDerivedStatus, getActiveStepIndex } from '../../../utils/helpers.js';

export default function OrderList({
    filteredOrders,
    activeOrderId,
    setActiveOrderId,
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    filterStatus,
    setFilterStatus,
    counts,
    orderTracking,
    assignments,
}) {
    const statusTabs = ['All', 'For Approval', 'In Progress', 'Ready', 'Overdue', 'Cancelled'];
    const approvalTabs = [
        { label: 'All', value: 'All' },
        { label: 'Pending Approval', value: 'For Approval' },
    ];

    return (
        <div className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-64px)] ${activeOrderId ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-5 lg:p-6 pb-4 border-b border-gray-50 shrink-0 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Orders</h2>
                </div>
                <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-center cursor-pointer
                            ${isFilterOpen || filterStatus !== 'All' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Filter size={18} />
                            {filterStatus !== 'All' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full" />}
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 top-14 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 z-30">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Filters</h3>
                                    <button onClick={() => { setFilterStatus('All'); setIsFilterOpen(false); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter bg-transparent border-none cursor-pointer">Reset</button>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Order Status</label>
                                    <div className="flex flex-col gap-1.5">
                                        {statusTabs.map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => { setFilterStatus(tab); setIsFilterOpen(false); }}
                                                className={`px-3 py-2 text-[11px] font-bold rounded-lg border transition-all flex items-center justify-between cursor-pointer
                                                ${filterStatus === tab ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'}`}
                                            >
                                                {tab}
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${filterStatus === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts[tab]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-3">
                    <div className="inline-flex p-1 rounded-xl border border-gray-200 bg-gray-50 relative">
                        {approvalTabs.map(tab => (
                            <div key={tab.value} className="relative">
                                <button
                                    onClick={() => {
                                        setFilterStatus(tab.value);
                                        setIsFilterOpen(false);
                                    }}
                                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer
                                    ${filterStatus === tab.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab.label} ({counts[tab.value] ?? 0})
                                </button>
                                {tab.value === 'For Approval' && counts['For Approval'] > 0 && (
                                    <span className="absolute -top-2.5 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full shadow-md">
                                        {counts['For Approval']}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 custom-scrollbar">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm font-medium">No orders found</div>
                ) : (
                    filteredOrders.map(order => {
                        const orderId = order.id || order._id;
                        const isSelected = activeOrderId === orderId;
                        const derivedStatus = getDerivedStatus(order);
                        const statusConf = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG['Pending'];
                        const orderStepIdx = getActiveStepIndex(order, orderTracking);
                        const orderSteps = order.steps || SERVICE_STEPS[order.serviceType] || SERVICE_STEPS['Team Jersey'];
                        const currentStageLabel = derivedStatus === 'For Approval'
                            ? 'Awaiting Admin Approval'
                            : (orderSteps[orderStepIdx]?.label || orderSteps[orderStepIdx] || 'Pending');
                        const priorityConf = order.priority ? PRIORITY_CONFIG[order.priority] : null;
                        const PriorityIcon = priorityConf?.icon;
                        const typeConf = TYPE_CONFIG[order.serviceType] || TYPE_CONFIG['Team Jersey'];
                        const listAssignee = assignments[orderId] ? EMPLOYEE_POOL.find(e => e.id === assignments[orderId]) : null;

                        return (
                            <div
                                key={orderId}
                                onClick={() => setActiveOrderId(orderId)}
                                className={`cursor-pointer rounded-2xl relative transition-all duration-200 border overflow-hidden
                                ${isSelected ? 'bg-blue-50/30 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'}
                                ${derivedStatus === 'Cancelled' ? 'opacity-60 bg-gray-50' : ''}`}
                            >
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                                <div className="p-4 pl-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-[11px] font-bold text-gray-500 tracking-wider">{orderId}</span>
                                        <div className="flex items-center gap-1.5">
                                            {order.isBooking && (
                                                <span className="text-[9px] font-black uppercase px-2 py-1 rounded border border-purple-200 bg-purple-50 text-purple-600 tracking-wider">Booking</span>
                                            )}
                                            {priorityConf && order.priority === 'Rush' && (
                                                <span className={`flex items-center text-[9px] font-black uppercase px-2 py-1 rounded border tracking-wider ${priorityConf.color}`}>
                                                    {PriorityIcon && <PriorityIcon size={12} className="mr-1" />}
                                                    {order.priority}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider ${statusConf.color}`}>{statusConf.label}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{order.customer || order.customerName || 'Unknown'}</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeConf?.color}`}>{order.serviceType || order.orderType || 'Service'}</span>
                                        <span className="text-xs font-medium text-gray-500 truncate max-w-[160px]" title={order.item}>{order.item || order.itemType || 'Item'}</span>
                                    </div>
                                    {listAssignee && (
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600 shrink-0">
                                                {listAssignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <span className="text-[10px] font-semibold text-blue-600 truncate">{listAssignee.name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/80">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                            <div className={`w-2 h-2 rounded-full ${derivedStatus === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            {currentStageLabel}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                            Due: <span className={derivedStatus === 'Overdue' ? 'text-red-500' : 'text-gray-600'}>
                                                {derivedStatus === 'For Approval'
                                                    ? 'Awaiting Date'
                                                    : new Date(order.invoice?.dueDate || order.estimatedCompletion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
