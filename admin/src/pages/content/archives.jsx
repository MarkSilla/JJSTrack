import React, { useEffect, useMemo, useState } from 'react';
import {
    Archive,
    ArrowUpDown,
    CheckCircle2,
    ChevronDown,
    FolderArchive,
    Package,
    RefreshCw,
    RotateCcw,
    Search,
    SlidersHorizontal,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { bookingApi } from '../../services/bookingApi.js';
import { orderApi } from '../../services/orderApi.js';
import OrderRecordDetail from './OrderRecordDetail.jsx';
import { buildArchivedRecords } from './orderRecordUtils.js';
import { StatCard as SharedStatCard, EmptyState } from '../../components/ui';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest to Oldest' },
    { value: 'oldest', label: 'Oldest to Newest' },
    { value: 'name-az', label: 'Name A to Z' },
    { value: 'name-za', label: 'Name Z to A' },
];

const STATUS_OPTIONS = ['All', 'Released', 'Cancelled'];

function StatCard({ icon, label, value, sub, color }) {
    const colorMap = {
        amber: '#D97706',
        blue: '#2563EB',
        rose: '#E11D48',
        slate: '#475569',
    };
    return (
        <SharedStatCard
            icon={icon}
            label={label}
            value={value}
            sub={sub}
            accentColor={colorMap[color] || '#D97706'}
        />
    );
}


function StatusBadge({ status }) {
    if (status === 'Cancelled') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <XCircle size={11} />
                Cancelled
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={11} />
            Released
        </span>
    );
}

function RestoreConfirmModal({ record, onConfirm, onCancel, isSubmitting }) {
    if (!record) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Restore Archived Record</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            This record will be removed from Archives and returned to active admin lists.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-transparent border-none cursor-pointer ml-2"
                    >
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="p-6 bg-gray-50 space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-emerald-700">Record ID: <span className="font-bold">{record.displayId}</span></p>
                        <p className="text-xs font-semibold text-emerald-700 mt-1">Customer: <span className="font-bold">{record.customerName}</span></p>
                    </div>
                </div>

                <div className="p-6 flex gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                    >
                        Keep Archived
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                    >
                        {isSubmitting ? 'Restoring...' : 'Restore'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ArchivedItems() {
    const [searchQuery, setSearchQuery] = useState('');
    const [archivedItems, setArchivedItems] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showSort, setShowSort] = useState(false);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const fetchArchivedItems = async () => {
        try {
            const [bookingsRes, ordersRes] = await Promise.allSettled([
                bookingApi.getAllBookings(),
                orderApi.getAllOrders(),
            ]);

            const bookings = bookingsRes.status === 'fulfilled'
                ? bookingsRes.value?.bookings || bookingsRes.value?.data || []
                : [];
            const orders = ordersRes.status === 'fulfilled'
                ? ordersRes.value?.orders || ordersRes.value?.data || []
                : [];

            setArchivedItems(buildArchivedRecords({ bookings, orders }));
        } catch (error) {
            console.error('Failed to fetch archived records:', error);
            setArchivedItems([]);
        }
    };

    useEffect(() => {
        fetchArchivedItems();
        const intervalId = window.setInterval(fetchArchivedItems, 5000);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!selectedRecord) return;

        const nextRecord = archivedItems.find((item) => item.id === selectedRecord.id);
        if (nextRecord) {
            setSelectedRecord(nextRecord);
        } else {
            setSelectedRecord(null);
        }
    }, [archivedItems, selectedRecord]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchArchivedItems();
        setIsRefreshing(false);
    };

    const filteredItems = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        let items = normalizedQuery
            ? archivedItems.filter((item) => item.searchText.includes(normalizedQuery))
            : [...archivedItems];

        if (statusFilter !== 'All') {
            items = items.filter((item) => item.sourceStatus === statusFilter);
        }

        if (sortBy === 'newest') {
            items.sort((a, b) => new Date(b.archiveDateRaw || b.updatedAt || 0) - new Date(a.archiveDateRaw || a.updatedAt || 0));
        } else if (sortBy === 'oldest') {
            items.sort((a, b) => new Date(a.archiveDateRaw || a.updatedAt || 0) - new Date(b.archiveDateRaw || b.updatedAt || 0));
        } else if (sortBy === 'name-az') {
            items.sort((a, b) => a.headline.localeCompare(b.headline));
        } else if (sortBy === 'name-za') {
            items.sort((a, b) => b.headline.localeCompare(a.headline));
        }

        return items;
    }, [archivedItems, searchQuery, sortBy, statusFilter]);

    const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label;

    const releasedCount = useMemo(
        () => archivedItems.filter((item) => item.sourceStatus === 'Released').length,
        [archivedItems]
    );

    const cancelledCount = useMemo(
        () => archivedItems.filter((item) => item.sourceStatus === 'Cancelled').length,
        [archivedItems]
    );

    const confirmRestore = async () => {
        if (!restoreTarget) return;

        try {
            setRestoreLoading(true);

            if (restoreTarget.isBooking) {
                await bookingApi.unarchiveBooking(restoreTarget.id);
            } else {
                await orderApi.unarchiveOrder(restoreTarget.id);
            }

            toast.success('Record restored successfully.');
            setRestoreTarget(null);
            setSelectedRecord(null);
            await fetchArchivedItems();
        } catch (error) {
            console.error('Failed to restore archived record:', error);
            toast.error('Failed to restore record. Please try again.');
        } finally {
            setRestoreLoading(false);
        }
    };

    if (selectedRecord) {
        return (
            <>
                <div className="font-[inter] h-screen flex flex-col overflow-auto px-4 lg:px-6 pt-5">
                    <OrderRecordDetail
                        record={selectedRecord}
                        mode="archived"
                        onBack={() => setSelectedRecord(null)}
                    />
                </div>
                <RestoreConfirmModal
                    record={restoreTarget}
                    onConfirm={confirmRestore}
                    onCancel={() => !restoreLoading && setRestoreTarget(null)}
                    isSubmitting={restoreLoading}
                />
            </>
        );
    }

    return (
        <div className="font-[inter] flex flex-col overflow-x-hidden">
            <div className="shrink-0 px-4 lg:px-6 pt-5 pb-4space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <StatCard icon={FolderArchive} label="Total Archived" value={archivedItems.length} sub="historical records" color="amber" />
                    <StatCard icon={CheckCircle2} label="Released" value={releasedCount} sub="archived releases" color="blue" />
                    <StatCard icon={XCircle} label="Cancelled" value={cancelledCount} sub="archived cancellations" color="rose" />
                    <StatCard icon={ArrowUpDown} label="Showing" value={filteredItems.length} sub="filtered rows" color="slate" />
                </div>
            </div>

            <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 flex flex-col gap-3 min-h-0">
                {archivedItems.length === 0 && !isRefreshing && (
                    <EmptyState
                        icon={Archive}
                        title="No Archived Records Yet"
                        description="Completed, released, or cancelled bookings archived by administration will automatically be preserved here."
                    />
                )}

                {archivedItems.length > 0 && (
                    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible min-h-0">
                        <div className="shrink-0 flex flex-col gap-3 px-4 sm:px-5 py-3 border-b border-slate-100 bg-amber-50/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-tight">Archived Records</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                    <input
                                        type="text"
                                        placeholder="Search ID, customer, service..."
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        className="bg-white border border-slate-200 focus:border-amber-300 focus:ring-4 focus:ring-amber-500/5 rounded-xl py-2.5 sm:py-1.5 pl-10 sm:pl-9 pr-3 text-xs font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all w-full h-[38px] sm:h-auto"
                                    />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSort((value) => !value)}
                                            className="flex items-center justify-center sm:justify-start gap-1.5 w-[38px] h-[38px] sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-gray-600 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <SlidersHorizontal size={14} className="text-amber-500 sm:w-3 sm:h-3" />
                                                <span className="hidden sm:inline truncate max-w-[100px]">{currentSortLabel}</span>
                                            </div>
                                            <ChevronDown size={11} className={`hidden sm:block text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showSort && (
                                            <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden w-48 sm:w-44">
                                                {SORT_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setSortBy(option.value);
                                                            setShowSort(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none ${sortBy === option.value ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-slate-50'}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="flex items-center justify-center gap-1.5 w-[38px] h-[38px] sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold rounded-xl sm:rounded-lg transition-all cursor-pointer border-none shadow-sm shadow-amber-200"
                                    >
                                        <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''} sm:w-3 sm:h-3`} />
                                        <span className="hidden sm:inline">Refresh</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <p className="text-xs text-gray-400 font-medium">No archived records match the current filters.</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="md:hidden max-h-[636px] overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                    {filteredItems.map((item) => (
                                        <div
                                            key={`${item.entityType}-${item.id}`}
                                            onClick={() => setSelectedRecord(item)}
                                            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active:scale-[0.98] transition-transform"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                    {item.displayId}
                                                </span>
                                                <div className="flex gap-1.5">
                                                    <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-amber-100">
                                                        {item.entityLabel}
                                                    </span>
                                                    <StatusBadge status={item.sourceStatus} />
                                                </div>
                                            </div>

                                            <h3 className="text-[15px] font-bold text-slate-900 mb-1">{item.headline}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium mb-4 truncate">
                                                {item.secondaryLabel}
                                            </p>

                                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                            Archived <span className="text-amber-600">{item.archiveDate}</span>
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setRestoreTarget(item);
                                                        }}
                                                        disabled={restoreLoading}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 font-bold px-2 py-1 text-[9px] transition-colors border border-emerald-200 cursor-pointer uppercase"
                                                    >
                                                        <RotateCcw size={10} />
                                                        Restore
                                                    </button>
                                                </div>
                                                {item.totalPrice != null && (
                                                    <span className="text-[14px] font-black text-slate-900">
                                                        P{item.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block flex-1 max-h-[420px] overflow-auto table-scroll min-h-0">
                                    <table className="w-full text-left border-collapse" style={{ minWidth: 940 }}>
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                {['No.', 'ID', 'Record', 'Final Status', 'Archived Date', 'Kind', 'Amount', 'Action'].map((header) => (
                                                    <th key={header} className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((item, index) => (
                                                <tr
                                                    key={`${item.entityType}-${item.id}`}
                                                    onClick={() => setSelectedRecord(item)}
                                                    className="border-b border-slate-100 hover:bg-amber-50/40 transition-colors cursor-pointer"
                                                >
                                                    <td className="py-3 px-4">
                                                        <span className="text-[11px] font-bold text-gray-400 tabular-nums">{index + 1}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-block max-w-[180px] truncate text-[11px] font-bold font-mono text-gray-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider align-middle">
                                                            {item.displayId}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[220px]">{item.headline}</p>
                                                        <p className="text-[11px] text-gray-400 truncate max-w-[220px] mt-1">{item.secondaryLabel}</p>
                                                        {item.archivedBy && (
                                                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mt-1">
                                                                Archived by {item.archivedBy}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <StatusBadge status={item.sourceStatus} />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">{item.archiveDate}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.entityLabel}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {item.totalPrice != null ? (
                                                            <span className="text-sm font-bold text-gray-800 tabular-nums">
                                                                P{item.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setRestoreTarget(item);
                                                            }}
                                                            disabled={restoreLoading}
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 font-bold px-3 py-2 text-[11px] transition-colors border border-emerald-200 cursor-pointer"
                                                        >
                                                            <RotateCcw size={12} />
                                                            Restore
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="shrink-0 flex items-start gap-2 px-1">
                    <Archive size={12} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        Archives are intended for released and cancelled records that should no longer stay in active admin queues.
                    </p>
                </div>
            </div>

            <RestoreConfirmModal
                record={restoreTarget}
                onConfirm={confirmRestore}
                onCancel={() => !restoreLoading && setRestoreTarget(null)}
                isSubmitting={restoreLoading}
            />
        </div>
    );
}
