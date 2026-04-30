import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { STATUS_CONFIG, TYPE_CONFIG, PRIORITY_CONFIG, SERVICE_STEPS, EMPLOYEE_POOL } from './Constants.js';
import { getDerivedStatus, getActiveStepIndex } from '../../../utils/helpers.js';

const SORT_OPTIONS = [
    { value: 'date-newest', label: 'Date: Newest' },
    { value: 'date-oldest', label: 'Date: Oldest' },
];

const SERVICE_TYPE_OPTIONS = [
    { value: 'all', label: 'Service: All' },
    { value: 'repair', label: 'Service: Repair' },
    { value: 'jersey', label: 'Service: Jersey' },
    { value: 'organization', label: 'Service: Organization' },
];

export default function OrderList({
    filteredOrders,
    activeOrderId,          // null when used on the list page; orderId string when used inside detail page breadcrumb etc.
    onOrderClick,           // NEW: (orderId: string) => void  —  replaces setActiveOrderId
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    serviceTypeFilter,
    setServiceTypeFilter,
    isFilterOpen,
    setIsFilterOpen,
    filterStatus,
    setFilterStatus,
    counts,
    orderTracking,
    assignments,
    fullWidth = false,
}) {
    const [showSort, setShowSort] = useState(false);
    const [showServiceTypeSort, setShowServiceTypeSort] = useState(false);
    const statusTabs = ['All', 'For Approval', 'In Progress', 'Released', 'Completed', 'Overdue', 'Cancelled'];
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort by';
    const currentServiceTypeLabel = SERVICE_TYPE_OPTIONS.find(o => o.value === serviceTypeFilter)?.label || 'Service: All';
    const approvalTabs = [
        { label: 'All', value: 'All' },
        { label: 'Pending Approval', value: 'For Approval' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Released', value: 'Released' },
        { label: 'Overdue', value: 'Overdue' },
    ];

    // Width classes: full-width mode vs the original fixed side-panel width
    const containerWidth = fullWidth
        ? 'w-full'
        : 'w-full lg:w-[320px] xl:w-[350px] shrink-0';

    return (
        <div className={`${containerWidth} flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-visible h-[calc(100vh-64px)]`}>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="p-4 sm:p-5 border-b border-gray-100 shrink-0 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Orders</h2>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col gap-3 relative">
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search ID, name, service..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 rounded-2xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all w-full"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-visible">
                        {/* Sort Dropdown */}
                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => {
                                    setShowSort(v => !v);
                                    setShowServiceTypeSort(false);
                                    setIsFilterOpen(false);
                                }}
                                className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-gray-600 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    <SlidersHorizontal size={12} className="text-blue-500" />
                                    <span className="max-w-[80px] sm:max-w-[100px] truncate">{currentSortLabel}</span>
                                </div>
                                <ChevronDown size={11} className={`text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                            </button>
                            {showSort && (
                                <div className="absolute left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-[40] overflow-hidden w-44">
                                    {SORT_OPTIONS.map(o => (
                                        <button
                                            key={o.value}
                                            onClick={() => { setSortOption(o.value); setShowSort(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none ${sortOption === o.value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-slate-50'}`}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Service Type Dropdown */}
                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => {
                                    setShowServiceTypeSort(v => !v);
                                    setShowSort(false);
                                    setIsFilterOpen(false);
                                }}
                                className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-gray-600 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Filter size={12} className="text-blue-500" />
                                    <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentServiceTypeLabel}</span>
                                </div>
                                <ChevronDown size={11} className={`text-gray-400 transition-transform ${showServiceTypeSort ? 'rotate-180' : ''}`} />
                            </button>
                            {showServiceTypeSort && (
                                <div className="absolute left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-[40] overflow-hidden w-48">
                                    {SERVICE_TYPE_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setServiceTypeFilter(option.value);
                                                setShowServiceTypeSort(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none ${serviceTypeFilter === option.value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-slate-50'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => {
                                    setIsFilterOpen(!isFilterOpen);
                                    setShowSort(false);
                                    setShowServiceTypeSort(false);
                                }}
                                className={`h-9 px-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer gap-2
                                ${isFilterOpen || filterStatus !== 'All'
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-slate-50 border-transparent text-gray-500 hover:bg-slate-100'}`}
                            >
                                <SlidersHorizontal size={14} />
                                <span className="text-[11px] font-bold hidden sm:inline">Status</span>
                                {filterStatus !== 'All' && (
                                    <span className="w-4 h-4 bg-white text-blue-600 rounded-full flex items-center justify-center text-[9px] font-black">
                                        {counts[filterStatus] || '!'}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl p-3 z-[40]">
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</h3>
                                        <button
                                            onClick={() => { setFilterStatus('All'); setIsFilterOpen(false); }}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter bg-transparent border-none cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {statusTabs.map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => { setFilterStatus(tab); setIsFilterOpen(false); }}
                                                className={`px-3 py-2 text-[11px] font-bold rounded-lg border transition-all flex items-center justify-between cursor-pointer
                                                ${filterStatus === tab
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'}`}
                                            >
                                                {tab}
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${filterStatus === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {counts[tab]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop-only Quick approval tabs */}
                <div className="hidden lg:block mt-4 overflow-x-auto no-scrollbar">
                    <div className="inline-flex p-1 rounded-2xl border border-gray-100 bg-slate-50/80">
                        {approvalTabs.map(tab => (
                            <div key={tab.value} className="relative">
                                <button
                                    onClick={() => { setFilterStatus(tab.value); setIsFilterOpen(false); }}
                                    className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap
                                    ${filterStatus === tab.value
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                                >
                                    {tab.label}
                                    <span className="ml-1.5 opacity-50 font-medium">({counts[tab.value] ?? 0})</span>
                                </button>
                                {tab.value === 'For Approval' && counts['For Approval'] > 0 && (
                                    <span className="absolute -top-2 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full shadow-md border-2 border-white">
                                        {counts['For Approval']}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Order rows ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-2 custom-scrollbar">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm font-medium">No orders found</div>
                ) : (
                    filteredOrders.map(order => {
                        const orderId = order.id || order._id;
                        const orderDisplayId = order.displayId || order.orderId || order.bookingId || orderId;
                        const isSelected = activeOrderId === orderId;
                        const derivedStatus = getDerivedStatus(order);
                        const statusConf = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG['Pending'];
                        const orderStepIdx = getActiveStepIndex(order, orderTracking);
                        const orderSteps = order.steps || SERVICE_STEPS[order.serviceType] || SERVICE_STEPS['Team Jersey'];
                        const rawStatus = String(order.status || '').toLowerCase();
                        const currentStageLabel =
                            derivedStatus === 'For Approval'
                                ? 'Awaiting Admin Approval'
                                : derivedStatus === 'Released'
                                    ? 'Picked Up'
                                    : derivedStatus === 'Completed' && rawStatus.includes('pick')
                                        ? 'Pick-up'
                                        : derivedStatus === 'Completed'
                                            ? 'Ready for Pick Up'
                                            : (orderSteps[orderStepIdx]?.label || orderSteps[orderStepIdx] || 'Pending');
                        const priorityConf = order.priority ? PRIORITY_CONFIG[order.priority] : null;
                        const PriorityIcon = priorityConf?.icon;
                        const typeConf = TYPE_CONFIG[order.serviceType] || TYPE_CONFIG['Team Jersey'];
                        const listAssigneeValue = assignments[orderId]
                            || order.staffAssignments?.tailor
                            || order.assignedTailor;
                        const listAssignee = listAssigneeValue
                            ? EMPLOYEE_POOL.find(e => [e.id, e.name, e.fullName].includes(listAssigneeValue))
                            || { name: listAssigneeValue }
                            : null;
                        const isNamedGroupBooking =
                            Boolean(order.isBooking) &&
                            (order.serviceType === 'Team Jersey' || order.serviceType === 'Organization') &&
                            Boolean(order.item);
                        const primaryLabel = isNamedGroupBooking
                            ? (order.item || 'Unnamed Group')
                            : (order.customer || order.customerName || 'Unknown');
                        const secondaryLabel = isNamedGroupBooking
                            ? (order.customer || order.customerName || 'Unknown')
                            : (order.item || order.itemType || 'Item');

                        return (
                            <div
                                key={orderId}
                                onClick={() => onOrderClick(orderId)}   /* ← navigate instead of setState */
                                className={`cursor-pointer rounded-2xl relative transition-all duration-200 border overflow-hidden
                                ${isSelected
                                        ? 'bg-blue-50/30 border-blue-200 shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'}
                                ${derivedStatus === 'Cancelled' ? 'opacity-60 bg-gray-50' : ''}`}
                            >
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                                <div className="p-3 pl-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <span
                                            className="max-w-[160px] truncate text-[11px] font-bold text-gray-500 tracking-wider"
                                            title={orderDisplayId}
                                        >
                                            {orderDisplayId}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {order.isBooking && (
                                                <span className="text-[9px] font-black uppercase px-2 py-1 rounded border border-purple-200 bg-purple-50 text-purple-600 tracking-wider">
                                                    Booking
                                                </span>
                                            )}
                                            {priorityConf && order.priority === 'Rush' && (
                                                <span className={`flex items-center text-[9px] font-black uppercase px-2 py-1 rounded border tracking-wider ${priorityConf.color}`}>
                                                    {PriorityIcon && <PriorityIcon size={12} className="mr-1" />}
                                                    {order.priority}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider ${statusConf.color}`}>
                                                {statusConf.label}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight truncate" title={primaryLabel}>
                                        {primaryLabel}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeConf?.color}`}>
                                            {order.serviceType || order.orderType || 'Service'}
                                        </span>
                                        <span
                                            className="text-xs font-medium text-gray-500 truncate max-w-[160px]"
                                            title={secondaryLabel}
                                        >
                                            {isNamedGroupBooking ? `Booked by ${secondaryLabel}` : secondaryLabel}
                                        </span>
                                    </div>

                                    {listAssignee && (
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600 shrink-0">
                                                {listAssignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <span className="text-[10px] font-semibold text-blue-600 truncate">{listAssignee.name}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/80">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                            <div className={`w-2 h-2 rounded-full ${derivedStatus === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            {currentStageLabel}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                            Due:{' '}
                                            <span className={derivedStatus === 'Overdue' ? 'text-red-500' : 'text-gray-600'}>
                                                {derivedStatus === 'For Approval'
                                                    ? 'Awaiting Date'
                                                    : new Date(order.invoice?.dueDate || order.estimatedCompletion).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
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
