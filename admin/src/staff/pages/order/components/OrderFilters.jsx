import React, { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal, ChevronDown } from 'lucide-react';

const STATUS_TABS = ['All', 'Pending', 'Overdue', 'In Progress', 'Completed', 'Released'];

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
}) => {
    const [showSort, setShowSort] = useState(false);
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort by';
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 bg-transparent border-none cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowSort(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-semibold text-gray-600 transition-all cursor-pointer"
                    >
                        <SlidersHorizontal size={13} className="text-blue-400" />
                        <span className="hidden sm:inline max-w-[110px] truncate">{currentSortLabel}</span>
                        <ChevronDown size={12} className={`text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                    </button>
                    {showSort && (
                        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden w-44">
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
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer
                            ${isFilterOpen || filterStatus !== 'All'
                                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                                : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Filter size={18} />
                        <span className="text-xs font-bold hidden sm:inline">{filterStatus}</span>
                        {filterStatus !== 'All' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full" />
                        )}
                    </button>
                    {isFilterOpen && (
                        <div className="absolute right-0 top-12 w-64 bg-white border border-gray-100 shadow-xl rounded-2xl p-4 z-50">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Filter by Status</h3>
                                <button
                                    onClick={() => { setFilterStatus('All'); setIsFilterOpen(false); }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter bg-transparent border-none cursor-pointer"
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {STATUS_TABS.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => { setFilterStatus(tab); setIsFilterOpen(false); }}
                                        className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-between cursor-pointer
                                            ${filterStatus === tab
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'}`}
                                    >
                                        {tab}
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${filterStatus === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {counts[tab] ?? 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderFilters;
