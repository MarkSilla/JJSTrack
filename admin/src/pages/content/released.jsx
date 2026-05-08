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

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const tokens = {
    blue: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', accent: '#3B82F6' },
    green: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', accent: '#10B981' },
    violet: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', accent: '#7C3AED' },
    amber: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', accent: '#F59E0B' },
    slate: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', accent: '#94A3B8' },
    rose: { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3', accent: '#F43F5E' },
};

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest to Oldest' },
    { value: 'oldest', label: 'Oldest to Newest' },
    { value: 'name-az', label: 'Name A → Z' },
    { value: 'name-za', label: 'Name Z → A' },
];

const formatDisplayId = (id) => {
    if (!id) return '';
    const parts = id.split('-');
    if (parts.length > 1) return `ORD-${parts[parts.length - 1].slice(-5)}`;
    return id;
};

/* ─── TypeBadge ─────────────────────────────────────────────────────────── */
function TypeBadge({ typeKey }) {
    const configs = {
        jersey: { icon: Shirt, label: 'Jersey', ...tokens.blue },
        organizational: { icon: Users, label: 'Org', ...tokens.violet },
        repair: { icon: Wrench, label: 'Repair', ...tokens.amber },
    };
    const cfg = configs[typeKey] || { icon: Package, label: 'Service', ...tokens.slate };
    const Icon = cfg.icon;
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
            style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
            <Icon size={10} />
            {cfg.label}
        </span>
    );
}

/* ─── PayBadge ──────────────────────────────────────────────────────────── */
function PayBadge({ status }) {
    const normalized = String(status || '').toLowerCase();
    const isPaid = normalized === 'paid';
    const t = isPaid ? tokens.green : tokens.rose;
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
            style={{ background: t.bg, color: t.text, borderColor: t.border }}
        >
            {isPaid ? <CheckCircle2 size={10} /> : <X size={10} />}
            {isPaid ? 'Paid' : 'Unpaid'}
        </span>
    );
}

/* ─── StatCard ──────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color }) {
    const t = tokens[color] || tokens.blue;
    return (
        <div
            className="bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
            <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: t.accent }} />
            <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: t.bg }}>
                        <Icon size={13} color={t.text} strokeWidth={2.5} className="sm:hidden" />
                        <Icon size={16} color={t.text} strokeWidth={2.2} className="hidden sm:block" />
                    </div>
                    <span className="text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">{label}</span>
                </div>
            </div>
            <div className="mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] font-black sm:font-extrabold text-gray-900 leading-none tracking-tight pl-[36px] sm:pl-[45px] text-left">{value}</div>
            <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[36px] sm:pl-[45px] opacity-80 sm:opacity-100">{sub}</div>
        </div>
    );
}


/* ─── ArchiveConfirmModal ───────────────────────────────────────────────── */
function ArchiveConfirmModal({ record, onConfirm, onCancel, isSubmitting }) {
    if (!record) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                style={{ border: '1px solid #E2E8F0' }}
            >
                <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Archive Released Record</h2>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            This released record will be removed from the active released list and moved to Archives.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-transparent border-none cursor-pointer shrink-0 mt-0.5"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 bg-gray-50">
                    <div
                        className="rounded-xl p-3.5"
                        style={{ background: tokens.amber.bg, border: `1px solid ${tokens.amber.border}` }}
                    >
                        <p className="text-xs font-semibold" style={{ color: tokens.amber.text }}>
                            Record ID: <span className="font-black">{record.displayId}</span>
                        </p>
                        <p className="text-xs font-semibold mt-1" style={{ color: tokens.amber.text }}>
                            Customer: <span className="font-black">{record.customerName}</span>
                        </p>
                    </div>
                </div>
                <div className="p-5 flex gap-2.5 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl transition-colors border-none cursor-pointer"
                    >
                        Keep Active
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-colors border-none cursor-pointer"
                        style={{ background: isSubmitting ? tokens.amber.accent + 'AA' : tokens.amber.accent }}
                    >
                        {isSubmitting ? 'Archiving...' : 'Archive'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── MobileCard ────────────────────────────────────────────────────────── */
function MobileCard({ item, index, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl active:scale-[0.985] transition-transform cursor-pointer"
            style={{ border: '1px solid #E8EFFE', boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
            {/* Card header */}
            <div
                className="flex items-center justify-between px-4 pt-4 pb-3"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-black font-mono text-slate-400 tracking-widest bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg shrink-0">
                        {formatDisplayId(item.displayId)}
                    </span>
                    <TypeBadge typeKey={item.typeKey} />
                </div>
                <PayBadge status={item.payStatus} />
            </div>

            {/* Name + secondary */}
            <div className="px-4 pb-3">
                <h3 className="text-[15px] font-bold text-slate-900 leading-snug truncate">{item.headline}</h3>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{item.secondaryLabel}</p>
            </div>

            {/* Footer row */}
            <div
                className="flex items-center justify-between px-4 py-3 rounded-b-2xl"
                style={{ background: '#F8FAFF', borderTop: '1px solid #EEF2FF' }}
            >
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-[10px] text-slate-400 font-semibold">
                            Released <span className="text-blue-600 font-bold">{item.releaseDate}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-[10px] text-slate-400 font-semibold truncate">
                            Drop <span className="text-slate-600 font-bold">{item.dropDate}</span>
                            <span className="mx-1 text-slate-300">·</span>
                            By <span className="text-slate-600 font-bold">{item.releasedBy}</span>
                        </span>
                    </div>
                </div>
                {item.totalPrice != null && (
                    <span className="text-[15px] font-black text-slate-900 tabular-nums shrink-0 ml-2">
                        ₱{item.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
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

    /* ── fetch ── */
    const fetchReleasedItems = async () => {
        try {
            const [bookingsRes, ordersRes] = await Promise.allSettled([
                bookingApi.getAllBookings(),
                orderApi.getAllOrders(),
            ]);
            const bookings = bookingsRes.status === 'fulfilled'
                ? bookingsRes.value?.bookings || bookingsRes.value?.data || [] : [];
            const orders = ordersRes.status === 'fulfilled'
                ? ordersRes.value?.orders || ordersRes.value?.data || [] : [];
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
        setSelectedRecord(nextRecord ?? null);
    }, [releasedItems, selectedRecord]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchReleasedItems();
        setIsRefreshing(false);
    };

    const handleExportPDF = () => {
        exportReleasedToPDF({ records: filteredItems, totalRevenue, paidCount });
    };

    /* ── derived ── */
    const totalRevenue = useMemo(
        () => releasedItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0),
        [releasedItems]
    );
    const paidCount = useMemo(
        () => releasedItems.filter((item) => item.payStatus?.toLowerCase() === 'paid').length,
        [releasedItems]
    );

    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let items = q ? releasedItems.filter((item) => item.searchText.includes(q)) : [...releasedItems];
        if (sortBy === 'newest') items.sort((a, b) => new Date(b.releaseDateRaw || b.createdAt || 0) - new Date(a.releaseDateRaw || a.createdAt || 0));
        else if (sortBy === 'oldest') items.sort((a, b) => new Date(a.releaseDateRaw || a.createdAt || 0) - new Date(b.releaseDateRaw || b.createdAt || 0));
        else if (sortBy === 'name-az') items.sort((a, b) => a.headline.localeCompare(b.headline));
        else if (sortBy === 'name-za') items.sort((a, b) => b.headline.localeCompare(a.headline));
        return items;
    }, [releasedItems, searchQuery, sortBy]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, sortBy]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);
    const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label;

    /* ── archive ── */
    const confirmArchive = async () => {
        if (!archiveTarget) return;
        try {
            setArchiveLoading(true);
            if (archiveTarget.isBooking) await bookingApi.archiveBooking(archiveTarget.id);
            else await orderApi.archiveOrder(archiveTarget.id);
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

    /* ── detail view ── */
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

    /* ── page numbers helper ── */
    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = new Set([1, totalPages, currentPage]);
        if (currentPage > 1) pages.add(currentPage - 1);
        if (currentPage < totalPages) pages.add(currentPage + 1);
        return [...pages].sort((a, b) => a - b);
    };
    const pageNumbers = getPageNumbers();

    /* ══════════════════════════════════════════════════════════════════════ */
    return (
        <>
            <div
                className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full"
                style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", }}
            >
                {/* ── Page header ── */}
                <div className="shrink-0 px-4 sm:px-5 lg:px-7 pt-6 pb-4">

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                        <StatCard icon={CheckCircle2} label="Total Released" value={releasedItems.length} sub="active records" color="blue" />
                        <StatCard icon={CreditCard} label="Paid" value={paidCount} sub={`of ${releasedItems.length}`} color="green" />
                        <StatCard
                            icon={DollarSign}
                            label="Revenue"
                            value={totalRevenue > 0
                                ? `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : 'N/A'}
                            sub="released value"
                            color="violet"
                        />
                        <StatCard icon={ArrowUpDown} label="Showing" value={filteredItems.length} sub="filtered rows" color="amber" />
                    </div>
                </div>

                {/* ── Main content ── */}
                <div className="flex-1 px-4 sm:px-5 lg:px-7 pb-6 flex flex-col gap-4 min-h-0 min-w-0 w-full max-w-full overflow-x-hidden">

                    {/* Empty state */}
                    {releasedItems.length === 0 && !isRefreshing && (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl text-center p-12" style={{ border: '1px solid #E2E8F0' }}>
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: tokens.blue.bg, border: `1px solid ${tokens.blue.border}` }}
                            >
                                <Package size={28} color={tokens.blue.accent} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 mb-1">No Released Records Yet</h3>
                            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                                Orders and bookings will appear here once they are scanned and marked as released.
                            </p>
                        </div>
                    )}

                    {releasedItems.length > 0 && (
                        <div
                            className="flex flex-col bg-white rounded-2xl overflow-hidden min-h-0 min-w-0 w-full max-w-full"
                            style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                        >
                            {/* ── Toolbar ── */}
                            <div
                                className="shrink-0 flex flex-col gap-3 px-4 sm:px-5 py-3.5"
                                style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)', borderBottom: '1px solid #DBEAFE' }}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Released Records</span>

                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Search */}
                                    <div className="relative flex-1 min-w-0">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                                        <input
                                            type="text"
                                            placeholder="Search ID, customer..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white rounded-xl py-2.5 sm:py-2 pl-9 pr-3 text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all"
                                            style={{ border: '1.5px solid #E2E8F0', height: 38 }}
                                            onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Sort */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSort((v) => !v)}
                                                title={currentSortLabel}
                                                className="flex items-center justify-center gap-1.5 rounded-xl bg-white transition-all cursor-pointer border px-0 sm:px-3 w-[38px] sm:w-auto"
                                                style={{ height: 38, borderColor: '#E2E8F0' }}
                                            >
                                                <SlidersHorizontal size={14} color="#3B82F6" />
                                                <span className="hidden sm:block text-xs font-bold text-slate-600">Sort</span>
                                            </button>
                                            {showSort && (
                                                <div
                                                    className="absolute right-0 top-full mt-2 bg-white rounded-xl overflow-hidden z-30 w-48"
                                                    style={{ border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                                                >
                                                    {SORT_OPTIONS.map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none"
                                                            style={{
                                                                background: sortBy === opt.value ? tokens.blue.bg : 'transparent',
                                                                color: sortBy === opt.value ? tokens.blue.text : '#475569',
                                                                fontWeight: sortBy === opt.value ? 700 : 500,
                                                            }}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Refresh */}
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            title="Refresh"
                                            className="flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer border-none px-0 sm:px-3 w-[38px] sm:w-auto"
                                            style={{ height: 38, background: '#2563EB', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}
                                        >
                                            <RefreshCw size={14} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                                            <span className="hidden sm:block text-xs font-bold text-white">Refresh</span>
                                        </button>

                                        {/* Export */}
                                        <button
                                            onClick={handleExportPDF}
                                            title="Export to PDF"
                                            className="flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer border-none px-0 sm:px-3 w-[38px] sm:w-auto"
                                            style={{ height: 38, background: '#1E293B', boxShadow: '0 2px 8px rgba(30,41,59,0.2)' }}
                                        >
                                            <Download size={14} className="text-white" />
                                            <span className="hidden sm:block text-xs font-bold text-white">Export</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Empty search ── */}
                            {filteredItems.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-16">
                                    <p className="text-xs text-gray-400 font-medium">No released records match your search.</p>
                                </div>
                            ) : (
                                <>
                                    {/* ══ MOBILE: Card list ══ */}
                                    <div className="md:hidden overflow-y-auto p-4 space-y-3 flex-1" style={{ background: '#F8FAFF' }}>
                                        {paginatedItems.map((item, index) => (
                                            <MobileCard
                                                key={`${item.entityType}-${item.id}`}
                                                item={item}
                                                index={startIndex + index}
                                                onClick={() => setSelectedRecord(item)}
                                            />
                                        ))}
                                    </div>

                                    {/* ══ DESKTOP: Table ══ */}
                                    <div className="hidden md:block overflow-x-auto w-full min-h-0 min-w-0 max-w-full">
                                        <table
                                            className="text-left border-collapse"
                                            style={{ minWidth: 940, width: '100%' }}
                                        >
                                            <thead>
                                                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                                                    {['No.', 'ID', 'Record', 'Drop Date', 'Released Date', 'Released By', 'Pay Status', 'Amount', 'Type'].map((h) => (
                                                        <th
                                                            key={h}
                                                            className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
                                                        >
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedItems.map((item, index) => {
                                                    const displayIndex = startIndex + index + 1;
                                                    const isEven = index % 2 === 0;
                                                    return (
                                                        <tr
                                                            key={`${item.entityType}-${item.id}`}
                                                            onClick={() => setSelectedRecord(item)}
                                                            className="cursor-pointer transition-colors"
                                                            style={{ background: isEven ? '#FFFFFF' : '#FAFCFF', borderBottom: '1px solid #F1F5F9' }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.background = isEven ? '#FFFFFF' : '#FAFCFF'; }}
                                                        >
                                                            <td className="py-3.5 px-4">
                                                                <span className="text-[11px] font-bold text-slate-300 tabular-nums">{displayIndex}</span>
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <span
                                                                    className="inline-block text-[10px] font-black font-mono tracking-wider px-2 py-1 rounded-lg"
                                                                    style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
                                                                >
                                                                    {formatDisplayId(item.displayId)}
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[220px]">{item.headline}</p>
                                                                <p className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5">{item.secondaryLabel}</p>
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{item.dropDate}</span>
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <span className="text-xs font-bold whitespace-nowrap" style={{ color: tokens.blue.text }}>{item.releaseDate}</span>
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{item.releasedBy}</span>
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <PayBadge status={item.payStatus} />
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                {item.totalPrice != null ? (
                                                                    <span className="text-sm font-black text-slate-800 tabular-nums">
                                                                        ₱{item.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <TypeBadge typeKey={item.typeKey} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {/* ── Pagination ── */}
                            {filteredItems.length > 0 && (
                                <div
                                    className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3.5 w-full min-w-0"
                                    style={{ background: '#FAFCFF', borderTop: '1px solid #F1F5F9' }}
                                >
                                    {/* Info */}
                                    <p className="text-[11px] font-medium text-slate-400 order-2 sm:order-1">
                                        Showing{' '}
                                        <span className="text-slate-700 font-black">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredItems.length)}</span>
                                        {' '}of{' '}
                                        <span className="text-slate-700 font-black">{filteredItems.length}</span>
                                    </p>

                                    {/* Page buttons */}
                                    <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border"
                                            style={{
                                                background: '#FFFFFF',
                                                borderColor: '#E2E8F0',
                                                color: currentPage === 1 ? '#CBD5E1' : '#64748B',
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <ChevronLeft size={15} />
                                        </button>

                                        {pageNumbers.map((num, i) => {
                                            const prev = pageNumbers[i - 1];
                                            const gap = prev && num - prev > 1;
                                            return (
                                                <React.Fragment key={num}>
                                                    {gap && <span className="text-slate-300 text-xs font-bold px-0.5">…</span>}
                                                    <button
                                                        onClick={() => setCurrentPage(num)}
                                                        className="w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                                                        style={currentPage === num
                                                            ? { background: '#2563EB', borderColor: '#2563EB', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }
                                                            : { background: '#FFFFFF', borderColor: '#E2E8F0', color: '#64748B' }}
                                                    >
                                                        {num}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border"
                                            style={{
                                                background: '#FFFFFF',
                                                borderColor: '#E2E8F0',
                                                color: currentPage === totalPages ? '#CBD5E1' : '#64748B',
                                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer note */}
                    <div className="shrink-0 flex items-start gap-2">
                        <Archive size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Released records are locked and cannot be edited. Use Archive if the item no longer needs to stay in the active release queue.
                        </p>
                    </div>
                </div>
            </div >

            <ArchiveConfirmModal
                record={archiveTarget}
                onConfirm={confirmArchive}
                onCancel={() => !archiveLoading && setArchiveTarget(null)}
                isSubmitting={archiveLoading}
            />
        </>
    );
}