import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft, User, Phone, Check, Users, AlertTriangle, Archive,
    Package, Shirt, ChevronRight, Wrench, Scissors, FileText, CheckCircle2, Inbox, Image as ImageIcon, Eye, X,
    ExternalLink, Link as LinkIcon, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import OrderStatusTracker from './OrderStatusTracker';
import useOrderDetails from '../hooks/useOrderDetails';
import { bookingApi } from '../../../services/bookingApi';
import { orderApi } from '../../../services/orderApi.js';
import img from '../../../assets/img';
import { getPickupSlotDisplay } from '../../../utils/pickupSlot.js';
import { getStoredStaffUser } from '../../../utils/staffSession.js';
import {
    canStaffAccessStep,
    formatWorkflowRoleLabel,
    getCurrentStaffDisplayName,
    getCurrentStaffRole,
    getWorkflowStepRequiredRole,
} from '../../../utils/workflowAccess.js';

const getStaffArchiveActor = () => {
    const staffUser = getStoredStaffUser();
    return staffUser?.fullName || staffUser?.name || staffUser?.email || 'Staff';
};

const summarizeItemsAndAddons = (items, teamRoster = []) => {
    const summary = {};

    items.forEach(item => {
        let name = (item.name || item.description || 'Unknown Item').trim();
        let baseName = name;

        const lastParenMatch = name.match(/\s*\([^)]+\)\s*$/);
        if (lastParenMatch) {
            const innerText = lastParenMatch[0].toLowerCase();
            if (innerText.includes('#') || (!innerText.includes('jersey') && !innerText.includes('short') && !innerText.includes('size'))) {
                baseName = name.replace(/\s*\([^)]+\)\s*$/, '').trim();
            }
        }

        if (!summary[baseName]) {
            summary[baseName] = { name: baseName, qty: 0, total: 0, isBase: true };
        }
        summary[baseName].qty += (item.qty || 1);
        summary[baseName].total += ((item.qty || 1) * (item.unitPrice || 0) + ((item.addOnPrice || 0) * (item.qty || 1)));
    });

    const addonCounts = {};
    let pocketsCount = 0;

    teamRoster.forEach(player => {
        if (player.addOns && Array.isArray(player.addOns)) {
            player.addOns.forEach(addon => {
                const aName = addon.trim();
                if (aName.toLowerCase().includes('pocket')) {
                    pocketsCount++;
                } else if (aName) {
                    addonCounts[aName] = (addonCounts[aName] || 0) + 1;
                }
            });
        }
    });

    Object.entries(addonCounts).forEach(([addon, count]) => {
        const displayName = addon.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const existingKey = Object.keys(summary).find(k => k.toLowerCase().includes(addon.toLowerCase()));
        if (!existingKey) {
            summary[displayName] = { name: displayName, qty: count, total: null, isAddon: true };
        }
    });

    if (pocketsCount > 0) {
        const pocketName = 'Shorts w/ Pockets';
        const existingKey = Object.keys(summary).find(k => k.toLowerCase().includes('pocket'));
        if (!existingKey) {
            summary[pocketName] = { name: pocketName, qty: pocketsCount, total: null, isAddon: true };
        }
    }

    return Object.values(summary);
};

const STATUS_CONFIG = {
    Completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
    Released: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', dot: 'bg-cyan-500', label: 'Released' },
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

const ArchiveConfirmModal = ({ isOpen, onConfirm, onCancel, isArchiving }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 transition-opacity backdrop-blur-sm" onClick={!isArchiving ? onCancel : undefined} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center"
                style={{ animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4 text-amber-500 border border-amber-100">
                    <Archive size={32} strokeWidth={2} />
                </div>

                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Save to Archive?</h3>
                <p className="text-[13px] font-medium text-gray-500 leading-relaxed mb-8 px-2">
                    Are you sure you want to move this order to the archives? This will finalize the record and mark it as completely processed.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isArchiving}
                        className="py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isArchiving}
                        className="py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-[0_4px_12px_rgba(245,158,11,0.25)] active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isArchiving ? 'Saving...' : 'Yes, Archive'}
                    </button>
                </div>
            </div>
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
    const [isArchiving, setIsArchiving] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignments, setAssignments] = useState({
        tailor: '',
        presser: '',
        layoutArtist: '',
    });

    const ROWS_PER_PAGE = 10;
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

        // Role-based access control
        const currentStepLabel = productionSteps[index]?.label || productionSteps[index]?.step || productionSteps[index];
        const staffRole = getCurrentStaffRole();
        const requiredRole = getWorkflowStepRequiredRole(currentStepLabel);

        if (!canStaffAccessStep(currentStepLabel, staffRole)) {
            toast.error(`Only ${formatWorkflowRoleLabel(requiredRole)} can complete the "${currentStepLabel}" step.`);
            return;
        }

        setPendingIdx(index);
        setShowConfirmModal(true);
    };

    const confirmStepChange = async () => {
        if (pendingIdx === null) return;
        const index = pendingIdx;
        const now = new Date();
        const finishDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const finishTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const staffName = getCurrentStaffDisplayName();

        const updatedSteps = productionSteps.map((step, idx) => {
            const s = typeof step === 'string' ? { step } : { ...step };
            if (idx === index) return { ...s, done: true, active: false, date: finishDate, time: finishTime, worker: staffName };
            if (idx === index + 1) return { ...(typeof productionSteps[idx] === 'string' ? { step: productionSteps[idx] } : { ...productionSteps[idx] }), active: true };
            return step;
        });

        setProductionSteps(updatedSteps);
        setCurrentIdx(index + 1 < updatedSteps.length ? index + 1 : updatedSteps.length);

        // Save steps to backend
        try {
            console.log('💾 Saving production steps to backend:', { orderId, updatedSteps });
            if (order?.isBooking) {
                await bookingApi.updateBooking(orderId, { steps: updatedSteps });
            } else {
                await orderApi.updateOrder(orderId, { steps: updatedSteps });
            }
            console.log('✅ Production steps saved successfully');
            toast.success('Progress saved successfully.');
        } catch (err) {
            console.error('❌ Error saving production steps:', err);
            toast.error('Failed to save progress. Changes won\'t be retained on reload.');
        }

        setShowConfirmModal(false);
        setPendingIdx(null);
    };

    const handleArchiveClick = () => {
        setShowArchiveModal(true);
    };

    const confirmArchive = async () => {
        setIsArchiving(true);
        try {
            const archivedAt = new Date().toISOString();
            const archivedBy = getStaffArchiveActor();
            if (order?.isBooking) {
                await bookingApi.updateBooking(orderId, {
                    isArchived: true,
                    completedAt: archivedAt,
                    archivedAt,
                    archivedBy,
                });
            } else {
                await orderApi.updateOrder(orderId, {
                    isArchived: true,
                    completedAt: archivedAt,
                    archivedAt,
                    archivedBy,
                });
            }
            alert('Order successfully saved to archives!');
            setShowArchiveModal(false);
            onBack(); // Return to order list
        } catch (error) {
            console.error('Error archiving order:', error);
            alert('Failed to archive order. Please try again.');
        } finally {
            setIsArchiving(false);
        }
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

    const rawStatus = String(order?.status || '').trim().toLowerCase();
    const statusConf = STATUS_CONFIG[statusLabel] || STATUS_CONFIG[order?.status] || STATUS_CONFIG.Pending;
    const derivedLabel = statusLabel === 'Released' || rawStatus === 'released'
        ? 'Released'
        : currentIdx >= productionSteps.length
            ? 'Completed'
            : statusConf.label;
    const displayConf = STATUS_CONFIG[derivedLabel] || statusConf;

    const customerName = order.customerName || order.customer;
    const items = order.items || order.invoice?.items || [];
    const teamRoster = order.teamRoster || order.players || order.members || [];
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF();
            const teamName = order.teamName || order.team || order.category || order.item || 'N/A';
            const customerContact = order.contact?.phone || order.phone || 'N/A';

            // --- HEADER SECTION ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(40, 40, 40);
            doc.text("JJS SPORTSWEAR", 105, 20, { align: "center" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("CONTACT: 0908 997 2332", 105, 26, { align: "center" });
            doc.text(" Purok 3B National Highway,Calapacuan, Subic, Zambales", 105, 31, { align: "center" });

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 38, 196, 38);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text("TEAM NAME: ", 14, 48);
            doc.setFont("helvetica", "normal");
            doc.text(String(teamName).toUpperCase(), 45, 48);
            doc.line(45, 49, 120, 49);

            doc.setFont("helvetica", "bold");
            doc.text("CONTACT: ", 130, 48);
            doc.setFont("helvetica", "normal");
            doc.text(String(customerContact), 155, 48);
            doc.line(155, 49, 196, 49);

            // --- TABLE SECTION ---
            const tableColumn = [
                { header: "NO.", dataKey: "no" },
                { header: "FULL NAME", dataKey: "name" },
                { header: "NUMBER", dataKey: "number" },
                { header: "JERSEY SIZE", dataKey: "jSize" },
                { header: "SHORT SIZE", dataKey: "sSize" },
                { header: "ADD-ONS", dataKey: "addons" }
            ];

            const tableRows = teamRoster.map((player, idx) => {
                const addOnText = player.addOns && player.addOns.length > 0 ? player.addOns.join(", ") : "None";
                const jerseySize = player.jerseySize || player.size || 'N/A';
                const shortSize = player.shortSize || 'N/A';
                const fullName = [player.firstName, player.surname].filter(Boolean).join(' ').trim() || player.name || 'N/A';

                return {
                    no: `${idx + 1}.`,
                    name: fullName.toUpperCase(),
                    number: player.number !== undefined ? `#${player.number}` : 'N/A',
                    jSize: jerseySize,
                    sSize: shortSize,
                    addons: addOnText
                };
            });

            autoTable(doc, {
                columns: tableColumn,
                body: tableRows,
                startY: 55,
                theme: 'grid',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                    halign: 'center'
                },
                bodyStyles: {
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                    fontSize: 9
                },
                columnStyles: {
                    no: { halign: 'center', cellWidth: 12 },
                    number: { halign: 'center', cellWidth: 20 },
                    jSize: { halign: 'center', cellWidth: 25 },
                    sSize: { halign: 'center', cellWidth: 25 }
                },
                margin: { left: 14, right: 14 }
            });

            doc.save(`ROSTER_${String(teamName).replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF.');
        }
    };

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
        <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
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
                                {order.displayId || order.orderId || order.bookingId || order.id}
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
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="opacity-50">Pickup Time:</span>
                            <span className="font-normal">{order ? getPickupSlotDisplay(order.pickupSlot, 'Not set') : 'Loading...'}</span>
                        </div>
                    </div>

                    {(derivedLabel === 'Completed' || derivedLabel === 'Released' || order?.status === 'Cancelled' || order?.status === 'CANCELLED') && (
                        <button
                            onClick={handleArchiveClick}
                            disabled={isArchiving}
                            className="mt-3 w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-amber-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                        >
                            <Archive size={14} />
                            {isArchiving ? 'Saving...' : 'Save to Archive'}
                        </button>
                    )}
                </div>
            </div>

            {/* Client Notes Section */}
            <OrderStatusTracker
                steps={productionSteps}
                currentStepIdx={currentIdx}
                onStepClick={handleStepClick}
            />

            <div className="flex flex-col lg:flex-row gap-6 items-start w-full overflow-hidden">
                <div className="w-full lg:w-[60%] flex flex-col gap-4 min-w-0">
                    {teamRoster.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <Users size={15} className="text-indigo-500 shrink-0" />
                                <span className="text-[13px] font-bold text-slate-800">Team Roster</span>
                                <span className="text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {teamRoster.length} players
                                </span>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                >
                                    <Download size={13} />
                                    PDF
                                </button>
                            </div>

                            <div className="max-h-[500px] flex flex-col">
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
                    {order?.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                            <div className="bg-amber-100 p-2.5 rounded-xl shrink-0">
                                <FileText size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black tracking-widest uppercase text-amber-600 mb-1">Client Customization Notes</h4>
                                <p className="text-sm font-bold text-amber-900 leading-relaxed italic">
                                    "{order.notes}"
                                </p>
                            </div>
                        </div>
                    )}

                    {order.type === 'REPAIR' && (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm">
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                                <h2 className="text-sm font-bold text-gray-800">Repair Specification</h2>
                                <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {order.items?.length || 0} Tasks
                                </span>
                            </div>

                            <div className="p-6 flex flex-col gap-6">
                                {order.notes && (
                                    <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Repair Notes</span>
                                        </div>
                                        <div className="text-[13px] font-bold text-amber-900/80 leading-relaxed italic">
                                            {order.notes}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Task Breakdown</span>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:border-blue-200 group">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="text-[14px] font-bold text-slate-800">{item.name}</div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Quantity: {item.qty}</div>
                                                    </div>
                                                </div>
                                                <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                                                    Active
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(order.type === 'ORGANIZATION' || order.type === 'ORGANIZATIONAL' || order.serviceType === 'Organization') && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <Shirt size={15} className="text-teal-500 shrink-0" />
                                <span className="text-[13px] font-bold text-slate-800">Organizational Shirt</span>
                                <span className="text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {orgImageIdx + 1} / {orgImages.length}
                                </span>
                                {teamRoster.length > 0 && (
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                    >
                                        <Download size={13} />
                                        Download PDF
                                    </button>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50/50">
                                <div className="relative group rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center aspect-square md:aspect-[16/10]">
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

                {/* Right Column (40%) - Sticky Summary & References */}
                <div className="w-full lg:w-[40%] flex flex-col gap-4 lg:sticky lg:top-4">
                    {/* Design & References Section (Top - New Split Layout) */}
                    {(imageUrls.length > 0 || order?.driveLink) && (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                                {/* Left Side: Uploaded Images */}
                                <div className="p-5 flex flex-col gap-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploaded Images</h3>
                                    <div className="relative group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden aspect-square shadow-inner">
                                        {imageUrls.length > 0 ? (
                                            <img
                                                src={imageUrls[0]}
                                                alt="Design"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => { e.currentTarget.src = img.sample; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2">
                                                <ImageIcon size={32} strokeWidth={1} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">No Image</span>
                                            </div>
                                        )}
                                    </div>
                                    {imageUrls.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {imageUrls.slice(1, 4).map((src, i) => (
                                                <div key={i} className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                                                    <img src={src} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Design References (GDrive) */}
                                <div className="p-5 flex flex-col items-center justify-center gap-6 bg-gray-50/20">
                                    <div className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm">
                                        <ExternalLink size={13} strokeWidth={2.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Design References</span>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center w-full py-4">
                                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-50 flex items-center justify-center mb-6 p-5">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="GDrive" className="w-full h-full object-contain" />
                                        </div>

                                        {order?.driveLink ? (
                                            <a
                                                href={order.driveLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-8 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm border border-blue-100"
                                            >
                                                Open Link <ChevronRight size={15} strokeWidth={3} className="mt-0.5" />
                                            </a>
                                        ) : (
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Link</span>
                                        )}
                                    </div>
                                    <div className="h-2 w-full" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Items Summary (Bottom) */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                            <Package size={15} className="text-gray-400 shrink-0" />
                            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Order Items Summary</h2>
                        </div>

                        <div className="divide-y divide-slate-50">
                            <div className="grid grid-cols-[1fr_auto] items-center px-5 py-2 bg-slate-50/40">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-12">Qty</span>
                            </div>

                            {summarizeItemsAndAddons(items, teamRoster).map((summaryItem, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <ItemIcon name={summaryItem.name} />
                                        <span className="text-[13px] font-bold text-slate-800 leading-tight truncate">
                                            {summaryItem.name}
                                            {summaryItem.isAddon && (
                                                <span className="ml-2 text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-100">
                                                    Add
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-black tabular-nums text-right w-12 text-slate-700">
                                        {summaryItem.qty}
                                    </span>
                                </div>
                            ))}

                            <div className="flex items-center justify-between px-5 py-4 bg-slate-50/80 border-t border-slate-200">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                                <span className="text-[16px] font-black text-blue-600 tabular-nums">
                                    {totalQty}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Repair Reference */}
                    {order.type === 'REPAIR' && (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                                <ImageIcon size={13} className="text-gray-400 shrink-0" />
                                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Repair Reference</h3>
                            </div>
                            <div className="p-3">
                                <div className="relative group rounded-xl border border-gray-200 bg-slate-50 overflow-hidden flex items-center justify-center h-[180px]">
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
                </div>

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

            <ArchiveConfirmModal
                isOpen={showArchiveModal}
                isArchiving={isArchiving}
                onConfirm={confirmArchive}
                onCancel={() => setShowArchiveModal(false)}
            />
        </div>
    );
};

export default OrderDetails;
