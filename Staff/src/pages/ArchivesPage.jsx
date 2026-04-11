import React, { useState, useMemo } from 'react';
import {
    Archive, Search, CheckCircle2, Package, Users, Wrench,
    Calendar, ChevronDown, X, Eye, Filter, Shirt, ChevronRight,
    ArrowLeft, User, Phone, CheckCheck, Activity, Building, Image as ImageIcon
} from 'lucide-react';
import { ARCHIVED_ORDERS, ARCHIVE_ACTIVITY } from './order/mock/mockData';

const fmtDate = (str) => {
    if (!str || str === '—') return '—';
    try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return str; }
};

const TYPE_CONFIG = {
    TEAM_JERSEY: { label: 'Team Jersey', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: Package },
    ORGANIZATIONAL: { label: 'Organizational', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: Building },
    REPAIR: { label: 'Repair', bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', icon: Wrench },
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

const ItemIcon = ({ name = '' }) => {
    const n = name.toLowerCase();
    const base = "inline-flex items-center justify-center w-[34px] h-[34px] rounded-xl shrink-0 border";

    if (n.includes('hoodie'))
        return <span className={`${base} bg-indigo-50 border-indigo-200`}>
            <Shirt size={15} className="text-indigo-600" />
        </span>;
    if (n.includes('short') || n.includes('pant'))
        return <span className={`${base} bg-sky-50 border-sky-200`}>
            <Shirt size={15} className="text-sky-700" />
        </span>;
    if (n.includes('sleeve') || n.includes('jersey') || n.includes('polo'))
        return <span className={`${base} bg-fuchsia-50 border-fuchsia-200`}>
            <Shirt size={15} className="text-violet-600" />
        </span>;
    return <span className={`${base} bg-slate-50 border-slate-200`}>
        <Shirt size={15} className="text-slate-500" />
    </span>;
};

const ArchiveDetail = ({ order, onBack }) => {
    const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.BOOKING;
    const customerName = order.customerName || order.customer;
    const items = order.items || [];
    const steps = order.productionProgress || [];
    const TypeIcon = tc.icon;

    return (
        <div className="font-sans flex flex-col gap-4">
            <button
                onClick={onBack}
                className="self-start inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:text-slate-800"
            >
                <ArrowLeft size={14} /> Back to Archives
            </button>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />

                <div className="pt-5 px-6 pb-5">
                    <div className="flex items-center gap-2 flex-wrap mb-3.5">
                        <MonoTag>#{order.id?.toUpperCase()}</MonoTag>
                        <Pill bg="bg-emerald-50" text="text-emerald-800" border="border-emerald-300">
                            <CheckCircle2 size={10} /> Completed
                        </Pill>
                        <Pill bg={tc.bg} text={tc.text} border={tc.border}>
                            <TypeIcon size={10} /> {tc.label}
                        </Pill>
                    </div>
                    <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug mb-1">
                        {order.teamName || order.category || order.serviceTitle}
                    </h1>
                    <p className="text-xs text-slate-400 font-medium mb-4">
                        {order.serviceTitle}{order.category && order.teamName ? ` · ${order.category}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-y-1.5 gap-x-5">
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                            <User size={13} className="text-slate-300" /> {customerName}
                        </span>
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                            <Phone size={13} className="text-slate-300" /> {order.contact || '—'}
                        </span>
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                            Assigned by
                            <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md ml-1">
                                {order.assignedBy || 'Admin'}
                            </span>
                        </span>
                    </div>
                </div>

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

            <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 w-full">
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
                                    <div className="text-[13px] font-bold text-slate-900 leading-snug">{step.step}</div>
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

                {/* Right Side - Order Items */}
                <div className="flex flex-col gap-4 w-full lg:w-[40%] xl:w-[35%] lg:min-w-[340px]">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                            <Package size={14} className="text-slate-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Items</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] px-5 py-2 border-b border-slate-100 bg-slate-50/30">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Qty</span>
                        </div>
                        {items.map((item, idx) => (
                            <div key={idx} className={`flex items-center px-5 h-[54px] border-b border-slate-100/60 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <ItemIcon name={item.name || item.description} />
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

            {/* Bottom Section - Full Width Roster or Lineup */}
            {order.lineupImage ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <ImageIcon size={16} className="text-indigo-500" />
                        <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Organizational Lineup Image</span>
                    </div>
                    <div className="p-8 flex flex-col items-center">
                        <div className="w-full max-w-4xl aspect-[16/9] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-4 relative overflow-hidden group shadow-inner">
                            <ImageIcon size={48} className="opacity-20 transition-transform group-hover:scale-110" />
                            <div className="text-center p-4">
                                <p className="text-xl font-black text-slate-500 mb-2 uppercase tracking-wide">Lineup Image Provided</p>
                                <p className="text-sm mt-1 text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                                    This organizational order uses a digital lineup record. Click to expand and view the full document archive.
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl text-[13px] font-black text-indigo-600 shadow-2xl border border-indigo-100 pointer-events-auto cursor-pointer flex items-center gap-2">
                                    <Eye size={16} /> VIEW FULL RECORD
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-5 font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                            DATA SOURCE: {order.lineupImage}
                        </p>
                    </div>
                </div>
            ) : order.teamRoster?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <Users size={18} className="text-indigo-500" />
                        <span className="text-[16px] font-black text-slate-800 uppercase tracking-tight px-1">Full Team Roster Details</span>
                        <Pill bg="bg-indigo-50" text="text-indigo-800" border="border-indigo-200" className="ml-auto px-4 py-1 text-xs">
                            {order.teamRoster.length} Players Listed
                        </Pill>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    {['Surname', 'No.', 'Jersey Size', 'Short Size', 'Custom Add-ons'].map((col, ci) => (
                                        <th key={col} className={`py-4 px-6 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap ${ci === 0 ? 'text-left' : 'text-center'}`}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {order.teamRoster.map((player, idx) => (
                                    <tr key={idx} className={`h-[68px] border-b border-slate-100 last:border-0 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                        <td className="px-6 text-[15px] font-black text-slate-900">{player.surname || '—'}</td>
                                        <td className="px-6 text-center font-mono text-[16px] font-black text-indigo-600 bg-indigo-50/40">#{player.number}</td>
                                        <td className="px-6 text-center text-[14px] font-bold text-slate-700">{player.jerseySize || '—'}</td>
                                        <td className="px-6 text-center text-[14px] font-bold text-slate-700">{player.shortSize !== '-' ? player.shortSize : '—'}</td>
                                        <td className="px-6 text-center whitespace-nowrap">
                                            {player.addOns?.length > 0 ? (
                                                <div className="flex flex-wrap justify-center gap-1.5">
                                                    {player.addOns.map((addon, ai) => (
                                                        <span key={ai} className="inline-block px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100 uppercase tracking-tight">
                                                            {addon}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 font-bold italic opacity-60">None</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer Status Banner */}
            <div className="flex items-center justify-between gap-4 p-5 md:px-7 md:py-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/50 border border-emerald-200 shadow-sm flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl shrink-0 bg-white flex items-center justify-center shadow-sm border border-emerald-100">
                        <Archive size={22} className="text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-[12px] font-black text-emerald-900 uppercase tracking-[0.15em] mb-1">Authenticated Archive Record</div>
                        <p className="text-xs text-emerald-700/80 leading-relaxed font-bold italic tracking-tight">
                            This order was verified and finalized on {fmtDate(order.completedAt)}.
                        </p>
                    </div>
                </div>
                <div className="shrink-0 px-6 py-2 rounded-xl bg-white/80 backdrop-blur border border-emerald-200 text-[11px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                    Read Only History
                </div>
            </div>
        </div>
    );
};

const ArchiveCard = ({ order, onClick }) => {
    const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.BOOKING;
    const TypeIcon = tc.icon;
    return (
        <button
            onClick={() => onClick(order.id)}
            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer flex flex-col gap-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
        >
            <div className="flex items-center justify-between gap-2">
                <MonoTag>#{order.id?.toUpperCase().slice(-8)}</MonoTag>
                <Pill bg={tc.bg} text={tc.text} border={tc.border}>
                    <TypeIcon size={9} /> {tc.label}
                </Pill>
            </div>
            <div>
                <div className="text-[15px] font-extrabold text-slate-900 leading-snug">
                    {order.teamName || order.category || order.serviceTitle}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1">{order.customerName}</div>
            </div>
            <div className="flex items-center justify-between mt-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Completed {fmtDate(order.completedAt)}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                    View <ChevronRight size={12} />
                </span>
            </div>
        </button>
    );
};

const ActivityTimeline = ({ activities }) => (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                <h3 className="text-[13px] font-bold text-slate-800">Archive Activity Log</h3>
            </div>
        </div>
        <div className="p-6">
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                {activities.map((activity, idx) => (
                    <div key={idx} className="relative">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 shadow-[0_0_0_4px_white]" />
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-black text-slate-900">{activity.action}</span>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                    {activity.target}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                                <span className="flex items-center gap-1"><User size={10} /> {activity.staffName}</span>
                                <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(activity.timestamp)}</span>
                                <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> Success</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const OrganizationView = ({ orders, onSelect }) => {
    const orgs = useMemo(() => {
        const groups = {};
        orders.forEach(o => {
            const name = o.teamName || 'General / Individual';
            if (!groups[name]) groups[name] = { name, count: 0, items: 0, last: null, orders: [] };
            groups[name].count++;
            groups[name].items += o.totalQty || 0;
            if (!groups[name].last || new Date(o.completedAt) > new Date(groups[name].last)) {
                groups[name].last = o.completedAt;
            }
            groups[name].orders.push(o);
        });
        return Object.values(groups);
    }, [orders]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orgs.map(org => (
                <div key={org.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                            {org.name === 'General / Individual' ? <User size={24} /> : <Building size={24} />}
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Orders</div>
                            <div className="text-2xl font-black text-slate-800 leading-none">{org.count}</div>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{org.name}</h3>
                    <p className="text-xs text-slate-400 font-medium mb-4">Produced {org.items} items to date</p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Last Order</span>
                            <span className="text-[11px] font-bold text-slate-600">{fmtDate(org.last)}</span>
                        </div>
                        <button
                            onClick={() => onSelect(org.orders[0].id)}
                            className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            View Active
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ArchivesPage = () => {
    const [selectedId, setSelectedId] = useState(null);
    const [activeTab, setActiveTab] = useState('list');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');

    const filtered = useMemo(() => {
        let list = [...ARCHIVED_ORDERS];
        if (typeFilter !== 'All') list = list.filter(o => o.type === typeFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(o =>
                (o.teamName || '').toLowerCase().includes(q) ||
                (o.customerName || '').toLowerCase().includes(q) ||
                (o.serviceTitle || '').toLowerCase().includes(q) ||
                o.id?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const da = new Date(a.completedAt), db = new Date(b.completedAt);
            return sortOrder === 'newest' ? db - da : da - db;
        });
        return list;
    }, [search, typeFilter, sortOrder]);

    const stats = useMemo(() => {
        const total = ARCHIVED_ORDERS.length;
        const jerseys = ARCHIVED_ORDERS.filter(o => o.type === 'TEAM_JERSEY').length;
        const orgs = ARCHIVED_ORDERS.filter(o => o.type === 'ORGANIZATIONAL').length;
        const repair = ARCHIVED_ORDERS.filter(o => o.type === 'REPAIR').length;
        return { total, jerseys, orgs, repair };
    }, []);

    const selectedOrder = ARCHIVED_ORDERS.find(o => o.id === selectedId);

    if (selectedOrder) return (
        <div className="min-h-[calc(100vh-80px)]">
            <ArchiveDetail order={selectedOrder} onBack={() => setSelectedId(null)} />
        </div>
    );

    const kpiCards = [
        { label: 'Total Records', value: stats.total, icon: Archive, color: '#059669', filter: 'All', sub: 'Production history' },
        { label: 'Team Jerseys', value: stats.jerseys, icon: Shirt, color: '#3B82F6', filter: 'TEAM_JERSEY', sub: 'Custom sports' },
        { label: 'Organizational', value: stats.orgs, icon: Building, color: '#6366F1', filter: 'ORGANIZATIONAL', sub: 'Corporate/Large' },
        { label: 'Repair Jobs', value: stats.repair, icon: Wrench, color: '#7C3AED', filter: 'REPAIR', sub: 'Maintenance' },
    ];

    return (
        <div className="font-sans flex flex-col gap-4 md:gap-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-[0_4px_14px_rgba(16,185,129,0.3)] text-white">
                        <Archive size={21} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-[21px] font-extrabold text-slate-900 tracking-tight leading-snug">Archives</h1>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Production history and records</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl self-start">
                {[
                    { id: 'list', label: 'Order List', icon: Archive },
                    { id: 'orgs', label: 'Organizations', icon: Building },
                    { id: 'activity', label: 'Activity Log', icon: Activity },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'list' && (
                <>
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-2.5 shadow-sm">
                        <div className="flex-1 min-w-[200px] relative w-full md:w-auto">
                            <Search size={14} className="text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by name, team, or order ID…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 text-[13px] font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none transition-all focus:border-blue-300 focus:ring-[3px] focus:ring-blue-50 box-border"
                            />
                            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer bg-transparent border-none"><X size={13} /></button>}
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-slate-200 shrink-0 mx-1" />
                        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
                            {[
                                ['All', 'All'],
                                ['TEAM_JERSEY', 'Team Jersey'],
                                ['ORGANIZATIONAL', 'Organizational'],
                                ['REPAIR', 'Repair']
                            ].map(([val, label]) => (
                                <button key={val} onClick={() => setTypeFilter(val)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all tracking-wide whitespace-nowrap ${typeFilter === val ? 'bg-slate-900 border-transparent text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'} border`}>{label}</button>
                            ))}
                        </div>
                        <div className="relative ml-auto w-full sm:w-auto">
                            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full sm:w-auto appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold tracking-wide bg-slate-50 text-slate-600 border border-slate-200 rounded-lg outline-none cursor-pointer hover:bg-slate-100 focus:border-blue-300 focus:ring focus:ring-blue-50">
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
                            <div className="py-20 px-8 text-center"><Archive size={24} className="text-slate-300 mx-auto mb-4" /><p className="text-sm font-bold text-slate-400">No archived orders found</p></div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                                        {[{ label: 'Order ID', w: '130px', cls: 'pl-6' }, { label: 'Type', w: '120px' }, { label: 'Client / Team', w: 'auto' }, { label: 'Service', w: '170px' }, { label: 'Completed', w: '150px' }, { label: 'Items', w: '80px' }, { label: '', w: '90px' }].map(({ label, w, cls = '' }, ci) => (
                                            <th key={ci} className={`py-3 px-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap ${cls}`} style={{ width: w }}>{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((order, idx) => {
                                        const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.TEAM_JERSEY;
                                        const TypeIcon = tc.icon;
                                        return (
                                            <tr key={order.id} onClick={() => setSelectedId(order.id)} className={`h-[62px] cursor-pointer border-b border-slate-100 transition-colors duration-150 hover:bg-blue-50 group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="px-3.5 pl-6"><MonoTag>#{order.id?.toUpperCase().slice(-8)}</MonoTag></td>
                                                <td className="px-3.5"><Pill bg={tc.bg} text={tc.text} border={tc.border}><TypeIcon size={9} /> {tc.label}</Pill></td>
                                                <td className="px-3.5"><div className="text-[13px] font-bold text-slate-900 leading-snug">{order.teamName || order.customerName}</div>{order.teamName && <div className="text-[11px] font-medium text-slate-400 mt-0.5">{order.customerName}</div>}</td>
                                                <td className="px-3.5 text-xs font-semibold text-slate-500">{order.serviceTitle}</td>
                                                <td className="px-3.5"><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 size={13} className="text-emerald-400" strokeWidth={2.5} />{fmtDate(order.completedAt)}</span></td>
                                                <td className="px-3.5"><span className="font-mono text-[13px] font-bold text-slate-700">{order.totalQty || order.items?.reduce((s, i) => s + (i.qty || 0), 0)}<span className="text-[10px] font-semibold text-slate-400 ml-1">pcs</span></span></td>
                                                <td className="px-3.5 pr-6 text-right"><button onClick={e => { e.stopPropagation(); setSelectedId(order.id); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-lg transition-colors duration-150 group-hover:bg-blue-100"><Eye size={13} /> View</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {filtered.length > 0 && (
                            <div className="flex items-center justify-between py-3 px-6 border-t border-slate-100 bg-slate-50/80"><span className="text-xs font-medium text-slate-400">Showing <strong className="font-bold text-slate-800">{filtered.length}</strong> of <strong className="font-bold text-slate-800">{ARCHIVED_ORDERS.length}</strong> archived orders</span><Pill bg="bg-emerald-50" text="text-emerald-800" border="border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />All Completed</Pill></div>
                        )}
                    </div>

                    <div className="md:hidden flex flex-col gap-2.5">
                        {filtered.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl py-16 px-8 text-center shadow-sm"><Archive size={28} className="text-slate-200 mx-auto mb-3" /><p className="text-[13px] font-bold text-slate-400">No archived orders found</p></div>
                        ) : (
                            filtered.map(order => <ArchiveCard key={order.id} order={order} onClick={setSelectedId} />)
                        )}
                    </div>
                </>
            )}

            {activeTab === 'orgs' && (
                <OrganizationView orders={ARCHIVED_ORDERS} onSelect={setSelectedId} />
            )}

            {activeTab === 'activity' && (
                <ActivityTimeline activities={ARCHIVE_ACTIVITY} />
            )}
        </div>
    );
};

export default ArchivesPage;
