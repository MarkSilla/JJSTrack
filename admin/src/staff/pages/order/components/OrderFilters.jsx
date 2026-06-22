import React, { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal, ChevronDown, RefreshCw } from 'lucide-react';

const STATUS_TABS = ['All', 'Pending', 'Overdue', 'Over Capacity', 'In Progress', 'Completed', 'Released'];

const SORT_OPTIONS = [
    { value: 'date-newest', label: 'Date: Newest' },
    { value: 'date-oldest', label: 'Date: Oldest' },
];

const OrderFilters = ({
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    isFilterOpen,
    setIsFilterOpen,
    counts,
    sortOption,
    setSortOption,
    onRefresh,
    isRefreshing,
}) => {
    const [showSort, setShowSort] = useState(false);
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort by';

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-4 mb-4">
            <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl py-2.5 pl-9 pr-9 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 p-0.5"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Refresh Button */}
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 shrink-0"
                    title="Refresh Orders"
                >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                </button>

                {/* Unified Filter Menu */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all relative ${isFilterOpen || filterStatus !== 'All' || sortOption !== 'date-newest'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        title="Filters & Sorting"
                    >
                        <Filter size={18} />
                        {(filterStatus !== 'All' || sortOption !== 'date-newest') && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                        )}
                    </button>

                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 shadow-2xl rounded-2xl p-5 z-[1000] animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Filter & Sort</h3>
                                {(filterStatus !== 'All' || sortOption !== 'date-newest') && (
                                    <button
                                        onClick={() => {
                                            setFilterStatus('All');
                                            setSortOption('date-newest');
                                        }}
                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-tight"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Sort By</label>
                                    <div className="relative">
                                        <select
                                            value={sortOption}
                                            onChange={(e) => setSortOption(e.target.value)}
                                            className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-blue-200 transition-all cursor-pointer"
                                        >
                                            {SORT_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Status</label>
                                    <div className="relative">
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-blue-200 transition-all cursor-pointer"
                                        >
                                            {STATUS_TABS.map(tab => (
                                                <option key={tab} value={tab}>{tab} ({counts[tab] ?? 0})</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderFilters;
