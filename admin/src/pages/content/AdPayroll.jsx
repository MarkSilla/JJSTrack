import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, Settings, Download, Search, ChevronRight,
    Check, Users, Package, Banknote, Clock,
    X, Plus, Minus, Save, Filter, Eye,
    ArrowUpRight, ArrowDownRight, ChevronDown,
} from 'lucide-react';

// Shared data
const EMPLOYEE_DB = [
    { id: 'EMP-001', name: 'Juan Dela Cruz', role: 'Tailor', type: 'tailor' },
    { id: 'EMP-002', name: 'Maria Santos', role: 'Senior Tailor', type: 'tailor' },
    { id: 'EMP-003', name: 'Remy Cruz', role: 'Tailor', type: 'tailor' },
    { id: 'EMP-004', name: 'Ben Aquino', role: 'Sewing Staff', type: 'tailor' },
    { id: 'EMP-005', name: 'Ana Villanueva', role: 'Production Staff', type: 'tailor' },
    { id: 'EMP-006', name: 'Marco Reyes', role: 'Tailor', type: 'tailor' },
];

const DEFAULT_PIECE_RATES = {
    'Jersey': 35, 'Shorts': 30, 'Polo': 40,
    'Jacket': 65, 'T-Shirt': 28, 'Uniform': 38,
};

const MOCK_ORDERS = [
    {
        id: 'ORD-2026-001', customer: 'Barangay FC', status: 'Completed', tailorId: 'EMP-001', date: 'Mar 1, 2026',
        invoice: { items: [{ description: 'Jersey', qty: 12, unitPrice: 350, itemType: 'Jersey' }, { description: 'Shorts', qty: 12, unitPrice: 200, itemType: 'Shorts' }] },
    },
    {
        id: 'ORD-2026-002', customer: 'Eagles Basketball', status: 'In-Progress', tailorId: 'EMP-002', date: 'Mar 3, 2026',
        invoice: { items: [{ description: 'Jersey', qty: 15, unitPrice: 380, itemType: 'Jersey' }, { description: 'Shorts', qty: 15, unitPrice: 220, itemType: 'Shorts' }] },
    },
    {
        id: 'ORD-2026-003', customer: 'City Volleyball', status: 'In-Progress', tailorId: null, date: 'Mar 5, 2026',
        invoice: { items: [{ description: 'Jersey', qty: 10, unitPrice: 360, itemType: 'Jersey' }, { description: 'Shorts', qty: 10, unitPrice: 210, itemType: 'Shorts' }] },
    },
    {
        id: 'ORD-2026-004', customer: 'Warriors FC', status: 'Completed', tailorId: 'EMP-001', date: 'Feb 20, 2026',
        invoice: { items: [{ description: 'Jersey', qty: 18, unitPrice: 340, itemType: 'Jersey' }, { description: 'Shorts', qty: 18, unitPrice: 195, itemType: 'Shorts' }, { description: 'Jacket', qty: 5, unitPrice: 600, itemType: 'Jacket' }] },
    },
    {
        id: 'ORD-2026-005', customer: 'Titan Sports', status: 'Pending', tailorId: null, date: 'Mar 7, 2026',
        invoice: { items: [{ description: 'Jersey', qty: 20, unitPrice: 370, itemType: 'Jersey' }, { description: 'Shorts', qty: 20, unitPrice: 215, itemType: 'Shorts' }] },
    },
    {
        id: 'ORD-2026-006', customer: 'Metro Badminton', status: 'Completed', tailorId: 'EMP-002', date: 'Feb 10, 2026',
        invoice: { items: [{ description: 'Polo', qty: 8, unitPrice: 400, itemType: 'Polo' }, { description: 'Shorts', qty: 8, unitPrice: 200, itemType: 'Shorts' }] },
    },
    {
        id: 'ORD-2026-007', customer: 'Rizal Runners', status: 'Completed', tailorId: 'EMP-003', date: 'Feb 25, 2026',
        invoice: { items: [{ description: 'Jersey', qty: 10, unitPrice: 360, itemType: 'Jersey' }, { description: 'Shorts', qty: 10, unitPrice: 200, itemType: 'Shorts' }] },
    },
    {
        id: 'ORD-2026-008', customer: 'Makati FC', status: 'Completed', tailorId: 'EMP-001', date: 'Feb 15, 2026',
        invoice: { items: [{ description: 'Jersey', qty: 14, unitPrice: 355, itemType: 'Jersey' }, { description: 'Shorts', qty: 14, unitPrice: 205, itemType: 'Shorts' }, { description: 'Jacket', qty: 14, unitPrice: 580, itemType: 'Jacket' }] },
    },
];

const PAYROLL_PERIOD = 'March 2026';

// Pure helpers
const isCompletedOrder = (o) => o.status === 'Completed' || o.status === 'Complete';
const formatPeso = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const getAvatarStyle = (empId) => ({
    background: `hsl(${Number(empId.replace('EMP-', '')) * 47}, 65%, 90%)`,
    color: `hsl(${Number(empId.replace('EMP-', '')) * 47}, 65%, 32%)`,
});

const calcTailorData = (orders, tailorId, rates) => {
    const doneOrders = orders.filter(o => isCompletedOrder(o) && o.tailorId === tailorId);
    const itemTotals = {};
    const breakdown = [];

    doneOrders.forEach(order => {
        let orderEarnings = 0;
        const orderLines = [];
        (order.invoice?.items || []).forEach(item => {
            const iType = item.itemType || item.description;
            const rate = rates[iType] ?? 0;
            const earned = rate * item.qty;
            orderEarnings += earned;
            itemTotals[iType] = (itemTotals[iType] || 0) + item.qty;
            orderLines.push({ type: iType, qty: item.qty, rate, earned });
        });
        breakdown.push({ orderId: order.id, customer: order.customer, date: order.date, orderEarnings, lines: orderLines });
    });

    const totalPieces = Object.values(itemTotals).reduce((s, q) => s + q, 0);
    const totalEarnings = breakdown.reduce((s, b) => s + b.orderEarnings, 0);
    return { completedOrders: doneOrders.length, itemTotals, breakdown, totalPieces, totalEarnings };
};

const buildPayrollTable = (orders, rates) =>
    EMPLOYEE_DB.map(emp => ({ ...emp, ...calcTailorData(orders, emp.id, rates) }));

const getAllItemTypes = (orders) => {
    const types = new Set();
    orders.forEach(o => (o.invoice?.items || []).forEach(i => types.add(i.itemType || i.description)));
    return [...types];
};

// Rate Settings Modal
const RateSettingsModal = ({ rates, onSave, onClose }) => {
    const [localRates, setLocalRates] = useState({ ...rates });
    const [newItem, setNewItem] = useState('');
    const [newRate, setNewRate] = useState('');

    const incrementRate = (item, delta) => setLocalRates(r => ({ ...r, [item]: Math.max(0, (r[item] || 0) + delta) }));
    const removeRate = (item) => { const c = { ...localRates }; delete c[item]; setLocalRates(c); };
    const addNewRate = () => { if (!newItem.trim()) return; setLocalRates(r => ({ ...r, [newItem.trim()]: Number(newRate) || 0 })); setNewItem(''); setNewRate(''); };
    const saveAndClose = () => { onSave(localRates); onClose(); };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border border-gray-100">
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Settings size={14} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-black text-gray-900">Piece Rate Table</h2>
                            <p className="text-[10px] text-gray-400 mt-0.5">PHP per piece per clothing type</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 bg-transparent border-none cursor-pointer">
                        <X size={15} className="text-gray-400" />
                    </button>
                </div>

                <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-2">
                    {Object.entries(localRates).map(([item, rate]) => (
                        <div key={item} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-3">
                            <span className="flex-1 text-[13px] font-semibold text-gray-700">{item}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => incrementRate(item, -5)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 cursor-pointer border-solid transition-colors"><Minus size={12} /></button>
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 min-w-[80px] justify-center">
                                    <span className="text-[11px] text-gray-400">₱</span>
                                    <input type="number" value={rate} onChange={e => setLocalRates(r => ({ ...r, [item]: Number(e.target.value) }))} className="w-12 text-[13px] font-bold text-gray-800 text-center outline-none bg-transparent" />
                                </div>
                                <button onClick={() => incrementRate(item, 5)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-500 hover:text-blue-600 cursor-pointer border-solid transition-colors"><Plus size={12} /></button>
                                <button onClick={() => removeRate(item)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors"><X size={13} /></button>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New item type…" className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12px] outline-none focus:border-blue-300" />
                        <input value={newRate} onChange={e => setNewRate(e.target.value)} type="number" placeholder="₱" className="w-20 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12px] outline-none focus:border-blue-300 text-center" />
                        <button onClick={addNewRate} className="w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold border-none cursor-pointer transition-colors flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                </div>

                <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 py-3 text-[13px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border-solid">Cancel</button>
                    <button onClick={saveAndClose} className="flex-1 py-3 text-[13px] font-semibold text-white bg-blue-600 rounded-xl border-none cursor-pointer hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
                        <Save size={13} /> Save Rates
                    </button>
                </div>
            </div>
        </div>
    );
};

const PayrollCard = ({ row, isPaid, isExpanded, onToggleExpand, onTogglePaid }) => {
    const hasEarnings = row.totalEarnings > 0;

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isExpanded ? 'border-blue-200' : 'border-gray-100'}`}>
            <div
                className={`px-4 py-3.5 cursor-pointer ${isExpanded ? 'bg-blue-50/40' : ''}`}
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black shrink-0" style={getAvatarStyle(row.id)}>
                        {row.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-gray-900 leading-tight">{row.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{row.role} · {row.id}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        {hasEarnings
                            ? <span className={`text-[15px] font-black ${isPaid ? 'text-emerald-600' : 'text-gray-900'}`}>{formatPeso(row.totalEarnings)}</span>
                            : <span className="text-gray-400 text-[12px] font-medium">No earnings</span>
                        }
                        {hasEarnings && (
                            isPaid
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full"><Check size={9} /> Paid</span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full"><Clock size={9} /> Pending</span>
                        )}
                    </div>
                    <ChevronRight size={15} className={`text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {hasEarnings && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {Object.entries(row.itemTotals).map(([type, qty]) => (
                            <span key={type} className="text-[10px] font-semibold text-gray-600 bg-gray-100 rounded-lg px-2 py-1">
                                {qty} {type}
                            </span>
                        ))}
                        <span className="text-[10px] text-gray-400 font-medium ml-auto">{row.totalPieces} pcs · {row.completedOrders} orders</span>
                    </div>
                )}
            </div>
            <div className="px-4 pb-3.5 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <span className="text-[10px] text-gray-400 font-medium">{PAYROLL_PERIOD}</span>
                <button
                    onClick={() => hasEarnings && onTogglePaid()}
                    disabled={!hasEarnings}
                    className={`ml-auto px-4 py-2 text-[12px] font-bold rounded-xl border-none cursor-pointer transition-colors
                        ${!hasEarnings
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isPaid
                                ? 'bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-700'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isPaid ? 'Unmark Paid' : 'Mark as Paid'}
                </button>
            </div>
            {isExpanded && row.breakdown.length > 0 && (
                <div className="border-t border-blue-100 bg-blue-50/30 px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
                        <Eye size={11} /> Order Breakdown
                    </div>
                    <div className="space-y-2.5">
                        {row.breakdown.map((ord) => (
                            <div key={ord.orderId} className="bg-white rounded-xl border border-gray-100 px-3.5 py-3 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">{ord.orderId}</span>
                                        <div className="text-[12px] font-bold text-gray-700 mt-1 max-w-[200px] sm:max-w-none truncate">{ord.customer}</div>
                                        <div className="text-[10px] text-gray-400">{ord.date}</div>
                                    </div>
                                    <span className="text-[13px] font-black text-emerald-700 shrink-0">{formatPeso(ord.orderEarnings)}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {ord.lines.map((line, i) => (
                                        <div key={i} className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
                                            <span className="font-bold text-gray-800">{line.qty}</span>
                                            <span>{line.type}s</span>
                                            <span className="text-gray-400">×</span>
                                            <span className="font-bold text-gray-700">₱{line.rate}</span>
                                            <span className="text-gray-300">=</span>
                                            <span className="font-black text-emerald-700">₱{line.earned.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between bg-blue-600 rounded-xl px-4 py-2.5">
                        <span className="text-[11px] font-bold text-blue-100">Total — {row.name}</span>
                        <span className="text-[15px] font-black text-white">{formatPeso(row.totalEarnings)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function AdPayroll({ onBack }) {
    const [pieceRates, setPieceRates] = useState(DEFAULT_PIECE_RATES);
    const [showRateModal, setShowRateModal] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [markedPaid, setMarkedPaid] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPaid, setFilterPaid] = useState('All');
    const [sortField, setSortField] = useState('name');
    const [showFilters, setShowFilters] = useState(false);

    const payrollRows = useMemo(() => buildPayrollTable(MOCK_ORDERS, pieceRates), [pieceRates]);
    const allItemTypes = useMemo(() => getAllItemTypes(MOCK_ORDERS), []);

    const filteredRows = useMemo(() => {
        let rows = [...payrollRows];
        if (searchQuery) rows = rows.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filterPaid === 'Paid') rows = rows.filter(r => markedPaid[r.id]);
        if (filterPaid === 'Pending') rows = rows.filter(r => !markedPaid[r.id] && r.totalEarnings > 0);
        if (sortField === 'earnings') rows.sort((a, b) => b.totalEarnings - a.totalEarnings);
        if (sortField === 'pieces') rows.sort((a, b) => b.totalPieces - a.totalPieces);
        if (sortField === 'orders') rows.sort((a, b) => b.completedOrders - a.completedOrders);
        return rows;
    }, [payrollRows, searchQuery, filterPaid, markedPaid, sortField]);

    const summaryStats = useMemo(() => {
        const totalPayroll = payrollRows.reduce((s, r) => s + r.totalEarnings, 0);
        const totalPieces = payrollRows.reduce((s, r) => s + r.totalPieces, 0);
        const paidOut = payrollRows.filter(r => markedPaid[r.id]).reduce((s, r) => s + r.totalEarnings, 0);
        return { totalPayroll, totalPieces, paidOut, pendingPayout: totalPayroll - paidOut, activeTailors: payrollRows.filter(r => r.totalEarnings > 0).length };
    }, [payrollRows, markedPaid]);

    const togglePaid = (empId) => setMarkedPaid(p => ({ ...p, [empId]: !p[empId] }));
    const toggleExpand = (empId) => setExpandedRow(prev => prev === empId ? null : empId);

    return (
        <div className="font-inter min-h-screen bg-slate-50">

            {/* PAGE HEADER */}
            <div className="px-4 lg:px-6 pt-4 pb-2 z-10 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <>
                                <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer transition-colors">
                                    <ArrowLeft size={14} /> Orders
                                </button>
                                <div className="w-px h-5 bg-gray-200" />
                            </>
                        )}
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-none">Payroll Tracking</h1>
                            <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5">Piece-based salary · {PAYROLL_PERIOD}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                        <button onClick={() => setShowRateModal(true)} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2.5 sm:py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-semibold rounded-xl cursor-pointer transition-colors border-solid shadow-sm">
                            <Settings size={14} className="text-gray-500" />
                            <span>Rate Table</span>
                        </button>
                        <button className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2.5 sm:py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-semibold rounded-xl cursor-pointer transition-colors border-solid shadow-sm">
                            <Download size={14} className="text-gray-500" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 lg:px-6 py-2 sm:py-3">

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                    {[
                        { label: 'Total Payroll', value: formatPeso(summaryStats.totalPayroll), icon: Banknote, accent: '#2563EB', bgAccent: '#EFF6FF', sub: 'All period', span2: true },
                        { label: 'Paid Out', value: formatPeso(summaryStats.paidOut), icon: Check, accent: '#059669', bgAccent: '#ECFDF5', sub: 'Released' },
                        { label: 'Pending', value: formatPeso(summaryStats.pendingPayout), icon: Clock, accent: '#D97706', bgAccent: '#FFFBEB', sub: 'Due' },
                        { label: 'Total Pieces', value: summaryStats.totalPieces + ' pcs', icon: Package, accent: '#7C3AED', bgAccent: '#F5F3FF', sub: 'Count' },
                        { label: 'Tailors', value: summaryStats.activeTailors, icon: Users, accent: '#0891B2', bgAccent: '#ECFEFF', sub: 'Active' },
                    ].map(({ icon: Icon, label, value, sub, accent, bgAccent, span2 }) => (
                        <div
                            key={label}
                            className={`bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default ${span2 ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}
                            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                        >
                            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: bgAccent }}>
                                    <Icon size={15} color={accent} strokeWidth={2.2} />
                                </div>
                                <div className="text-[10px] font-bold rounded-lg px-1.5 py-0.5 bg-violet-50 text-violet-600">Live</div>
                            </div>
                            <div className="text-[18px] sm:text-[20px] font-extrabold text-gray-900 leading-none tracking-tight">{value}</div>
                            <div className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
                        </div>
                    ))}
                </div>

                {/* RATE REFERENCE BAR */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-700 shrink-0">
                        <Settings size={12} /> Current Rates:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(pieceRates).map(([item, rate]) => (
                            <span key={item} className="text-[11px] font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg px-2 py-1">
                                {item} <span className="font-black text-blue-800">₱{rate}</span>/pc
                            </span>
                        ))}
                    </div>
                </div>

                {/* FILTER BAR */}
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search employee…"
                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-xl text-[12px] text-gray-700 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`sm:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${showFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            <Filter size={13} />
                        </button>
                    </div>
                    <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mt-3 pt-3 border-t border-gray-100`}>
                        <div className="flex flex-wrap items-center gap-2 flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto">
                            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto mb-1 sm:mb-0">
                                <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1"><Filter size={11} /> Status:</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                {['All', 'Paid', 'Pending'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setFilterPaid(opt)}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center
                                            ${filterPaid === opt ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1" />
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                            <span className="text-[11px] text-gray-400 font-semibold">Sort by:</span>
                            <select
                                value={sortField}
                                onChange={e => setSortField(e.target.value)}
                                className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-[11px] font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg outline-none cursor-pointer focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                            >
                                <option value="name">Name A–Z</option>
                                <option value="earnings">Highest Earnings</option>
                                <option value="pieces">Most Pieces</option>
                                <option value="orders">Most Orders</option>
                            </select>
                        </div>
                        <span className="text-[11px] text-gray-400 sm:ml-auto text-center sm:text-right mt-2 sm:mt-0 font-medium w-full sm:w-auto">{filteredRows.length} of {EMPLOYEE_DB.length} tailors</span>
                    </div>
                </div>
                <div className="lg:hidden space-y-3">
                    {filteredRows.map((row) => (
                        <PayrollCard
                            key={row.id}
                            row={row}
                            isPaid={!!markedPaid[row.id]}
                            isExpanded={expandedRow === row.id}
                            onToggleExpand={() => toggleExpand(row.id)}
                            onTogglePaid={() => togglePaid(row.id)}
                        />
                    ))}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                        <div className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">Totals</div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[12px] text-gray-600">{filteredRows.reduce((s, r) => s + r.totalPieces, 0)} total pieces</div>
                            </div>
                            <div className="text-[18px] font-black text-blue-700">{formatPeso(filteredRows.reduce((s, r) => s + r.totalEarnings, 0))}</div>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full border-collapse text-sm min-w-[1250px]">
                            <thead>
                                <tr className="border-b-2 border-gray-100 bg-gray-50/80">
                                    <th className="w-8 px-3 py-3.5" />
                                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Employee</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Employee ID</th>
                                    {allItemTypes.map(type => (
                                        <th key={type} className="text-right px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {type} Sewn
                                        </th>
                                    ))}
                                    <th className="text-right px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Total Pieces</th>
                                    <th className="text-right px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Total Earnings</th>
                                    <th className="text-center px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Period</th>
                                    <th className="text-center px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row) => {
                                    const isExpanded = expandedRow === row.id;
                                    const isPaid = !!markedPaid[row.id];
                                    const hasEarnings = row.totalEarnings > 0;

                                    return (
                                        <React.Fragment key={row.id}>
                                            <tr
                                                className={`border-b border-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/60'}`}
                                                onClick={() => toggleExpand(row.id)}
                                            >
                                                <td className="px-3 py-4 text-center">
                                                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={getAvatarStyle(row.id)}>
                                                            {row.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] font-bold text-gray-900 leading-tight">{row.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{row.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-[12px] font-bold text-gray-500">{row.id}</td>
                                                {allItemTypes.map(type => (
                                                    <td key={type} className="px-4 py-4 text-right text-[13px] font-semibold text-gray-700">
                                                        {row.itemTotals[type]
                                                            ? <span>{row.itemTotals[type]} <span className="text-[10px] text-gray-400 font-medium">pcs</span></span>
                                                            : <span className="text-gray-300">—</span>
                                                        }
                                                    </td>
                                                ))}
                                                <td className="px-4 py-4 text-right">
                                                    {hasEarnings
                                                        ? <span className="text-[13px] font-bold text-gray-900">{row.totalPieces} <span className="text-[10px] text-gray-400">pcs</span></span>
                                                        : <span className="text-gray-300 text-sm">—</span>
                                                    }
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {hasEarnings
                                                        ? <span className={`text-[15px] font-black ${isPaid ? 'text-emerald-600' : 'text-gray-900'}`}>{formatPeso(row.totalEarnings)}</span>
                                                        : <span className="text-gray-400 text-sm font-medium">No earnings</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-4 text-center text-[11px] font-semibold text-gray-500">{PAYROLL_PERIOD}</td>
                                                <td className="px-4 py-4 text-center">
                                                    {!hasEarnings ? (
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">—</span>
                                                    ) : isPaid ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                                                            <Check size={10} /> Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                                                            <Clock size={10} /> Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => hasEarnings && togglePaid(row.id)}
                                                        disabled={!hasEarnings}
                                                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border-none cursor-pointer transition-colors
                                                            ${!hasEarnings
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : isPaid
                                                                    ? 'bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-700'
                                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            }`}
                                                    >
                                                        {isPaid ? 'Unmark' : 'Mark Paid'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Breakdown row */}
                                            {isExpanded && row.breakdown.length > 0 && (
                                                <tr>
                                                    <td colSpan={6 + allItemTypes.length} className="p-0">
                                                        <div className="bg-blue-50/30 border-t border-b border-blue-100/60 px-6 py-4">
                                                            <div className="text-[11px] font-black uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
                                                                <Eye size={12} /> Order Breakdown — {row.name}
                                                            </div>
                                                            <div className="space-y-3">
                                                                {row.breakdown.map((ord) => (
                                                                    <div key={ord.orderId} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                                                                        <div className="flex items-center justify-between mb-2.5">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{ord.orderId}</span>
                                                                                <span className="text-[12px] font-bold text-gray-700">{ord.customer}</span>
                                                                                <span className="text-[10px] text-gray-400">{ord.date}</span>
                                                                            </div>
                                                                            <span className="text-[13px] font-black text-emerald-700">{formatPeso(ord.orderEarnings)}</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {ord.lines.map((line, i) => (
                                                                                <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                                                                                    <span className="font-bold text-gray-800">{line.qty}</span>
                                                                                    <span>{line.type}s</span>
                                                                                    <span className="text-gray-400">×</span>
                                                                                    <span className="font-bold text-gray-700">₱{line.rate}</span>
                                                                                    <span className="text-gray-300">=</span>
                                                                                    <span className="font-black text-emerald-700">₱{line.earned.toLocaleString()}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="mt-3 flex items-center justify-between bg-blue-600 rounded-xl px-4 py-2.5">
                                                                <span className="text-[12px] font-bold text-blue-100">Total Earnings — {row.name}</span>
                                                                <span className="text-[16px] font-black text-white">{formatPeso(row.totalEarnings)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-200 bg-gray-50">
                                    <td colSpan={3} className="px-5 py-4 text-[12px] font-black text-gray-600 uppercase tracking-wider">Totals</td>
                                    {allItemTypes.map(type => (
                                        <td key={type} className="px-4 py-4 text-right text-[12px] font-black text-gray-700">
                                            {filteredRows.reduce((s, r) => s + (r.itemTotals[type] || 0), 0)} pcs
                                        </td>
                                    ))}
                                    <td className="px-4 py-4 text-right text-[13px] font-black text-gray-900">
                                        {filteredRows.reduce((s, r) => s + r.totalPieces, 0)} pcs
                                    </td>
                                    <td className="px-5 py-4 text-right text-[15px] font-black text-blue-700">
                                        {formatPeso(filteredRows.reduce((s, r) => s + r.totalEarnings, 0))}
                                    </td>
                                    <td colSpan={3} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {showRateModal && (
                <RateSettingsModal rates={pieceRates} onSave={setPieceRates} onClose={() => setShowRateModal(false)} />
            )}
        </div>
    );
}