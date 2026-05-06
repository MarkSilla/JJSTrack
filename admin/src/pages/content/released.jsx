import React, { useEffect, useMemo, useState } from 'react';
import {
    Archive,
    ArrowUpDown,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    DollarSign,
    Download,
    Package,
    RefreshCw,
    Search,
    Shirt,
    SlidersHorizontal,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { bookingApi } from '../../services/bookingApi.js';
import { orderApi } from '../../services/orderApi.js';
import OrderRecordDetail from './OrderRecordDetail.jsx';
import { buildReleasedRecords } from './orderRecordUtils.js';
import { exportReleasedToPDF } from '../../components/Export.js';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest to Oldest' },
    { value: 'oldest', label: 'Oldest to Newest' },
    { value: 'name-az', label: 'Name A to Z' },
    { value: 'name-za', label: 'Name Z to A' },
];

function TypeBadge({ typeKey }) {
    if (typeKey === 'jersey') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Shirt size={11} />
                Jersey
            </span>
        );
    }

    if (typeKey === 'organizational') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Users size={11} />
                Org
            </span>
        );
    }

    if (typeKey === 'repair') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Wrench size={11} />
                Repair
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <Package size={11} />
            Service
        </span>
    );
}

function PayBadge({ status }) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'paid') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={10} />
                Paid
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <X size={10} />
            Unpaid
        </span>
    );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
    const colors = {
        blue: { accent: '#3B82F6', bgAccent: '#EFF6FF' },
        green: { accent: '#059669', bgAccent: '#ECFDF5' },
        amber: { accent: '#F59E0B', bgAccent: '#FFFBEB' },
        violet: { accent: '#7C3AED', bgAccent: '#F5F3FF' },
    };
    const palette = colors[color] || colors.blue;

    return (
        <div
            className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: palette.accent }} />
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: palette.bgAccent }}>
                        <Icon size={16} color={palette.accent} strokeWidth={2.2} />
                    </div>
                    <span className="text-[12px] font-semibold text-gray-500">{label}</span>
                </div>
            </div>
            <div className="mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">{value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
        </div>
    );
}

function ArchiveConfirmModal({ record, onConfirm, onCancel, isSubmitting }) {
    if (!record) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Archive Released Record</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            This released record will be removed from the active released list and moved to Archives.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-transparent border-none cursor-pointer ml-2"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 bg-gray-50 space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-700">Record ID: <span className="font-bold">{record.displayId}</span></p>
                        <p className="text-xs font-semibold text-amber-700 mt-1">Customer: <span className="font-bold">{record.customerName}</span></p>
                    </div>
                </div>

                <div className="p-6 flex gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                    >
                        Keep Active
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                    >
                        {isSubmitting ? 'Archiving...' : 'Archive'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ReleasedItems() {
    const [searchQuery, setSearchQuery] = useState('');
    const [releasedItems, setReleasedItems] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [showSort, setShowSort] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const fetchReleasedItems = async () => {
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

            setReleasedItems(buildReleasedRecords({ bookings, orders }));
        } catch (error) {
            console.error('Failed to fetch released records:', error);
            setReleasedItems([]);
        }
    };

    useEffect(() => {
        fetchReleasedItems();
        const intervalId = window.setInterval(fetchReleasedItems, 5000);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!selectedRecord) return;

        const nextRecord = releasedItems.find((item) => item.id === selectedRecord.id);
        if (nextRecord) {
            setSelectedRecord(nextRecord);
        } else {
            setSelectedRecord(null);
        }
    }, [releasedItems, selectedRecord]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchReleasedItems();
        setIsRefreshing(false);
    };

    const handleExportPDF = () => {
        exportReleasedToPDF({
            records: filteredItems,
            totalRevenue,
            paidCount,
        });
    };

    const totalRevenue = useMemo(
        () => releasedItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0),
        [releasedItems]
    );

    const paidCount = useMemo(
        () => releasedItems.filter((item) => item.payStatus?.toLowerCase() === 'paid').length,
        [releasedItems]
    );

    const filteredItems = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        let items = normalizedQuery
            ? releasedItems.filter((item) => item.searchText.includes(normalizedQuery))
            : [...releasedItems];

        if (sortBy === 'newest') {
            items.sort((a, b) => new Date(b.releaseDateRaw || b.createdAt || 0) - new Date(a.releaseDateRaw || a.createdAt || 0));
        } else if (sortBy === 'oldest') {
            items.sort((a, b) => new Date(a.releaseDateRaw || a.createdAt || 0) - new Date(b.releaseDateRaw || b.createdAt || 0));
        } else if (sortBy === 'name-az') {
            items.sort((a, b) => a.headline.localeCompare(b.headline));
        } else if (sortBy === 'name-za') {
            items.sort((a, b) => b.headline.localeCompare(a.headline));
        }

        return items;
    }, [releasedItems, searchQuery, sortBy]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label;

    const confirmArchive = async () => {
        if (!archiveTarget) return;

        try {
            setArchiveLoading(true);

            if (archiveTarget.isBooking) {
                await bookingApi.archiveBooking(archiveTarget.id);
            } else {
                await orderApi.archiveOrder(archiveTarget.id);
            }

            toast.success('Record archived successfully.');
            setArchiveTarget(null);
            setSelectedRecord(null);
            await fetchReleasedItems();
        } catch (error) {
            console.error('Failed to archive released record:', error);
            toast.error('Failed to archive record. Please try again.');
        } finally {
            setArchiveLoading(false);
        }
    };

    if (selectedRecord) {
        return (
            <>
                <div className="font-[inter] px-4 lg:px-6 pt-5">
                    <OrderRecordDetail
                        record={selectedRecord}
                        mode="released"
                        onBack={() => setSelectedRecord(null)}
                        onArchive={() => setArchiveTarget(selectedRecord)}
                        isArchiving={archiveLoading && archiveTarget?.id === selectedRecord.id}
                    />
                </div>
                <ArchiveConfirmModal
                    record={archiveTarget}
                    onConfirm={confirmArchive}
                    onCancel={() => !archiveLoading && setArchiveTarget(null)}
                    isSubmitting={archiveLoading}
                />
            </>
        );
    }

    return (
        <>
            <div className="font-[inter] min-h-screen flex flex-col overflow-x-hidden">
                <div className="shrink-0 px-4 lg:px-6 pt-5 pb-4 border-b border-slate-200 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <StatCard icon={CheckCircle2} label="Total Released" value={releasedItems.length} sub="active records" color="blue" />
                        <StatCard icon={CreditCard} label="Paid" value={paidCount} sub={`of ${releasedItems.length}`} color="green" />
                        <StatCard icon={DollarSign} label="Revenue" value={totalRevenue > 0 ? `P${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'} sub="released value" color="violet" />
                        <StatCard icon={ArrowUpDown} label="Showing" value={filteredItems.length} sub="filtered rows" color="amber" />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 flex flex-col gap-3 min-h-0">
                    {releasedItems.length === 0 && !isRefreshing && (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 text-center p-12">
                            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                <Package size={28} className="text-blue-300" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 mb-1">No Released Records Yet</h3>
                            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                                Orders and bookings will appear here once they are scanned and marked as released.
                            </p>
                        </div>
                    )}

                    {releasedItems.length > 0 && (
                        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible min-h-0">
                            <div className="shrink-0 flex flex-col gap-3 px-4 sm:px-5 py-3 border-b border-slate-100 bg-blue-50/60">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-tight">Released Records</span>
                                        <span className="bg-blue-100 text-blue-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                                            {filteredItems.length} shown
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="sm:hidden flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-lg transition-all cursor-pointer border-none shadow-sm"
                                        >
                                            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="sm:hidden flex items-center justify-center w-8 h-8 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-all cursor-pointer border-none shadow-sm"
                                        >
                                            <Download size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                        <input
                                            type="text"
                                            placeholder="Search ID, customer, service..."
                                            value={searchQuery}
                                            onChange={(event) => setSearchQuery(event.target.value)}
                                            className="bg-white border border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 rounded-xl py-2.5 sm:py-1.5 pl-10 sm:pl-9 pr-3 text-xs font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all w-full"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1 sm:flex-none">
                                            <button
                                                onClick={() => setShowSort((value) => !value)}
                                                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-gray-600 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <SlidersHorizontal size={12} className="text-blue-400" />
                                                    <span className="truncate max-w-[100px]">{currentSortLabel}</span>
                                                </div>
                                                <ChevronDown size={11} className={`text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                                            </button>
                                            {showSort && (
                                                <div className="absolute left-0 sm:right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden w-48 sm:w-44">
                                                    {SORT_OPTIONS.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => {
                                                                setSortBy(option.value);
                                                                setShowSort(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none ${sortBy === option.value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-slate-50'}`}
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
                                            className="hidden sm:flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer border-none shadow-sm shadow-blue-200"
                                        >
                                            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                                            <span>Refresh</span>
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="hidden sm:flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer border-none shadow-sm"
                                        >
                                            <Download size={12} />
                                            <span>Export</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-12">
                                    <p className="text-xs text-gray-400 font-medium">No released records match your search.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="md:hidden overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                        {paginatedItems.map((item) => (
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
                                                        <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-blue-100">
                                                            {item.entityLabel}
                                                        </span>
                                                        <PayBadge status={item.payStatus} />
                                                    </div>
                                                </div>

                                                <h3 className="text-[15px] font-bold text-slate-900 mb-1">{item.headline}</h3>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <TypeBadge typeKey={item.typeKey} />
                                                    <span className="text-[11px] text-slate-500 font-medium truncate">
                                                        {item.secondaryLabel}
                                                    </span>
                                                </div>

                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                            Released <span className="text-blue-600">{item.releaseDate}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                            By <span className="text-slate-600">{item.releasedBy}</span>
                                                        </span>
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
                                    <div className="hidden md:block overflow-auto table-scroll min-h-0">
                                        <table className="w-full text-left border-collapse" style={{ minWidth: 940 }}>
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    {['No.', 'ID', 'Record', 'Drop Date', 'Released Date', 'Released By', 'Pay Status', 'Amount', 'Type'].map((header) => (
                                                        <th key={header} className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedItems.map((item, index) => {
                                                    const displayIndex = startIndex + index + 1;
                                                    return (
                                                        <tr
                                                            key={`${item.entityType}-${item.id}`}
                                                            onClick={() => setSelectedRecord(item)}
                                                            className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer"
                                                        >
                                                            <td className="py-3 px-4">
                                                                <span className="text-[11px] font-bold text-gray-400 tabular-nums">{displayIndex}</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="inline-block max-w-[180px] truncate text-[11px] font-bold font-mono text-gray-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider align-middle">
                                                                    {item.displayId}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <p className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[220px]">{item.headline}</p>
                                                                <p className="text-[11px] text-gray-400 truncate max-w-[220px] mt-1">{item.secondaryLabel}</p>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{item.dropDate}</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">{item.releaseDate}</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{item.releasedBy}</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <PayBadge status={item.payStatus} />
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
                                                                <div className="flex items-center gap-2">
                                                                    <TypeBadge typeKey={item.typeKey} />
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.entityLabel}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {filteredItems.length > 0 && (
                                <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all cursor-pointer bg-white"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {[...Array(totalPages)].map((_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-all cursor-pointer border ${currentPage === pageNum
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all cursor-pointer bg-white"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    <div className="text-[11px] font-medium text-slate-400">
                                        Showing <span className="text-slate-700 font-bold">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)}</span> of <span className="text-slate-700 font-bold">{filteredItems.length}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="shrink-0 flex items-start gap-2 px-1">
                        <Archive size={14} className="text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-[12px] text-gray-500 leading-relaxed">
                            Released records are locked and cannot be edited. Use Archive if the item no longer needs to stay in the active release queue.
                        </p>
                    </div>
                </div>
            </div>

            <ArchiveConfirmModal
                record={archiveTarget}
                onConfirm={confirmArchive}
                onCancel={() => !archiveLoading && setArchiveTarget(null)}
                isSubmitting={archiveLoading}
            />
        </>
    );
}
