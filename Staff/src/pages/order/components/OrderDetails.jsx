import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, User, Phone, Check, Users, AlertTriangle,
    Package, Calendar, Shirt, ChevronRight, X, Wrench, Scissors, FileText, CheckCircle2
} from 'lucide-react';
import OrderStatusTracker from './OrderStatusTracker';
import useOrderDetails from '../hooks/useOrderDetails';

const STATUS_CONFIG = {
    Completed: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', dot: '#10b981', label: 'Completed' },
    'In Progress': { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', dot: '#3b82f6', label: 'In Progress' },
    Pending: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', dot: '#f59e0b', label: 'Pending' },
    Overdue: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: '#ef4444', label: 'Overdue' },
    OVERDUE: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: '#ef4444', label: 'Overdue' },
};

const ItemIcon = ({ name = '' }) => {
    const n = name.toLowerCase();
    const wrap = (color, children) => (
        <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ background: color + '18', border: `1px solid ${color}30` }}
        >
            {children}
        </span>
    );
    if (n.includes('hoodie'))
        return wrap('#6366f1',
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 4 L3 9 L6 9 L6 20 L18 20 L18 9 L21 9 L19 4 L14 6 Q12 8 10 6 Z" />
                <path d="M10 6 Q12 10 14 6" />
            </svg>
        );
    if (n.includes('short') || n.includes('pant'))
        return wrap('#0ea5e9',
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4 L6 18 L12 14 L18 18 L20 4 Z" />
            </svg>
        );
    if (n.includes('sleeve'))
        return wrap('#8b5cf6', <Shirt size={15} color="#8b5cf6" />);
    if (n.includes('pocket'))
        return wrap('#f59e0b',
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 4 v5 a3 3 0 0 0 6 0 V4" />
            </svg>
        );
    return wrap('#3b82f6', <Shirt size={15} color="#3b82f6" />);
};

const StatusBadge = ({ conf, label }) => (
    <span
        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
        style={{ background: conf.bg, color: conf.text, border: `1px solid ${conf.border}` }}
    >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: conf.dot }} />
        {label}
    </span>
);

const ConfirmationModal = ({ isOpen, stageName, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={onCancel} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center"
                style={{ animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-500">
                    <AlertTriangle size={36} strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Stage Completion</h3>
                <p className="text-sm font-normal text-gray-500 leading-relaxed mb-8">
                    You're going to mark <span className="font-bold text-gray-900">"{stageName}"</span> as finished. This will update the production progress immediately.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onCancel}
                        className="py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all active:scale-[0.97]"
                    >
                        No, keep it.
                    </button>
                    <button
                        onClick={onConfirm}
                        className="py-3.5 px-4 bg-amber-500 hover:bg-amber-700 text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-[0.97]"
                    >
                        Yes, Confirm!
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const OrderDetails = ({ orderId, onBack }) => {
    const { order, steps: initialSteps, currentStepIdx: initialStepIdx, statusLabel } = useOrderDetails(orderId);
    const [productionSteps, setProductionSteps] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingIdx, setPendingIdx] = useState(null);
    const [rosterPage, setRosterPage] = useState(0);

    const ROWS_PER_PAGE = 7;

    useEffect(() => {
        if (initialSteps?.length > 0) {
            setProductionSteps(JSON.parse(JSON.stringify(initialSteps)));
            setCurrentIdx(initialStepIdx);
        }
    }, [initialSteps, initialStepIdx]);

    if (!order) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-gray-500">Order not found.</p>
                <button
                    onClick={onBack}
                    className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                >
                    ← Back to Orders
                </button>
            </div>
        );
    }

    const handleStepClick = (index) => {
        if (index !== currentIdx) return;
        setPendingIdx(index);
        setShowConfirmModal(true);
    };

    const confirmStepChange = () => {
        if (pendingIdx === null) return;
        const index = pendingIdx;
        const now = new Date();
        const finishDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const finishTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const updatedSteps = productionSteps.map((step, idx) => {
            const s = typeof step === 'string' ? { step } : { ...step };
            if (idx === index) return { ...s, done: true, active: false, date: finishDate, time: finishTime, worker: 'Marco Reyes' };
            if (idx === index + 1) return { ...(typeof productionSteps[idx] === 'string' ? { step: productionSteps[idx] } : { ...productionSteps[idx] }), active: true };
            return step;
        });

        setProductionSteps(updatedSteps);
        setCurrentIdx(index + 1 < updatedSteps.length ? index + 1 : updatedSteps.length);
        setShowConfirmModal(false);
        setPendingIdx(null);
    };

    const formatScheduleDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(-2);
            return `${dayName}, ${mm}-${dd}-${yy}`;
        } catch (e) {
            return dateStr;
        }
    };

    const statusConf = STATUS_CONFIG[statusLabel] || STATUS_CONFIG[order?.status] || STATUS_CONFIG.Pending;
    const derivedLabel = currentIdx >= productionSteps.length ? 'Completed' : statusConf.label;
    const displayConf = derivedLabel === 'Completed' ? STATUS_CONFIG.Completed : statusConf;

    const customerName = order.customerName || order.customer;
    const items = order.items || order.invoice?.items || [];
    const teamRoster = order.teamRoster || order.players || [];
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);

    const paginatedRoster = teamRoster.slice(rosterPage * ROWS_PER_PAGE, (rosterPage + 1) * ROWS_PER_PAGE);
    const totalPages = Math.ceil(teamRoster.length / ROWS_PER_PAGE);
    const startIndex = rosterPage * ROWS_PER_PAGE;

    // Padding empty rows to maintain consistent height
    const emptyRowsCount = ROWS_PER_PAGE - paginatedRoster.length;

    const pendingStageName = pendingIdx !== null
        ? (typeof (productionSteps[pendingIdx]?.step || productionSteps[pendingIdx]?.label || productionSteps[pendingIdx]) === 'object'
            ? (productionSteps[pendingIdx].step || productionSteps[pendingIdx].label)
            : String(productionSteps[pendingIdx]?.step || productionSteps[pendingIdx]?.label || productionSteps[pendingIdx]))
        : '';

    return (
        <div className="flex flex-col gap-4" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
            <button
                onClick={onBack}
                className="self-start flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer transition-colors group"
            >
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Job Orders
            </button>

            <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${displayConf.dot}, ${displayConf.dot}88)` }} />
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Order</span>
                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg tracking-wider font-mono leading-none">
                                #{order.id?.slice(-8).toUpperCase()}
                            </span>
                        </div>
                        <StatusBadge conf={displayConf} label={derivedLabel} />
                    </div>

                    <h1 className="text-xl font-black text-gray-900 tracking-tight mb-1 leading-snug">
                        {order.teamName || order.team || order.category || order.item}
                    </h1>
                    <p className="text-xs font-semibold text-gray-400 mb-4 capitalize">
                        {order.serviceTitle || order.serviceType}
                        {order.category && order.teamName ? ` · ${order.category}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <User size={13} className="text-gray-300" /> {customerName}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <Phone size={13} className="text-gray-300" /> {order.contact || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                            Assigned by
                            <span className="text-violet-700 font-bold bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
                                {order.assignedBy || 'Admin'}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Integrated Schedule Section in Header Right */}
                <div className="absolute top-5 right-5 hidden sm:flex flex-col items-end gap-1.5">
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-bold ">
                            <span className="opacity-50">Drop Off:</span>
                            <span className="font-normal">{formatScheduleDate(order.dropDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-bold  ">
                            <span className="opacity-50">Assigned:</span>
                            <span className="font-normal">{formatScheduleDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="opacity-50 text-red-500">Due Date:</span>
                            <span className="text-red-600 font-normal">{formatScheduleDate(order.dueDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <OrderStatusTracker
                steps={productionSteps}
                currentStepIdx={currentIdx}
                onStepClick={handleStepClick}
            />

            <div className="flex flex-col lg:flex-row gap-5 items-start">
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    {teamRoster.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                                <Users size={15} className="text-indigo-500 shrink-0" />
                                <h2 className="text-sm font-bold text-gray-800">Team Roster</h2>
                                <span className="ml-auto text-[10px] font-black text-black bg-gray-50 border border-gray-300 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {teamRoster.length} players
                                </span>
                            </div>

                            <div style={{ overflowX: 'auto', overflowY: 'auto' }} className="scrollbar-hide">
                                <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                            {['Surname', 'No.', 'Jersey', 'Short', 'Add-ons'].map((col, ci) => (
                                                <th
                                                    key={col}
                                                    style={{
                                                        padding: ci === 0 ? '10px 12px 10px 20px' : '10px 12px',
                                                        fontSize: '10px',
                                                        fontWeight: 900,
                                                        color: '#94a3b8',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                        whiteSpace: 'nowrap',
                                                        textAlign: ci === 0 ? 'start' : 'center',
                                                    }}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRoster.map((player, idx) => {
                                            const hasPockets = player.addOns?.some(a => a?.toLowerCase().includes('pocket'));
                                            const otherAddons = player.addOns?.filter(a => !a?.toLowerCase().includes('pocket')) || [];

                                            return (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        height: '52px',
                                                        background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                                                        borderBottom: '1px solid #f1f5f9',
                                                        transition: 'background 0.15s',
                                                    }}
                                                >
                                                    <td style={{ padding: '0 12px 0 20px', fontSize: '13px', fontWeight: 700, color: '#111827', textAlign: 'start' }}>
                                                        {player.surname || '—'}
                                                    </td>
                                                    <td style={{ padding: '0 12px', textAlign: 'center' }}>
                                                        {player.number !== undefined ? (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                minWidth: '2rem',
                                                                color: '#475569',
                                                                padding: '2px 7px',
                                                                fontSize: '11px',
                                                                fontWeight: 900,
                                                                letterSpacing: '0.04em',
                                                            }}>
                                                                #{player.number}
                                                            </span>
                                                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '0 12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                                        {player.jerseySize || <span style={{ color: '#cbd5e1' }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '0 12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                                                        {player.shortSize && player.shortSize !== '-' ? (
                                                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                <span>{player.shortSize}</span>
                                                                {hasPockets && <span style={{ fontSize: '9px', fontWeight: 900, color: '#000000ff', textTransform: 'uppercase', letterSpacing: '-0.05em' }}>/ pockets</span>}
                                                            </div>
                                                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '0 20px 0 12px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                                                        {otherAddons.length > 0 ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                                                                {otherAddons.map((addon, aIdx) => (
                                                                    <span
                                                                        key={aIdx}
                                                                        style={{
                                                                            fontSize: '10px',
                                                                            fontWeight: 700,
                                                                            background: '#f5f3ff',
                                                                            color: '#6d28d9',
                                                                            border: '1px solid #ede9fe',
                                                                            borderRadius: '5px',
                                                                            padding: '1px 7px',
                                                                        }}
                                                                    >
                                                                        {addon}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Placeholder rows for consistent height */}
                                        {[...Array(emptyRowsCount)].map((_, i) => {
                                            const isLastPage = rosterPage === totalPages - 1;
                                            // Show the divider in the first empty row slot of the last page
                                            if (isLastPage && i === 0) {
                                                return (
                                                    <tr key="end-divider" style={{ height: '52px', borderBottom: '1px solid #f1f5f9' }}>
                                                        <td colSpan="5" style={{ padding: '0 20px' }}>
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                                                                <span className="text-[10px] font-bold text-gray-400  tracking-[0.5em] whitespace-nowrap">
                                                                    All items are listed above
                                                                </span>
                                                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return (
                                                <tr key={`empty-${i}`} style={{ height: '52px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <td colSpan="5" style={{ padding: '0 12px' }}>&nbsp;</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="px-5 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setRosterPage(p => Math.max(0, p - 1))}
                                            disabled={rosterPage === 0}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white"
                                        >
                                            <ChevronRight size={14} className="rotate-180" />
                                        </button>

                                        {[...Array(totalPages)].map((_, pi) => (
                                            <button
                                                key={pi}
                                                onClick={() => setRosterPage(pi)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${rosterPage === pi
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600'
                                                    }`}
                                            >
                                                {pi + 1}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setRosterPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={rosterPage === totalPages - 1}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>

                                    <div className="text-[11px] font-bold text-gray-400">
                                        Showing <span className="text-gray-900">{startIndex + 1}-{Math.min(startIndex + ROWS_PER_PAGE, teamRoster.length)}</span> of <span className="text-gray-900">{teamRoster.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {order.type === 'REPAIR' && (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', minHeight: '438px' }}>
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                                <Wrench size={15} className="text-blue-500 shrink-0" />
                                <h2 className="text-sm font-bold text-gray-800">Repair Specification</h2>
                                <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {order.items?.length || 0} Tasks
                                </span>
                            </div>

                            <div className="p-6 flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Shirt size={13} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Garment Overview</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-sm font-bold text-gray-800">{order.category || 'Uniform'}</div>
                                            <div className="text-[11px] font-medium text-gray-500 line-clamp-2">Standard issue production garment requiring technical maintenance.</div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText size={13} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Condition Notes</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-sm font-bold text-gray-800">Standard Wear</div>
                                            <div className="text-[11px] font-medium text-gray-500 truncate">Proceed with standard repair protocol.</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <Scissors size={13} className="text-gray-400" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Breakdown</span>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-white shadow-sm transition-all hover:border-blue-100 group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800">{item.name}</div>
                                                        <div className="text-[10px] font-semibold text-gray-400">Quantity: {item.qty}</div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-tighter rounded-md">
                                                    Verified
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto px-5 py-3 bg-gray-50/30 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 italic">Technical specification provided by Admin</span>
                                    <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter">Read Only</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 lg:sticky lg:top-4 ">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="px-4 py-4.25 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                            <Package size={13} className="text-gray-400 shrink-0" />
                            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Order Items</h3>
                        </div>

                        <div className="divide-y divide-gray-50">
                            <div className="flex items-center px-4 py-2 bg-gray-50/40">
                                <span className="w-8 shrink-0" />
                                <span className="flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-10">Qty</span>
                            </div>

                            {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-4 transition-colors hover:bg-gray-50/60" style={{ height: '52px' }}>
                                    <ItemIcon name={item.name || item.description} />
                                    <span className="flex-1 text-sm font-semibold text-gray-800 leading-tight min-w-0">
                                        {item.name || item.description}
                                    </span>
                                    <span
                                        className="text-[11px] font-black tabular-nums text-right"
                                        style={{ color: '#000', minWidth: '2rem' }}
                                    >
                                        {item.qty}
                                    </span>
                                </div>
                            ))}

                            <div className="flex items-center gap-3 px-4 bg-gray-50/30" style={{ height: '52px' }}>
                                <span className="w-8 shrink-0" />
                                <span className="flex-1 text-xs font-bold text-gray-900 uppercase tracking-wider">Total</span>
                                <span className="text-xs font-black text-black tabular-nums text-right min-w-[2rem]">
                                    {totalQty}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="rounded-2xl p-5 flex items-center justify-between gap-4"
                style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
                    border: '1px solid #c7d2fe',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl  flex items-center justify-center ">
                        <AlertTriangle size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-0.5">Staff Reminder</h4>
                        <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                            Follow the production timeline. Ensure items printed match the total count in the group roster.
                        </p>
                    </div>
                </div>
                <div className="hidden sm:block px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-lg border border-indigo-100/50">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Quality Check Required</span>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                stageName={pendingStageName}
                onConfirm={confirmStepChange}
                onCancel={() => { setShowConfirmModal(false); setPendingIdx(null); }}
            />
        </div>
    );
};

export default OrderDetails;
