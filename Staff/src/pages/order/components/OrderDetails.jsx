import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft, User, Phone, Check, Users, AlertTriangle,
    Package, Shirt, ChevronRight, Wrench, Scissors, FileText, CheckCircle2, Inbox, Image as ImageIcon, Eye, X,
    ExternalLink, Link as LinkIcon
} from 'lucide-react';
import OrderStatusTracker from './OrderStatusTracker';
import useOrderDetails from '../hooks/useOrderDetails';
import { bookingApi } from '../../../services/bookingApi';
import img from '../../../assets/img';

const STATUS_CONFIG = {
    Completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
    'In Progress': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500', label: 'In Progress' },
    Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
    Overdue: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500', label: 'Overdue' },
    OVERDUE: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500', label: 'Overdue' },
};

const ItemIcon = ({ name = '' }) => {
    const n = name.toLowerCase();
    if (n.includes('hoodie'))
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-indigo-50 border border-indigo-100"><Shirt size={15} className="text-indigo-500" /></span>;
    if (n.includes('short') || n.includes('pant'))
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-sky-50 border border-sky-100"><Scissors size={15} className="text-sky-500" /></span>;
    if (n.includes('sleeve'))
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-violet-50 border border-violet-100"><Shirt size={15} className="text-violet-500" /></span>;
    if (n.includes('pocket'))
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-amber-50 border border-amber-100"><Inbox size={15} className="text-amber-500" /></span>;
    return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-blue-50 border border-blue-100"><Shirt size={15} className="text-blue-500" /></span>;
};

const StatusBadge = ({ conf, label }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${conf.bg} ${conf.text} ${conf.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} />
        {label}
    </span>
);

const ConfirmationModal = ({ isOpen, stageName, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 transition-opacity" onClick={onCancel} />
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
    const [orgImageIdx, setOrgImageIdx] = useState(0);
    const [zoomType, setZoomType] = useState(null);

    const ROWS_PER_PAGE = 7;
    const orgImages = order?.designImages || (order?.lineupImage ? [order.lineupImage] : [img.sample, img.sample, img.sample]);

    useEffect(() => {
        if (initialSteps?.length > 0) {
            setProductionSteps(JSON.parse(JSON.stringify(initialSteps)));
            setCurrentIdx(initialStepIdx);
        }
    }, [initialSteps, initialStepIdx]);

    const imageUrls = useMemo(() => {
        if (!order) return [];
        const urls = [];
        const append = (value) => {
            if (!value) return;
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (typeof item === 'string' && item) urls.push(item);
                });
            } else if (typeof value === 'string' && value) {
                urls.push(value);
            }
        };

        append(order.photos);
        append(order.designFile);
        append(order.orgDesignFile);
        append(order.repairImage);
        append(order.lineupImage);

        return Array.from(new Set(urls));
    }, [order]);

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

    const confirmStepChange = async () => {
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
        
        // Save steps to backend
        try {
            console.log('💾 Saving production steps to backend:', { orderId, updatedSteps });
            await bookingApi.updateBooking(orderId, { steps: updatedSteps });
            console.log('✅ Production steps saved successfully');
        } catch (err) {
            console.error('❌ Error saving production steps:', err);
            alert('Failed to save progress. Changes won\'t be retained on reload.');
        }
        
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
                <ArrowLeft size={15} />
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
                        {order.serviceTitle || order.serviceType || order.bookingType || order.type || 'Service'}
                        {order.category && order.teamName ? ` · ${order.category}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <User size={13} className="text-gray-300" /> {customerName}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <Phone size={13} className="text-gray-300" /> {order.contact?.phone || order.phone || 'N/A'}
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
                            <span className="font-normal">{order ? formatScheduleDate(order.dropDate) : 'Loading...'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-bold  ">
                            <span className="opacity-50">Assigned:</span>
                            <span className="font-normal">{order ? formatScheduleDate(order.createdAt) : 'Loading...'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="opacity-50 text-red-500">Due Date:</span>
                            <span className="text-red-600 font-normal">{order ? (formatScheduleDate(order.dueDate) || formatScheduleDate(order.pickupDate) || 'Not set') : 'Loading...'}</span>
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
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden w-full min-w-0"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                                <Users size={15} className="text-indigo-500 shrink-0" />
                                <h2 className="text-sm font-bold text-gray-800">Team Roster</h2>
                                <span className="ml-auto text-[10px] font-black text-black bg-gray-50 border border-gray-300 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {teamRoster.length} players
                                </span>
                            </div>

                            <div className="max-w-full overflow-x-auto">
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

                                        {[...Array(emptyRowsCount)].map((_, i) => {
                                            const isLastPage = rosterPage === totalPages - 1;
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
                                {(order.notes || order.repairImage) && (
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {order.notes && (
                                            <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FileText size={13} className="text-gray-500" />
                                                    <span className="text-md font-black text-black uppercase tracking-widest">Repair Notes</span>
                                                </div>
                                                <div className="text-[12px] font-medium text-gray-700 leading-relaxed">
                                                    {order.notes}
                                                </div>
                                            </div>
                                        )}
                                        {order.repairImage && (
                                            <div className="w-full md:w-64 h-40 shrink-0 relative group rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                                                <div className="w-full h-full cursor-pointer overflow-hidden flex items-center justify-center relative" onClick={() => setZoomType('REPAIR')}>
                                                    <img src={order.repairImage} alt="Repair Reference" className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]" onError={e => { e.currentTarget.src = img.sample; }} />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center z-10">
                                                        <div className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md transition-opacity">
                                                            <Eye size={13} /> Click to expand
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

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

                            </div>
                        </div>
                    )}

                    {(order.type === 'ORGANIZATION' || order.type === 'ORGANIZATIONAL' || order.serviceType === 'Organization') && (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                                <Shirt size={15} className="text-teal-500 shrink-0" />
                                <h2 className="text-sm font-bold text-gray-800">Organization Lineup</h2>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                        {orgImageIdx + 1} / {orgImages.length}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50/50">
                                <div className="relative group rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center aspect-square flex-shrink-0">
                                    <div className="w-full h-full cursor-pointer overflow-hidden flex items-center justify-center relative" onClick={() => setZoomType('ORG')}>
                                        <img
                                            src={orgImages[orgImageIdx] || img.sample}
                                            alt={`Lineup ${orgImageIdx + 1}`}
                                            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02] relative z-10"
                                            onError={e => { e.currentTarget.src = img.sample; }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center z-[15]">
                                            <div className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md transition-opacity">
                                                <Eye size={13} /> Click to expand
                                            </div>
                                        </div>
                                    </div>

                                    {orgImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setOrgImageIdx((prev) => (prev - 1 + orgImages.length) % orgImages.length)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-teal-600 z-20"
                                            >
                                                <ChevronRight size={18} className="rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => setOrgImageIdx((prev) => (prev + 1) % orgImages.length)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-teal-600 z-20"
                                            >
                                                <ChevronRight size={18} />
                                            </button>

                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/30 backdrop-blur-md z-20">
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

                            {/* Total Price Section */}
{(() => {
                                // Use backend totalPrice first, fallback to items sum, then 0
                                const calculatedTotal = order.totalPrice ?? 
                                    items.reduce((sum, item) => sum + (item.qty * (item.unitPrice || 0) + ((item.addOnPrice || 0) * item.qty)), 0) ?? 
                                    0;
                                    
                                return (
                                    <div className="flex items-center gap-3 px-4 bg-blue-50/50 border-t border-gray-200" style={{ height: '52px' }}>
                                        <span className="w-8 shrink-0" />
                                        <span className="flex-1 text-xs font-bold text-gray-900 uppercase tracking-wider">Total Price</span>
                                        <span className="text-sm font-black text-blue-600 tabular-nums text-right min-w-[2rem]">
                                            ₱{calculatedTotal.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {imageUrls.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="px-4 py-4.25 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                            <ImageIcon size={13} className="text-gray-400 shrink-0" />
                            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Uploaded Images</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                {imageUrls.map((src, index) => (
                                    <a
                                        key={`${src}-${index}`}
                                        href={src}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm"
                                    >
                                        <img
                                            src={src}
                                            alt={`Uploaded image ${index + 1}`}
                                            className="w-full h-32 object-cover"
                                            onError={(e) => { e.currentTarget.src = img.sample; }}
                                        />
                                    </a>
                                ))}
                            </div>
                            {order?.driveLink && (
                                <>
                                    <div className="pt-3 border-t border-gray-100">
                                        <a
                                            href={order.driveLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center gap-3 p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-2xl transition-all hover:shadow-sm"
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all">
                                                <ExternalLink size={20} className="text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-gray-900 mb-1 truncate" title={order.driveLink}>
                                                    Design Reference (Google Drive)
                                                </p>
                                                <span className="text-xs text-indigo-700 font-semibold bg-indigo-100 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                                                    Open Drive <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                                </span>
                                            </div>
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {zoomType && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in"
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