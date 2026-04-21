import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Package, CheckCircle2, RefreshCw, Users, User, Wrench, Shirt, ChevronDown,
    ArrowUpDown, CreditCard, DollarSign, Hash, ShieldCheck, SlidersHorizontal, X,
    Phone, Mail, MapPin, Calendar, Clock, FileText, ArrowLeft
} from 'lucide-react';
import { bookingApi } from '../../services/bookingApi';

const getBookingDisplayId = (booking = {}) =>
    String(booking?.bookingId || booking?.displayId || booking?.id || booking?._id || 'N/A');

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
    if (s === 'paid')
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={10} />Paid</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200"><X size={10} />Unpaid</span>;
}

const fmtDate = (str) => {
    if (!str || str === '—') return '—';
    try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return str;
    }
};

const Pill = ({ children, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide leading-relaxed ${className}`}>
        {children}
    </span>
);

const MonoTag = ({ children, className = '' }) => (
    <span className={`font-mono text-[11px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md ${className}`}>
        {children}
    </span>
);

function ReleasedItemDetail({ booking, onBack }) {
    const steps = booking.steps || booking.productionProgress || [];
    const teamRoster = booking.teamRoster || booking.players || booking.members || [];
    const isJersey = String(booking.type || booking.service || '').toLowerCase().includes('jersey');
    const isRepair = String(booking.type || booking.service || '').toLowerCase().includes('repair');

    return (
        <div className="font-inter flex flex-col gap-4 pb-8">
            <button
                onClick={onBack}
                className="self-start inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 hover:text-slate-800"
            >
                <ArrowLeft size={14} /> Back to Released
            </button>

            {/* Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
                <div className="h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300" />
                <div className="pt-5 px-6 pb-5">
                    <div className="flex items-center gap-2 flex-wrap mb-3.5">
                        <MonoTag>{getBookingDisplayId(booking)}</MonoTag>
                        <Pill className="bg-cyan-50 text-cyan-800 border-cyan-200">
                            <CheckCircle2 size={10} /> Released
                        </Pill>
                        <TypeBadge type={booking.type} />
                    </div>
                    <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug mb-1">
                        {booking.customerName}
                    </h1>
                    <p className="text-xs text-slate-400 font-medium mb-4">
                        {booking.service || booking.type || 'Service'}
                    </p>
                    <div className="flex flex-wrap gap-y-1.5 gap-x-5">
                        {booking.contact?.phone && (
                            <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                                <Phone size={13} className="text-slate-300" /> {booking.contact.phone}
                            </span>
                        )}
                        {booking.contact?.email && (
                            <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                                <Mail size={13} className="text-slate-300" /> {booking.contact.email}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                            Payment:
                            <span className="ml-1">
                                <PayBadge status={booking.payStatus} />
                            </span>
                        </span>
                    </div>
                </div>
                <div className="absolute top-6 right-6 hidden sm:flex flex-col gap-1.5 items-end">
                    {[
                        { label: 'Drop off', value: fmtDate(booking.dropDate), color: 'text-slate-600' },
                        { label: 'Released', value: fmtDate(booking.releaseDate), color: 'text-cyan-600' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="flex gap-2 items-center">
                            <span className="text-[11px] text-slate-400 font-semibold">{label}</span>
                            <span className={`text-xs font-bold ${color}`}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Production Timeline */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <CheckCircle2 size={15} className="text-cyan-500" />
                            <span className="text-[13px] font-bold text-slate-800">Production Timeline</span>
                            <Pill className="ml-auto bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px]">
                                {steps.length > 0 ? 'Step by step' : 'No steps available'}
                            </Pill>
                        </div>
                        <div className="p-5">
                            {steps.length === 0 ? (
                                <div className="text-sm text-slate-500">No production steps are available for this released booking.</div>
                            ) : (
                                steps.map((step, idx) => (
                                    <div key={idx} className="flex gap-4 relative">
                                        {idx < steps.length - 1 && (
                                            <div className="absolute left-[15px] top-[34px] bottom-0 w-px bg-slate-200" />
                                        )}
                                        <div className="w-8 h-8 rounded-full shrink-0 bg-cyan-500 flex items-center justify-center text-white shadow-[0_0_0_4px_#ECFEFF,0_2px_8px_rgba(6,182,212,0.18)] z-10">
                                            <CheckCircle2 size={15} />
                                        </div>
                                        <div className={`flex-1 ${idx < steps.length - 1 ? 'pb-6' : ''}`}>
                                            <div className="text-[13px] font-bold text-slate-900 leading-snug">{step.step || step.label || `Step ${idx + 1}`}</div>
                                            <div className="flex gap-3.5 mt-1 flex-wrap text-[11px] text-slate-400 font-semibold">
                                                {step.date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} /> {fmtDate(step.date)}
                                                    </span>
                                                )}
                                                {step.worker && (
                                                    <span className="flex items-center gap-2">
                                                        <User size={10} /> {step.worker}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Team Roster (Jersey only) */}
                    {isJersey && teamRoster.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <Users size={15} className="text-indigo-500" />
                                <span className="text-[13px] font-bold text-slate-800">Team Roster</span>
                                <span className="ml-auto text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {teamRoster.length} players
                                </span>
                            </div>
                            <div className="max-w-full overflow-x-auto">
                                <table className="w-full min-w-[560px] border-collapse relative">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            {['Name', 'No.', 'Jersey', 'Short', 'Add-ons'].map((col, ci) => (
                                                <th
                                                    key={col}
                                                    className={`py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${ci === 0 ? 'pl-5 pr-3 text-left' : 'px-3 text-center'}`}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamRoster.map((player, idx) => (
                                            <tr key={idx} className={`h-[52px] border-b border-slate-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="pl-5 pr-3 text-[13px] font-bold text-slate-900">{player.surname || player.name || '—'}</td>
                                                <td className="px-3 text-center">
                                                    <span className="inline-block min-w-[2rem] text-slate-600 px-1.5 text-[11px] font-black tracking-wide">#{player.number ?? '—'}</span>
                                                </td>
                                                <td className="px-3 text-center text-[13px] font-semibold text-slate-700">{player.jerseySize || '—'}</td>
                                                <td className="px-3 text-center text-[12px] font-semibold text-slate-700">{player.shortSize || '—'}</td>
                                                <td className="px-3 pr-5 text-center text-[10px] text-slate-500">{(player.addOns || []).join(', ') || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Repair Spec */}
                    {isRepair && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <Wrench size={15} className="text-blue-500" />
                                <span className="text-[13px] font-bold text-slate-800">Repair Specification</span>
                                <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {booking.items?.length ?? 0} Tasks
                                </span>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                {booking.notes && (
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText size={13} className="text-amber-500" />
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Repair Notes</span>
                                        </div>
                                        <div className="text-[12px] font-medium text-slate-700 leading-relaxed">{booking.notes}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Contact Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <User size={15} className="text-blue-500" />
                            <span className="text-[13px] font-bold text-slate-800">Contact Information</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Name</p>
                                <p className="text-sm font-medium text-slate-800">{booking.customerName}</p>
                            </div>
                            {booking.contact?.phone && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Phone</p>
                                    <a href={`tel:${booking.contact.phone}`} className="text-sm font-medium text-blue-600 hover:underline">{booking.contact.phone}</a>
                                </div>
                            )}
                            {booking.contact?.email && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Email</p>
                                    <a href={`mailto:${booking.contact.email}`} className="text-sm font-medium text-blue-600 hover:underline">{booking.contact.email}</a>
                                </div>
                            )}
                            {booking.contact?.address && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Address</p>
                                    <p className="text-sm font-medium text-slate-800">{booking.contact.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <Package size={15} className="text-violet-500" />
                            <span className="text-[13px] font-bold text-slate-800">Booking Information</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Type</p>
                                <TypeBadge type={booking.type} />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Status</p>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                    <CheckCircle2 size={10} /> Released
                                </span>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Drop Date</p>
                                <p className="text-sm font-medium text-slate-800">{fmtDate(booking.dropDate)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Released Date</p>
                                <p className="text-sm font-bold text-cyan-600">{fmtDate(booking.releaseDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <CreditCard size={15} className="text-emerald-500" />
                            <span className="text-[13px] font-bold text-slate-800">Payment Information</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-600">Payment Status:</span>
                                <PayBadge status={booking.payStatus} />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-600">Amount:</span>
                                <span className="text-lg font-bold text-slate-900">
                                    {booking.totalPrice != null ? `₱${parseFloat(booking.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                                </span>
                            </div>
                            {booking.paidAt && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-600">Paid At:</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {new Date(booking.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {(booking.notes || booking.adminNotes) && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <FileText size={15} className="text-amber-500" />
                                <span className="text-[13px] font-bold text-slate-800">Notes</span>
                            </div>
                            <div className="p-5 space-y-3">
                                {booking.notes && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-1">Customer Notes:</p>
                                        <p className="text-sm text-slate-700">{booking.notes}</p>
                                    </div>
                                )}
                                {booking.adminNotes && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-1">Admin Notes:</p>
                                        <p className="text-sm text-slate-700">{booking.adminNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
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
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' }}
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
    const [selectedBooking, setSelectedBooking] = useState(null);

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
                    displayId: getBookingDisplayId(b),
                    customerName: b.contact?.fullName || b.guestName || 'N/A',
                    releaseDate: b.pickedUpAt ? new Date(b.pickedUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
                    dropDate: new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    payStatus: b.paid ? 'Paid' : 'Unpaid',
                    totalPrice: b.totalPrice ?? b.amount ?? null,
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

    if (selectedBooking) {
        return (
            <div className="font-[inter] h-screen flex flex-col overflow-auto px-4 lg:px-6 pt-5">
                <ReleasedItemDetail
                    booking={selectedBooking}
                    onBack={() => setSelectedBooking(null)}
                />
            </div>
        );
    }

    return (
        <div className="font-[inter] h-screen flex flex-col overflow-hidden">

            {/* ── TOP HEADER: title + KPI cards ── */}
            <div className="shrink-0 px-4 lg:px-6 pt-5 pb-4 border-b border-slate-200 shadow-sm space-y-4">
                {/* KPI Cards — always at the top */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <StatCard icon={CheckCircle2} label="Total Released" value={releasedItems.length} sub="bookings" color="blue" />
                    <StatCard icon={CreditCard} label="Paid" value={paidCount} sub={`of ${releasedItems.length}`} color="green" />
                    <StatCard icon={DollarSign} label="Total Revenue" value={totalRevenue > 0 ? `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'} color="violet" />
                    <StatCard icon={ArrowUpDown} label="Showing" value={filteredItems.length} sub="filtered rows" color="amber" />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 flex flex-col gap-3 min-h-0">

                {/* Empty state */}
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

                        {/* ── TABLE TOOLBAR: label + search + sort + refresh (inside table card) ── */}
                        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 border-b border-slate-100 bg-blue-50/60">
                            {/* Left: label + counts */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-700">Released Bookings</span>
                                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                                    {filteredItems.length} shown
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">/ {releasedItems.length} total</span>
                            </div>

                            {/* Right: search + sort + refresh */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                    <input
                                        type="text"
                                        placeholder="Search ID, name, type…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="bg-white border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 rounded-lg py-1.5 pl-8 pr-3 text-xs font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all w-52"
                                    />
                                </div>

                                {/* Sort */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSort(v => !v)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-gray-600 transition-all cursor-pointer"
                                    >
                                        <SlidersHorizontal size={12} className="text-blue-400" />
                                        <span className="hidden sm:inline max-w-[100px] truncate">{currentSortLabel}</span>
                                        <ChevronDown size={11} className={`text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
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

                                {/* Refresh */}
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer border-none shadow-sm shadow-blue-200"
                                >
                                    <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
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
                                                onClick={() => setSelectedBooking(item)}
                                                className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors row-in cursor-pointer"
                                                style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
                                            >
                                                <td className="py-3 px-4">
                                                    <span className="text-[11px] font-bold text-gray-400 tabular-nums">{idx + 1}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-block max-w-[180px] truncate text-[11px] font-bold font-mono text-gray-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider align-middle">
                                                        {getBookingDisplayId(item)}
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

                {/* Footer note */}
                <div className="shrink-0 flex items-start gap-2 px-1">
                    <ShieldCheck size={12} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        Once a record is marked as released, it can no longer be edited or modified.
                        This ensures <span className="font-semibold text-gray-500">data transparency and integrity</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}   
