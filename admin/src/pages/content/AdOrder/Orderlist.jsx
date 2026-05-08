import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { STATUS_CONFIG, TYPE_CONFIG, PRIORITY_CONFIG, SERVICE_STEPS, EMPLOYEE_POOL } from './Constants.js';
import { getDerivedStatus, getActiveStepIndex } from '../../../utils/helpers.js';

const SORT_OPTIONS = [
    { value: 'date-today-appointment', label: "Today's Appointment" },
    { value: 'date-today-due', label: "Today's Due Date" },
    { value: 'date-newest', label: 'Date: Newest' },
    { value: 'date-oldest', label: 'Date: Oldest' },
];

const SERVICE_TYPE_OPTIONS = [
    { value: 'all', label: 'Service: All' },
    { value: 'repair', label: 'Service: Repair' },
    { value: 'jersey', label: 'Service: Jersey' },
    { value: 'organization', label: 'Service: Organization' },
];

const ROLE_LABELS = {
    layoutArtist: 'Layout',
    presser: 'Press',
    tailor: 'Tailor',
};

const normalizeStepLabel = (label = '') =>
    String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ');

const getVisibleAssignmentRoles = (order = {}) => {
    const labels = (Array.isArray(order.steps) ? order.steps : [])
        .map((step) => normalizeStepLabel(step?.label || step?.step || step));

    const roles = [];
    if (labels.includes('layout') || labels.includes('printing')) roles.push('layoutArtist');
    if (labels.includes('pressing')) roles.push('presser');
    if (labels.includes('sewing')) roles.push('tailor');

    const assignments = order.staffAssignments || {};
    Object.keys(ROLE_LABELS).forEach((roleKey) => {
        if (assignments[roleKey] && !roles.includes(roleKey)) {
            roles.push(roleKey);
        }
    });

    if ((order.assignedTailor || roles.length === 0) && !roles.includes('tailor')) {
        roles.push('tailor');
    }

    return roles;
};

const getInitials = (name = '') =>
    String(name)
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

function FilterSelect({ value, options, onChange, isOpen, onToggle }) {
    const selectedLabel = options.find(o => (typeof o === 'object' ? o.value : o) === value);
    const displayLabel = typeof selectedLabel === 'object' ? selectedLabel.label : selectedLabel;

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden transition-all shadow-sm">
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 flex justify-between items-center transition-colors hover:bg-slate-100"
            >
                <span className="truncate">{displayLabel || value}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="border-t border-slate-200 bg-white py-1 max-h-48 overflow-y-auto">
                    {options.map((opt) => {
                        const val = typeof opt === 'object' ? opt.value : opt;
                        const label = typeof opt === 'object' ? opt.label : opt;
                        const isSelected = value === val;

                        return (
                            <button
                                key={val}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(val);
                                }}
                                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors border-none ${isSelected ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

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
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [activeMobileMenu, setActiveMobileMenu] = useState(null);
    const statusTabs = ['All', 'For Approval', 'Pending', 'In Progress', 'Released', 'Completed', 'Overdue', 'Cancelled'];
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort by';
    const currentServiceTypeLabel = SERVICE_TYPE_OPTIONS.find(o => o.value === serviceTypeFilter)?.label || 'Service: All';
    const approvalTabs = [
        { label: 'All', value: 'All' },
        { label: 'For Approval', value: 'For Approval' },
        { label: 'Pending', value: 'Pending' },
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
                <div className="flex flex-row items-center gap-2 lg:gap-3 relative z-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search ID, name, service..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 rounded-2xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all w-full"
                        />
                    </div>

                    {/* Mobile Unified Filter Button */}
                    <div className="relative lg:hidden shrink-0">
                        <button
                            onClick={() => { setMobileFilterOpen(!mobileFilterOpen); setActiveMobileMenu(null); }}
                            className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer
                                ${mobileFilterOpen || filterStatus !== 'All' || sortOption !== 'date-newest' || serviceTypeFilter !== 'all'
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-gray-500 hover:bg-slate-50'
                                }`}
                        >
                            <Filter size={16} />
                        </button>

                        {mobileFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 z-[99] animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Sort By</label>
                                        <FilterSelect
                                            value={sortOption}
                                            isOpen={activeMobileMenu === 'sort'}
                                            onToggle={() => setActiveMobileMenu(activeMobileMenu === 'sort' ? null : 'sort')}
                                            onChange={(val) => { setSortOption(val); setActiveMobileMenu(null); }}
                                            options={SORT_OPTIONS}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Service</label>
                                        <FilterSelect
                                            value={serviceTypeFilter}
                                            isOpen={activeMobileMenu === 'service'}
                                            onToggle={() => setActiveMobileMenu(activeMobileMenu === 'service' ? null : 'service')}
                                            onChange={(val) => { setServiceTypeFilter(val); setActiveMobileMenu(null); }}
                                            options={SERVICE_TYPE_OPTIONS}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Status</label>
                                        <FilterSelect
                                            value={filterStatus}
                                            isOpen={activeMobileMenu === 'status'}
                                            onToggle={() => setActiveMobileMenu(activeMobileMenu === 'status' ? null : 'status')}
                                            onChange={(val) => { setFilterStatus(val); setActiveMobileMenu(null); }}
                                            options={['All', ...statusTabs.filter(t => t !== 'All')]}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Inline Filters */}
                    <div className="hidden lg:flex items-center gap-2 overflow-visible shrink-0">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowSort(v => !v);
                                    setShowServiceTypeSort(false);
                                    setIsFilterOpen(false);
                                }}
                                className="h-10 flex items-center justify-between gap-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-gray-600 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    <SlidersHorizontal size={14} className="text-blue-500" />
                                    <span className="max-w-[100px] truncate">{currentSortLabel}</span>
                                </div>
                                <ChevronDown size={12} className={`text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
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
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowServiceTypeSort(v => !v);
                                    setShowSort(false);
                                    setIsFilterOpen(false);
                                }}
                                className="h-10 flex items-center justify-between gap-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-gray-600 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Filter size={14} className="text-blue-500" />
                                    <span className="max-w-[120px] truncate">{currentServiceTypeLabel}</span>
                                </div>
                                <ChevronDown size={12} className={`text-gray-400 transition-transform ${showServiceTypeSort ? 'rotate-180' : ''}`} />
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
                                className={`h-10 px-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer gap-2
                                ${isFilterOpen || filterStatus !== 'All'
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-white border-slate-200 text-gray-600 hover:bg-slate-50'}`}
                            >
                                <SlidersHorizontal size={14} />
                                <span className="text-[11px] font-bold">Status</span>
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
                        const listAssignees = getVisibleAssignmentRoles(order)
                            .map((roleKey) => {
                                const assignedValue = roleKey === 'tailor'
                                    ? (assignments[orderId] || order.staffAssignments?.tailor || order.assignedTailor)
                                    : order.staffAssignments?.[roleKey];
                                const employee = assignedValue
                                    ? EMPLOYEE_POOL.find(e => [e.id, e.name, e.fullName].includes(assignedValue))
                                    : null;

                                return {
                                    roleKey,
                                    label: ROLE_LABELS[roleKey],
                                    name: employee?.name || employee?.fullName || assignedValue || '',
                                };
                            })
                            .filter((assignee) => assignee.name);
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

                                    {listAssignees.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                            {listAssignees.map((assignee) => (
                                                <div
                                                    key={`${orderId}-${assignee.roleKey}`}
                                                    className="flex max-w-full items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2 py-1"
                                                    title={`${assignee.label}: ${assignee.name}`}
                                                >
                                                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[8px] font-black text-blue-600 shrink-0">
                                                        {getInitials(assignee.name)}
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-wide text-blue-500 shrink-0">
                                                        {assignee.label}
                                                    </span>
                                                    <span className="max-w-[120px] truncate text-[10px] font-semibold text-blue-700">
                                                        {assignee.name}
                                                    </span>
                                                </div>
                                            ))}
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
