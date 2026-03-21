import React, { useState, useMemo, useEffect } from 'react';
import {Search, Package, CheckCircle2, RefreshCw,Users, Wrench, Shirt, ChevronDown,ArrowUpDown, CreditCard, DollarSign, Hash,
    ShieldCheck, SlidersHorizontal
} from 'lucide-react';
import { bookingApi } from '../../services/bookingApi';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest → Oldest' },
    { value: 'oldest', label: 'Oldest → Newest' },
    { value: 'name-az', label: 'Name A → Z' },
    { value: 'name-za', label: 'Name Z → A' },
];

function TypeBadge({ type }) {
    const t = type?.toLowerCase();
    if (t === 'jersey')
        return <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"><Shirt size={11} />Jersey</span>;
    if (t === 'organizational')
        return <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"><Users size={11} />Org</span>;
    if (t === 'repair')
        return <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"><Wrench size={11} />Repair</span>;
    return <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"><Package size={11} />{type || 'Unknown'}</span>;
}

function PayBadge({ status }) {
    const s = status?.toLowerCase();
    if (s === 'paid') return <span className="bg-green-100 text-green-700 border border-green-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"><CreditCard size={10} />Paid</span>;
    if (s === 'partial') return <span className="bg-orange-100 text-orange-600 border border-orange-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"><CreditCard size={10} />Partial</span>;
    return <span className="bg-red-100 text-red-600 border border-red-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"><CreditCard size={10} />Unpaid</span>;
}

function StatCard({ icon: Icon, label, value, sub, color }) {
    const colors = {
        blue: { accent: '#3B82F6', bgAccent: '#EFF6FF' },
        green: { accent: '#059669', bgAccent: '#ECFDF5' },
        amber: { accent: '#F59E0B', bgAccent: '#FFFBEB' },
        violet: { accent: '#7C3AED', bgAccent: '#F5F3FF' },
    };
    const c = colors[color] || colors.blue;
    return (
        <div
            className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default fade-in"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: c.accent }} />
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: c.bgAccent }}>
                        <Icon size={16} color={c.accent} strokeWidth={2.2} />
                    </div>
                    <span className="text-[12px] font-semibold text-gray-500">{label}</span>
                </div>
            </div>
            <div className="mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">{value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
        </div>
    );
}

export default function ReleasedItems() {
    const [searchQuery, setSearchQuery] = useState('');
    const [releasedItems, setReleasedItems] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [showSort, setShowSort] = useState(false);

    useEffect(() => {
        fetchReleasedItems();
        const iv = setInterval(fetchReleasedItems, 5000);
        return () => clearInterval(iv);
    }, []);

    const fetchReleasedItems = async () => {
        try {
            const bookingsRes = await bookingApi.getAllBookings();
            const bookingsData = bookingsRes?.bookings || bookingsRes?.data || bookingsRes || [];
            const released = (Array.isArray(bookingsData) ? bookingsData : [])
                .filter(b => b.status === 'Released')
                .map(b => ({
                    ...b,
                    type: b.serviceType || b.service || b.bookingType || b.eventType || 'booking',
                    displayId: b._id,
                    customerName: b.contact?.fullName || b.guestName || 'N/A',
                    releaseDate: b.pickedUpAt ? new Date(b.pickedUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
                    dropDate: new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    payStatus: b.payStatus || b.paymentStatus || b.payment?.status || 'Unpaid',
                    totalPrice: b.totalPrice ?? b.amount ?? b.payment?.total ?? b.totalAmount ?? null,
                }));
            setReleasedItems(released);
        } catch { }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchReleasedItems();
        setIsRefreshing(false);
    };

    const totalRevenue = useMemo(() =>
        releasedItems.reduce((sum, i) => sum + (parseFloat(i.totalPrice) || 0), 0),
        [releasedItems]);

    const paidCount = useMemo(() =>
        releasedItems.filter(i => i.payStatus?.toLowerCase() === 'paid').length,
        [releasedItems]);

    const filteredItems = useMemo(() => {
        let items = releasedItems.filter(i =>
            i.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sortBy === 'newest') items = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (sortBy === 'oldest') items = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        if (sortBy === 'name-az') items = [...items].sort((a, b) => a.customerName.localeCompare(b.customerName));
        if (sortBy === 'name-za') items = [...items].sort((a, b) => b.customerName.localeCompare(a.customerName));
        return items;
    }, [releasedItems, searchQuery, sortBy]);

    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label;

    return (
        <>
            <div className="font-[inter] h-screen flex flex-col overflow-hidden">
                <div className="shrink-0 px-4 lg:px-6 pt-5 pb-4 border-b border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                                <CheckCircle2 size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 leading-tight">Released Items</h1>
                                <p className="text-[11px] text-gray-400 leading-tight">All scanned and released bookings</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative ">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search ID, name, type…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all w-70"
                                />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowSort(v => !v)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-semibold text-gray-600 transition-all cursor-pointer"
                                >
                                    <SlidersHorizontal size={13} className="text-blue-400" />
                                    <span className="hidden sm:inline max-w-[110px] truncate">{currentSortLabel}</span>
                                    <ChevronDown size={12} className={`text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                                </button>
                                {showSort && (
                                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden w-44 fade-in">
                                        {SORT_OPTIONS.map(o => (
                                            <button
                                                key={o.value}
                                                onClick={() => { setSortBy(o.value); setShowSort(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none ${sortBy === o.value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-slate-50'}`}
                                            >
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm shadow-blue-200"
                            >
                                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* kpi*/}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <StatCard icon={CheckCircle2} label="Total Released" value={releasedItems.length} sub="bookings" color="blue" />
                        <StatCard icon={CreditCard} label="Paid" value={paidCount} sub={`of ${releasedItems.length}`} color="green" />
                        <StatCard icon={DollarSign} label="Total Revenue" value={totalRevenue > 0 ? `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'} color="violet" />
                        <StatCard icon={ArrowUpDown} label="Showing" value={filteredItems.length} sub="filtered rows" color="amber" />
                    </div>
                </div>

                {/* table area*/}
                <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 flex flex-col gap-3 min-h-0">

                    {releasedItems.length === 0 && !isRefreshing && (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 text-center p-12 fade-in">
                            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                <Package size={28} className="text-blue-300" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 mb-1">No Released Bookings Yet</h3>
                            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                                Items will appear here once they are scanned and released via the QR scanner. Auto-refreshes every 5 seconds.
                            </p>
                        </div>
                    )}

                    {releasedItems.length > 0 && (
                        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
                            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-blue-50/60">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-700">Released Bookings</span>
                                    <span className="ml-1 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                                        {filteredItems.length} shown
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">{releasedItems.length} total records</span>
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-12">
                                    <p className="text-xs text-gray-400 font-medium">No items match your search</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-auto table-scroll min-h-0">
                                    <table className="w-full text-left border-collapse" style={{ minWidth: 860 }}>
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                {['No.', 'ID', 'Name', 'Drop Date', 'Released Date', 'Pay Status', 'Amount', 'Type'].map(h => (
                                                    <th key={h} className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((item, idx) => (
                                                <tr
                                                    key={`${item.displayId}-${idx}`}
                                                    className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors row-in"
                                                    style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
                                                >
                                                    <td className="py-3 px-4">
                                                        <span className="text-[11px] font-bold text-gray-400 tabular-nums">
                                                            {idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-[11px] font-bold font-mono text-gray-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider">
                                                            {item.displayId?.slice(0, 6).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[140px]">{item.customerName}</p>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{item.dropDate}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">{item.releaseDate}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <PayBadge status={item.payStatus} />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {item.totalPrice != null ? (
                                                            <span className="text-sm font-bold text-gray-800 tabular-nums">
                                                                ₱{parseFloat(item.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <TypeBadge type={item.type} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* note */}
                    <div className="shrink-0 flex items-start gap-2 px-1">
                        <ShieldCheck size={12} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            Once a record is marked as released, it can no longer be edited or modified.
                            This ensures <span className="font-semibold text-gray-500">data transparency and integrity</span>.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}