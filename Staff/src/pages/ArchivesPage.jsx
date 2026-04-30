import React, { useState, useMemo, useEffect } from 'react';
import {
    Archive, Search, CheckCircle2, Package, Users, Wrench,
    Calendar, ChevronDown, X, Eye, Filter, Shirt, ChevronRight,
    ArrowLeft, ArrowRight, User, Phone, CheckCheck, Scissors,
    FileText, Image as ImageIcon, RotateCcw, XCircle
} from 'lucide-react';
import { bookingApi } from '../services/bookingApi';
import { orderApi } from '../services/orderApi.js';
import img from '../assets/img';

const getDerivedOrderStatus = (order) => {
    if (order?.status === "Cancelled") return "Cancelled";
    if (order?.status === "Released") return "Released";
    return order?.status || "Pending";
};

const mapBookingTypeToArchive = (bookingType) => {
    const typeMap = {
        'jersey': 'TEAM_JERSEY',
        'team jersey': 'TEAM_JERSEY',
        'organizational': 'ORGANIZATIONAL',
        'organization': 'ORGANIZATIONAL',
        'repair': 'REPAIR',
    };
    return typeMap[bookingType?.toLowerCase()] || 'TEAM_JERSEY';
};

const mapBookingToArchiveOrder = (booking) => {
    const safeCustomerName = booking.contact?.fullName
        || (typeof booking.customer === 'object' ? (booking.customer?.fullName || booking.customer?.name) : booking.customer)
        || 'Unknown';
    const safePhone = booking.contact?.phone
        || (typeof booking.customer === 'object' ? booking.customer?.phone : null)
        || booking.phone
        || 'N/A';

    const sourceStatus = getDerivedOrderStatus(booking);

    return {
        ...booking,
        id: booking._id || booking.id,
        _id: booking._id,
        displayId: booking.bookingId || booking.orderId || booking._id || booking.id,
        type: mapBookingTypeToArchive(booking.bookingType),
        teamName: booking.teamName || booking.orgName || 'Order',
        customerName: String(safeCustomerName),
        customer: String(safeCustomerName),
        contact: String(safePhone),
        serviceTitle: booking.bookingType || booking.service || 'Service',
        serviceName: booking.service || booking.bookingType || 'Service',
        items: booking.items || [],
        teamRoster: booking.players || booking.members || [],
        productionProgress: booking.steps || [],
        designImages: booking.photos || [],
        lineupImage: booking.photos?.[0] || booking.designFile || booking.orgDesignFile,
        repairImage: booking.photos?.[0] || booking.repairImage,
        completedAt: booking.archivedAt || booking.completedAt || booking.updatedAt || new Date().toISOString(),
        archivedAt: booking.archivedAt || booking.completedAt || booking.updatedAt || new Date().toISOString(),
        archivedBy: booking.archivedBy || '',
        dropDate: booking.createdAt,
        dueDate: booking.pickupDate || booking.createdAt,
        assignedBy: booking.assignedTailor || 'Admin',
        totalQty: booking.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0,
        notes: typeof booking.notes === 'object' ? '' : (booking.notes || ''),
        isBooking: Boolean(booking.bookingType),
        sourceStatus,
    };
};

const fmtDate = (str) => {
    if (!str || str === '—') return '—';
    try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return str; }
};

const TYPE_CONFIG = {
    TEAM_JERSEY: { label: 'Team Jersey', text: 'text-blue-600' },
    ORGANIZATIONAL: { label: 'Organizational', text: 'text-indigo-600' },
    REPAIR: { label: 'Repair', text: 'text-violet-600' },
};

const Pill = ({ bg, text, border, children, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide leading-relaxed ${bg} ${text} border ${border} whitespace-nowrap ${className}`}>
        {children}
    </span>
);

const MonoTag = ({ children, className = '' }) => (
    <span className={`font-mono text-[11px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md ${className}`}>
        {children}
    </span>
);



const StatusBadge = ({ status }) => {
    if (status === 'Cancelled') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <XCircle size={11} />
                Cancelled
            </span>
        );
    }

    if (status === 'Released') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 size={11} />
                Released
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={11} />
            Archived
        </span>
    );
};

const MediaRenderer = ({ image, text, className = '' }) => {
    if (image) {
        return (
            <div className={`border border-gray-200 rounded-xl overflow-hidden shadow-sm ${className}`}>
                <img src={img.sample} className="w-full h-48 object-cover" />
            </div>
        );
    }
    if (text) {
        return <div className={`text-sm text-gray-700 ${className}`}>{text}</div>;
    }
    return null;
};

const ArchiveDetail = ({ order, onBack }) => {
    const [orgImageIdx, setOrgImageIdx] = useState(0);
    const [zoomType, setZoomType] = useState(null);
    const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.TEAM_JERSEY;
    const rawName = order.customerName || order.customer;
    const customerName = typeof rawName === 'object' ? (rawName?.fullName || rawName?.name || 'Unknown') : (rawName || 'Unknown');
    const archivedByLabel = order.archivedBy || '';
    const items = order.items || [];
    const steps = order.productionProgress || [];
    const teamRoster = order.teamRoster || [];

    const orgImages = order.designImages || (order.lineupImage ? [order.lineupImage] : [img.sample, img.sample, img.sample]);

    const ROWS_PER_PAGE = 7;
    const [rosterPage, setRosterPage] = useState(0);
    const paginatedRoster = teamRoster.slice(rosterPage * ROWS_PER_PAGE, (rosterPage + 1) * ROWS_PER_PAGE);
    const totalPages = Math.ceil(teamRoster.length / ROWS_PER_PAGE);
    const startIndex = rosterPage * ROWS_PER_PAGE;
    const emptyRowsCount = ROWS_PER_PAGE - paginatedRoster.length;

    return (
        <div className="font-inter flex flex-col gap-4 w-full max-w-full overflow-x-hidden">
            <button
                onClick={onBack}
                className="self-start inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 hover:text-slate-800"
            >
                <ArrowLeft size={14} /> Back to Archives
            </button>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />

                <div className="pt-5 px-6 pb-5">
                    <div className="flex items-center gap-2 flex-wrap mb-3.5">
                        <MonoTag>{order.displayId || order.id}</MonoTag>
                        <Pill bg="bg-emerald-50" text="text-emerald-800" border="border-emerald-300">
                            <CheckCircle2 size={10} /> Completed
                        </Pill>
                        <div className={`text-[11px] font-black uppercase tracking-widest ${tc.text} bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg`}>
                            {tc.label}
                        </div>
                    </div>
                    {order.type === 'TEAM_JERSEY' && (
                        <>
                            <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-widest">Team Name</p>
                            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug mb-4">
                                {order.teamName || 'N/A'}
                            </h1>
                        </>
                    )}
                    {order.type === 'ORGANIZATIONAL' && (
                        <>
                            <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-widest">Company Name</p>
                            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug mb-4">
                                {order.teamName || order.orgName || 'N/A'}
                            </h1>
                        </>
                    )}
                    {order.type === 'REPAIR' && (
                        <>
                            <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-widest">Repair Type</p>
                            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug mb-4">
                                {order.serviceName || order.serviceTitle || 'Repair'}
                            </h1>
                        </>
                    )}
                    <div className="flex flex-wrap gap-y-1.5 gap-x-5">
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                            <User size={13} className="text-slate-300" /> {customerName}
                        </span>
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                            <Phone size={13} className="text-slate-300" /> {typeof order.contact === 'object' ? (order.contact?.phone || '—') : (order.contact || '—')}
                        </span>
                        {archivedByLabel && (
                            <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                                Archived by
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md ml-1">
                                    {archivedByLabel}
                                </span>
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                            Assigned by
                            <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md ml-1">
                                {order.assignedBy || 'Admin'}
                            </span>
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 sm:hidden">
                        {[
                            { label: 'Drop off', value: fmtDate(order.dropDate), color: 'text-slate-600' },
                            { label: 'Due date', value: fmtDate(order.dueDate), color: 'text-red-600' },
                            { label: 'Completed', value: fmtDate(order.completedAt), color: 'text-emerald-600' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="flex flex-col items-center bg-slate-50 rounded-xl py-2.5 px-2 border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{label}</span>
                                <span className={`text-[11px] font-extrabold ${color}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dates — absolute on desktop */}
                <div className="absolute top-6 right-6 hidden sm:flex flex-col gap-1.5 items-end">
                    {[
                        { label: 'Drop off', value: fmtDate(order.dropDate), color: 'text-slate-600' },
                        { label: 'Due date', value: fmtDate(order.dueDate), color: 'text-red-600' },
                        { label: 'Completed', value: fmtDate(order.completedAt), color: 'text-emerald-600' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="flex gap-2 items-center">
                            <span className="text-[11px] text-slate-400 font-semibold">{label}</span>
                            <span className={`text-xs font-bold ${color}`}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start w-full overflow-hidden">
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <CheckCheck size={15} className="text-emerald-500" />
                            <span className="text-[13px] font-bold text-slate-800">Production Timeline</span>
                            <Pill bg="bg-emerald-50" text="text-emerald-800" border="border-emerald-200" className="ml-auto text-[10px]">
                                All steps done
                            </Pill>
                        </div>
                        <div className="p-5 px-6">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex gap-4 relative">
                                    {idx < steps.length - 1 && (
                                        <div className="absolute left-[15px] top-[34px] bottom-0 w-0.5 bg-gradient-to-b from-emerald-100 to-slate-200 rounded-sm" />
                                    )}
                                    <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_0_4px_#ECFDF5,0_2px_8px_rgba(16,185,129,0.25)] z-10">
                                        <CheckCircle2 size={15} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className={`flex-1 ${idx < steps.length - 1 ? 'pb-6' : ''}`}>
                                        <div className="text-[13px] font-bold text-slate-900 leading-snug">{step.label || step.step || 'Step'}</div>
                                        <div className="flex gap-3.5 mt-1 flex-wrap">
                                            {step.date && (
                                                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                                                    <Calendar size={10} /> {step.date}
                                                </span>
                                            )}
                                            {step.worker && (
                                                <span className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                        <User size={8} />
                                                    </div> {step.worker}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {order.type === 'TEAM_JERSEY' && teamRoster.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <Users size={15} className="text-indigo-500 shrink-0" />
                                <span className="text-[13px] font-bold text-slate-800">Team Roster</span>
                                <span className="ml-auto text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {teamRoster.length} players
                                </span>
                            </div>

                            <div className="max-h-[420px] flex flex-col">
                                <div className="max-w-full overflow-x-auto overflow-y-auto flex-1">
                                    <table className="w-full min-w-[560px] border-collapse relative">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                {['Name', 'No.', 'Jersey', 'Short', 'Add-ons'].map((col, ci) => (
                                                    <th
                                                        key={col}
                                                        className={`sticky top-0 z-10 bg-slate-50 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100
                                                            ${ci === 0 ? 'pl-5 pr-3 text-left' : 'px-3 text-center'}`}
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedRoster.map((player, idx) => {
                                                const addOnsText = player.addOns?.join(', ') || '—';
                                                return (
                                                    <tr
                                                        key={idx}
                                                        className={`h-[52px] border-b border-slate-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                                    >
                                                        <td className="pl-5 pr-3 text-[13px] font-black text-slate-900 leading-none">
                                                            {player.surname || player.name || '—'}
                                                        </td>
                                                        <td className="px-3 text-center text-[13px] font-black text-slate-900">
                                                            {player.number !== undefined ? `#${player.number}` : <span className="text-slate-300">—</span>}
                                                        </td>
                                                        <td className="px-3 text-center text-[13px] font-black text-slate-900">
                                                            {player.jerseySize || <span className="text-slate-300">—</span>}
                                                        </td>
                                                        <td className="px-3 text-center text-[13px] font-black text-slate-900">
                                                            {player.shortSize && player.shortSize !== '-' ? player.shortSize : <span className="text-slate-300">—</span>}
                                                        </td>
                                                        <td className="px-3 pr-5 text-center text-[11px] font-medium text-slate-400 capitalize">
                                                            {addOnsText}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {rosterPage === totalPages - 1 && (
                                                <tr key="end-divider" className="h-[52px] border-b border-slate-100">
                                                    <td colSpan="5" className="px-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-px flex-1 bg-slate-100" />
                                                            <span className="text-[10px] font-bold text-slate-400 tracking-widest whitespace-nowrap">
                                                                All items are listed above
                                                            </span>
                                                            <div className="h-px flex-1 bg-slate-100" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-[999] shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setRosterPage(p => Math.max(0, p - 1))}
                                            disabled={rosterPage === 0}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                        >
                                            <ChevronRight size={16} className="rotate-180" />
                                        </button>
                                        {[...Array(totalPages)].map((_, pi) => (
                                            <button
                                                key={pi}
                                                onClick={() => setRosterPage(pi)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${rosterPage === pi
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                                                    : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600'
                                                    }`}
                                            >
                                                {pi + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setRosterPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={rosterPage === totalPages - 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                        Showing <span className="text-slate-900">{startIndex + 1}-{Math.min(startIndex + ROWS_PER_PAGE, teamRoster.length)}</span> of <span className="text-slate-900">{teamRoster.length}</span> players
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {order.type === 'REPAIR' && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <span className="text-[13px] font-bold text-slate-800">Repair Details</span>
                                <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {items.length} Tasks
                                </span>
                            </div>

                            <div className="p-6 flex flex-col gap-8">
                                {order.notes && (
                                    <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 flex flex-col">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Repair Notes</span>
                                        </div>
                                        <div className="text-[13px] font-bold text-slate-700 leading-relaxed italic">
                                            {order.notes}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Task Breakdown</span>
                                    </div>
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="text-[14px] font-bold text-slate-800">{item.name || item.description || 'Repair Item'}</div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Quantity: {item.qty}</div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                                                    Completed
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {order.attachmentImage && (
                                    <MediaRenderer image={order.attachmentImage} text="Repair attachment" />
                                )}
                            </div>
                        </div>
                    )}

                    {order.type === 'ORGANIZATIONAL' && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <Shirt size={15} className="text-teal-500 shrink-0" />
                                <span className="text-[13px] font-bold text-slate-800">Organization Lineup</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                        {orgImageIdx + 1} / {orgImages.length}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50/50 max-h-[500px] overflow-y-auto">
                                <div className="relative group rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center aspect-square md:aspect-[4/3]">
                                    <div className="w-full h-full cursor-pointer overflow-hidden flex items-center justify-center relative" onClick={() => setZoomType('ORG')}>
                                        <img
                                            src={orgImages[orgImageIdx] || img.sample}
                                            alt={`Lineup ${orgImageIdx + 1}`}
                                            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                                            onError={e => { e.currentTarget.src = img.sample; }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center z-10">
                                            <div className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md transition-opacity">
                                                <Eye size={13} /> Click to expand
                                            </div>
                                        </div>
                                    </div>

                                    {orgImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setOrgImageIdx((prev) => (prev - 1 + orgImages.length) % orgImages.length)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-slate-200 text-slate-600 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-teal-600"
                                            >
                                                <ChevronRight size={18} className="rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => setOrgImageIdx((prev) => (prev + 1) % orgImages.length)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-slate-200 text-slate-600 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-teal-600"
                                            >
                                                <ChevronRight size={18} />
                                            </button>

                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/30 backdrop-blur-md">
                                                {orgImages.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setOrgImageIdx(i)}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === orgImageIdx ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {zoomType && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in"
                        onClick={() => setZoomType(null)}
                    >
                        <button
                            className="absolute top-6 right-6 lg:top-8 lg:right-8 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 z-50 text-xl cursor-pointer ring-1 ring-white/20"
                            onClick={() => setZoomType(null)}
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={zoomType === 'REPAIR' ? order.repairImage : (orgImages[orgImageIdx] || img.sample)}
                            alt="Zoomed"
                            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 cursor-auto"
                            onClick={(e) => e.stopPropagation()}
                            onError={e => { e.currentTarget.src = img.sample; }}
                        />
                        {zoomType === 'ORG' && orgImages.length > 1 && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                                {orgImages.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); setOrgImageIdx(i); }}
                                        className={`w-2 h-2 rounded-full transition-all ${i === orgImageIdx ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/80'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-4 w-full lg:w-[35%] xl:w-[15%] lg:min-w-[340px] min-w-0 lg:sticky lg:top-4">
                    {order.type === 'REPAIR' && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                <ImageIcon size={14} className="text-slate-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Repair Reference</span>
                            </div>
                            <div className="p-3">
                                <div className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center h-[180px]">
                                    {order.repairImage ? (
                                        <div className="w-full h-full cursor-pointer overflow-hidden flex items-center justify-center relative" onClick={() => setZoomType('REPAIR')}>
                                            <img
                                                src={order.repairImage}
                                                alt="Repair Reference"
                                                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.05]"
                                                onError={e => { e.currentTarget.src = img.sample; }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center z-10">
                                                <div className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md transition-opacity">
                                                    <Eye size={13} /> View Large
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <ImageIcon size={32} strokeWidth={1.5} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-center">No Image<br />Available</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full ">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <Package size={14} className="text-slate-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Items</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] px-5 py-2 border-b border-slate-100 bg-slate-50/30">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Qty</span>
                        </div>
                        {items.map((item, idx) => (
                            <div key={idx} className={`flex items-center px-5 h-[44px] border-b border-slate-100/60 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <span className="text-[13px] font-semibold text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {item.name || item.description}
                                    </span>
                                </div>
                                <span className="font-mono text-[13px] font-bold text-slate-900">{item.qty}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center px-5 py-3 border-t border-slate-200 bg-slate-50/80">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Total Quantity</span>
                            <span className="font-mono text-[16px] font-black text-slate-900">
                                {order.totalQty || items.reduce((s, i) => s + (i.qty || 0), 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RestoreConfirmModal = ({ order, onConfirm, onCancel, isRestoring }) => {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Restore Archived Order</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            This archived record will be returned to your active staff orders.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isRestoring}
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-50 bg-transparent border-none cursor-pointer ml-2"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 bg-slate-50 space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-emerald-700">Order ID: <span className="font-bold">{order.displayId || order.id}</span></p>
                        <p className="text-xs font-semibold text-emerald-700 mt-1">Customer: <span className="font-bold">{order.customerName}</span></p>
                    </div>
                </div>

                <div className="p-6 flex gap-3 border-t border-slate-100">
                    <button
                        onClick={onCancel}
                        disabled={isRestoring}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                    >
                        Keep Archived
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isRestoring}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
                    >
                        {isRestoring ? 'Restoring...' : 'Restore'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ArchiveCard = ({ order, onClick, onRestore, isRestoring }) => {
    const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.TEAM_JERSEY;
    const fullId = order.displayId || order.id || '';
    const shortId = fullId.length > 6 ? fullId.slice(-6) : fullId;

    return (
        <div className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[10px] font-black text-slate-400 bg-slate-100/50 px-2 py-1 rounded-lg border border-slate-200/50 text-center tracking-tighter">
                    #{shortId}
                </div>
                <div className="flex items-center gap-2">
                    <div className={`text-[10px] font-black uppercase tracking-widest ${tc.text}`}>
                        {tc.label}
                    </div>
                    <StatusBadge status={order.sourceStatus} />
                </div>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-black text-slate-800 leading-none">
                        {order.teamName || order.customerName}
                    </h3>
                    <span className="shrink-0 text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 uppercase tracking-tighter">
                        {order.serviceTitle}
                    </span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-1">{order.customerName}</div>
                {order.archivedBy && (
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-1">
                        Archived by {order.archivedBy}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-1 pt-3 border-t border-slate-50">
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-black">
                    <CheckCircle2 size={11} strokeWidth={3} /> {fmtDate(order.completedAt)}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onClick(order.id)}
                        className="flex items-center gap-1 text-[11px] font-black text-blue-600 uppercase tracking-widest bg-transparent border-none cursor-pointer"
                    >
                        View <ChevronRight size={12} />
                    </button>
                    <button
                        onClick={() => onRestore(order)}
                        disabled={isRestoring}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 disabled:opacity-60 cursor-pointer"
                    >
                        <RotateCcw size={11} />
                        Restore
                    </button>
                </div>
            </div>
        </div>
    );
};




const ArchivesPage = () => {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');
    const [archivedOrders, setArchivedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const fetchArchivedOrders = async () => {
        try {
            setLoading(true);
            const [bookingRes, orderRes] = await Promise.all([
                bookingApi.getAllBookings().catch(() => ({ bookings: [] })),
                orderApi.getAllOrders().catch(() => ({ orders: [] }))
            ]);

            const bookings = bookingRes.bookings || bookingRes.data || [];
            const orders = orderRes.orders || orderRes.data || [];

            const allItems = [...bookings, ...orders];

            // Include archived, released, and cancelled items
            const filtered = allItems.filter(b =>
                b.isArchived === true ||
                b.status === 'Released' ||
                b.status === 'Cancelled'
            );

            const mapped = filtered.map(mapBookingToArchiveOrder);
            const uniqueArchived = Array.from(new Map(mapped.map(item => [item.id, item])).values());

            setArchivedOrders(uniqueArchived);
        } catch (error) {
            console.error('Error fetching archived orders:', error);
            setArchivedOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchivedOrders();
    }, []);

    const filtered = useMemo(() => {
        let list = [...archivedOrders];
        if (typeFilter !== 'All') list = list.filter(o => o.type === typeFilter);

        // Apply status filter
        if (statusFilter !== 'All') {
            if (statusFilter === 'Archived') {
                list = list.filter(o => o.isArchived === true);
            } else {
                list = list.filter(o => o.sourceStatus === statusFilter);
            }
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(o =>
                (o.teamName || '').toLowerCase().includes(q) ||
                (o.customerName || '').toLowerCase().includes(q) ||
                (o.serviceTitle || '').toLowerCase().includes(q) ||
                (o.archivedBy || '').toLowerCase().includes(q) ||
                String(o.displayId || o.id || '').toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const da = new Date(a.completedAt), db = new Date(b.completedAt);
            return sortOrder === 'newest' ? db - da : da - db;
        });
        return list;
    }, [search, typeFilter, statusFilter, sortOrder, archivedOrders]);

    const stats = useMemo(() => {
        const total = archivedOrders.length;
        const jerseys = archivedOrders.filter(o => o.type === 'TEAM_JERSEY').length;
        const orgs = archivedOrders.filter(o => o.type === 'ORGANIZATIONAL').length;
        const repair = archivedOrders.filter(o => o.type === 'REPAIR').length;
        return { total, jerseys, orgs, repair };
    }, [archivedOrders]);

    const selectedOrder = archivedOrders.find(o => o.id === selectedId);

    const handleRestoreConfirm = async () => {
        if (!restoreTarget) return;

        try {
            setIsRestoring(true);
            if (restoreTarget.isBooking) {
                await bookingApi.updateBooking(restoreTarget.id, { isArchived: false, archivedAt: null, archivedBy: null });
            } else {
                await orderApi.updateOrder(restoreTarget.id, { isArchived: false, archivedAt: null, archivedBy: null });
            }

            setRestoreTarget(null);
            if (selectedId === restoreTarget.id) {
                setSelectedId(null);
            }
            await fetchArchivedOrders();
        } catch (error) {
            console.error('Failed to restore archived order:', error);
            alert('Failed to restore archived order. Please try again.');
        } finally {
            setIsRestoring(false);
        }
    };

    if (selectedOrder) return (
        <div className="min-h-[calc(100vh-80px)]">
            <ArchiveDetail order={selectedOrder} onBack={() => setSelectedId(null)} />
        </div>
    );

    if (loading) {
        return (
            <div className="font-sans flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-500">Loading archives...</p>
                </div>
            </div>
        );
    }

    const kpiCards = [
        { label: 'Total Records', value: stats.total, icon: Archive, color: '#059669', filter: 'All', sub: 'Production history' },
        { label: 'Team Jerseys', value: stats.jerseys, icon: Shirt, color: '#3B82F6', filter: 'TEAM_JERSEY', sub: 'Custom sports' },
        { label: 'Organizational', value: stats.orgs, icon: Users, color: '#6366F1', filter: 'ORGANIZATIONAL', sub: 'Corporate/Large' },
        { label: 'Repair Jobs', value: stats.repair, icon: Wrench, color: '#7C3AED', filter: 'REPAIR', sub: 'Maintenance' },
    ];

    return (
        <div className="font-sans flex flex-col gap-4 md:gap-5 w-full max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Archives</h1>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Production history and records</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {kpiCards.map((k, idx) => {
                    const isActive = typeFilter === k.filter;
                    const accent = k.color;
                    return (
                        <button
                            key={idx}
                            onClick={() => setTypeFilter(k.filter)}
                            className={`bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left border-none outline-none ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md' : 'border border-slate-200/50'}`}
                            style={{ boxShadow: isActive ? "0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)" : "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                        >
                            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: accent + "18", border: `1.5px solid ${accent}30` }}>
                                    <k.icon size={20} color={accent} strokeWidth={2.2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-semibold text-gray-500 tracking-tight leading-none mb-1.5 uppercase">{k.label}</div>
                                    <div className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">{k.value}</div>
                                    <div className="text-[10px] text-gray-400 font-bold truncate leading-none uppercase tracking-tighter opacity-80">{k.sub}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-sm">
                <div className="relative flex-1">
                    <Search size={14} className="text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, team, or order ID…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-8 py-2.5 text-[13px] font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none transition-all focus:border-blue-300 focus:ring-[3px] focus:ring-blue-50 box-border"
                    />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer bg-transparent border-none"><X size={13} /></button>}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                    <div className="relative">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="w-full sm:w-[140px] appearance-none pl-3 pr-8 py-2.5 text-xs font-bold tracking-wide bg-slate-50 text-slate-700 border border-slate-200 rounded-lg outline-none cursor-pointer hover:bg-slate-100 focus:border-blue-300 focus:ring focus:ring-blue-50 transition-all"
                        >
                            <option value="All">All Types</option>
                            <option value="TEAM_JERSEY">Team Jersey</option>
                            <option value="ORGANIZATIONAL">Organizational</option>
                            <option value="REPAIR">Repair</option>
                        </select>
                        <ChevronDown size={12} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full sm:w-[140px] appearance-none pl-3 pr-8 py-2.5 text-xs font-bold tracking-wide bg-slate-50 text-slate-700 border border-slate-200 rounded-lg outline-none cursor-pointer hover:bg-slate-100 focus:border-blue-300 focus:ring focus:ring-blue-50 transition-all"
                        >
                            <option value="All">All Status</option>
                            <option value="Archived">Archived</option>
                            <option value="Released">Released</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown size={12} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                <div className="hidden sm:block w-px h-6 bg-slate-200 shrink-0" />

                <div className="relative">
                    <select
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                        className="w-full sm:w-[130px] appearance-none pl-3 pr-8 py-2.5 text-xs font-bold tracking-wide bg-slate-50 text-slate-700 border border-slate-200 rounded-lg outline-none cursor-pointer hover:bg-slate-100 focus:border-blue-300 focus:ring focus:ring-blue-50 transition-all"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 bg-slate-50">
                    <Filter size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Results</span>
                    <span className="text-[11px] font-bold text-slate-600 bg-indigo-50 border border-indigo-200 px-2.5 py-px rounded-full">{filtered.length}</span>
                </div>
                {filtered.length === 0 ? (
                    <div className="py-24 px-8 text-center bg-white">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Archive size={28} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No archived orders found</p>
                    </div>
                ) : (
                    <div className="p-5 flex flex-col gap-3 bg-slate-50/30">
                        {filtered.map((order, idx) => {
                            const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.TEAM_JERSEY;
                            const fullId = order.displayId || order.id || '';
                            const shortId = fullId.length > 6 ? fullId.slice(-6) : fullId;
                            const totalQty = order.totalQty || order.items?.reduce((s, i) => s + (i.qty || 0), 0) || 0;

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedId(order.id)}
                                    className="group relative bg-white border border-slate-200 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex items-center gap-6"
                                >
                                    <div className="flex flex-col gap-2 shrink-0 w-24">
                                        <div className="font-mono text-[10px] font-black text-slate-400 bg-slate-100/50 px-2 py-1 rounded-lg border border-slate-200/50 text-center tracking-tighter">
                                            #{shortId}
                                        </div>
                                        <div className={`text-[9px] font-black uppercase tracking-widest ${tc.text} text-center`}>
                                            {tc.label}
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-[15px] font-black text-slate-800 truncate leading-none">
                                                {order.teamName || order.customerName}
                                            </h3>
                                            <span className="shrink-0 text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-tighter">
                                                {order.serviceTitle}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <div className="flex items-center gap-1 text-[11px] font-bold">
                                                <User size={12} className="opacity-50" />
                                                {order.customerName}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <StatusBadge status={order.sourceStatus} />
                                            {order.archivedBy && (
                                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                                    Archived by {order.archivedBy}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats & Actions Section */}
                                    <div className="flex items-center gap-8 shrink-0">
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Items</div>
                                            <div className="text-[16px] font-black text-slate-700 leading-none tabular-nums">
                                                {totalQty}
                                                <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">pcs</span>
                                            </div>
                                        </div>

                                        <div className="text-right border-l border-slate-100 pl-8">
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Completed</div>
                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                <span className="text-[13px] font-bold tracking-tight whitespace-nowrap">{fmtDate(order.completedAt)}</span>
                                            </div>
                                        </div>

                                        <div className="ml-4 flex items-center gap-2">
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setRestoreTarget(order);
                                                }}
                                                disabled={isRestoring}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 disabled:opacity-60 cursor-pointer"
                                            >
                                                <RotateCcw size={12} />
                                                Restore
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedId(order.id); }}
                                                className="w-11 h-11 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200 transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-blue-200 flex items-center justify-center "
                                            >
                                                <ArrowRight size={18} className="transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {filtered.length > 0 && (
                    <div className="flex items-center justify-between py-4 px-8 border-t border-slate-100 bg-white rounded-b-2xl">
                        <span className="text-xs font-medium text-slate-400">
                            Showing <strong className="font-bold text-slate-800">{filtered.length}</strong> of <strong className="font-bold text-slate-800">{archivedOrders.length}</strong> archived orders
                        </span>
                    </div>
                )}
            </div>

            <div className="md:hidden flex flex-col gap-2.5">
                {filtered.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 px-8 text-center shadow-sm">
                        <Archive size={28} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-[13px] font-bold text-slate-400">No archived orders found</p>
                    </div>
                ) : (
                    filtered.map(order => <ArchiveCard key={order._id} order={order} onClick={setSelectedId} onRestore={setRestoreTarget} isRestoring={isRestoring} />)
                )}
            </div>

            <RestoreConfirmModal
                order={restoreTarget}
                onConfirm={handleRestoreConfirm}
                onCancel={() => !isRestoring && setRestoreTarget(null)}
                isRestoring={isRestoring}
            />
        </div>
    );
};

export default ArchivesPage;
