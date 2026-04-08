import React, { useState, useMemo } from 'react';
import {
    Archive, Search, CheckCircle2, Package, Users, Wrench,
    Calendar, ChevronDown, X, Eye, Filter, Shirt, ChevronRight,
    ArrowLeft, User, Phone, CheckCheck,
} from 'lucide-react';
import { ARCHIVED_ORDERS } from './order/mock/mockArchives';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (str) => {
    if (!str || str === 'N/A') return '—';
    try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return str; }
};

const TYPE_CONFIG = {
    BOOKING: { label: 'Booking', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', icon: Package },
    REPAIR:  { label: 'Repair',  bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', icon: Wrench  },
};

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    card: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    },
    sectionHead: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px',
        borderBottom: '1px solid #F1F5F9',
        background: '#F8FAFC',
    },
    labelXs: {
        fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: '#94A3B8',
    },
};

// ─── Atoms ────────────────────────────────────────────────────────────────────

const Pill = ({ bg, text, border, children, style = {} }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.7,
        background: bg, color: text, border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
        ...style,
    }}>
        {children}
    </span>
);

const MonoTag = ({ children, style = {} }) => (
    <span style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 11, fontWeight: 700, color: '#3B82F6',
        background: '#EFF6FF', border: '1px solid #BFDBFE',
        padding: '3px 9px', borderRadius: 7,
        ...style,
    }}>
        {children}
    </span>
);

const ItemIcon = ({ name = '' }) => {
    const n = name.toLowerCase();
    const base = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    };
    if (n.includes('hoodie'))
        return <span style={{ ...base, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 4 L3 9 L6 9 L6 20 L18 20 L18 9 L21 9 L19 4 L14 6 Q12 8 10 6 Z" />
                <path d="M10 6 Q12 10 14 6" />
            </svg>
        </span>;
    if (n.includes('short') || n.includes('pant'))
        return <span style={{ ...base, background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4 L6 18 L12 14 L18 18 L20 4 Z" />
            </svg>
        </span>;
    if (n.includes('sleeve') || n.includes('jersey'))
        return <span style={{ ...base, background: '#FDF4FF', border: '1px solid #E9D5FF' }}>
            <Shirt size={15} color="#7C3AED" />
        </span>;
    return <span style={{ ...base, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <Shirt size={15} color="#64748B" />
    </span>;
};

// ─── Archive Detail View ──────────────────────────────────────────────────────

const ArchiveDetail = ({ order, onBack }) => {
    const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.BOOKING;
    const customerName = order.customerName || order.customer;
    const items = order.items || [];
    const steps = order.productionProgress || [];
    const TypeIcon = tc.icon;

    return (
        <div style={{
            fontFamily: "'Inter','system-ui',sans-serif",
            display: 'flex', flexDirection: 'column', gap: 16,
        }}>
            {/* Back */}
            <button
                onClick={onBack}
                style={{
                    alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600, color: '#64748B',
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
            >
                <ArrowLeft size={14} /> Back to Archives
            </button>

            {/* ── Order Header Card ── */}
            <div style={{ ...T.card, position: 'relative' }}>
                {/* Green accent bar */}
                <div style={{ height: 4, background: 'linear-gradient(90deg,#10B981 0%,#34D399 60%,#6EE7B7 100%)' }} />

                <div style={{ padding: '22px 24px 20px' }}>
                    {/* Badge row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        <MonoTag>#{order.id?.slice(-8).toUpperCase()}</MonoTag>
                        <Pill bg="#ECFDF5" text="#065F46" border="#6EE7B7">
                            <CheckCircle2 size={10} /> Completed
                        </Pill>
                        <Pill bg={tc.bg} text={tc.text} border={tc.border}>
                            <TypeIcon size={10} /> {tc.label}
                        </Pill>
                    </div>

                    {/* Title */}
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px', lineHeight: 1.2, marginBottom: 4 }}>
                        {order.teamName || order.category || order.serviceTitle}
                    </h1>
                    <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 16 }}>
                        {order.serviceTitle}{order.category && order.teamName ? ` · ${order.category}` : ''}
                    </p>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                            <User size={13} color="#CBD5E1" /> {customerName}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                            <Phone size={13} color="#CBD5E1" /> {order.contact || 'N/A'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94A3B8' }}>
                            Assigned by
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: '#6D28D9',
                                background: '#F5F3FF', border: '1px solid #DDD6FE',
                                padding: '2px 9px', borderRadius: 7,
                            }}>{order.assignedBy || 'Admin'}</span>
                        </span>
                    </div>
                </div>

                {/* Dates — top right */}
                <div style={{
                    position: 'absolute', top: 24, right: 24,
                    display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end',
                }} className="detail-dates">
                    {[
                        { label: 'Drop off', value: fmtDate(order.dropDate), color: '#475569' },
                        { label: 'Due date', value: fmtDate(order.dueDate), color: '#DC2626' },
                        { label: 'Completed', value: fmtDate(order.completedAt), color: '#059669' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Production Timeline ── */}
            <div style={T.card}>
                <div style={T.sectionHead}>
                    <CheckCheck size={15} color="#10B981" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Production Timeline</span>
                    <Pill bg="#ECFDF5" text="#065F46" border="#A7F3D0" style={{ marginLeft: 'auto', fontSize: 10 }}>
                        All steps done
                    </Pill>
                </div>
                <div style={{ padding: '22px 24px' }}>
                    {steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                            {idx < steps.length - 1 && (
                                <div style={{
                                    position: 'absolute', left: 15, top: 34, bottom: 0,
                                    width: 2, background: 'linear-gradient(180deg, #D1FAE5 0%, #E2E8F0 100%)',
                                    borderRadius: 2,
                                }} />
                            )}
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #10B981, #34D399)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 0 4px #ECFDF5, 0 2px 8px rgba(16,185,129,0.25)',
                                zIndex: 1,
                            }}>
                                <CheckCircle2 size={15} color="#fff" strokeWidth={2.5} />
                            </div>
                            <div style={{ paddingBottom: idx < steps.length - 1 ? 26 : 0, flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.4 }}>{step.step}</div>
                                <div style={{ display: 'flex', gap: 14, marginTop: 3, flexWrap: 'wrap' }}>
                                    {step.date && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                            <Calendar size={10} /> {step.date}
                                        </span>
                                    )}
                                    {step.worker && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                            <User size={10} /> {step.worker}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Items + Roster ── */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* Order Items */}
                <div style={{ ...T.card, flex: '1 1 280px' }}>
                    <div style={T.sectionHead}>
                        <Package size={14} color="#64748B" />
                        <span style={T.labelXs}>Order Items</span>
                    </div>
                    {/* Column headers */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr auto',
                        padding: '8px 20px', borderBottom: '1px solid #F1F5F9',
                        background: '#FAFAFA',
                    }}>
                        <span style={T.labelXs}>Item</span>
                        <span style={{ ...T.labelXs, textAlign: 'right' }}>Qty</span>
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center',
                            padding: '0 20px', height: 54,
                            borderBottom: '1px solid #F8FAFC',
                            background: idx % 2 === 0 ? '#fff' : '#FDFDFD',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, overflow: 'hidden' }}>
                                <ItemIcon name={item.name || item.description} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.name || item.description}
                                </span>
                            </div>
                            <span style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 13, fontWeight: 700, color: '#0F172A',
                            }}>{item.qty}</span>
                        </div>
                    ))}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 20px', borderTop: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                        <span style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 15, fontWeight: 800, color: '#0F172A',
                        }}>{order.totalQty || items.reduce((s, i) => s + (i.qty || 0), 0)}</span>
                    </div>
                </div>

                {/* Team Roster */}
                {order.teamRoster?.length > 0 && (
                    <div style={{ ...T.card, flex: '1 1 320px' }}>
                        <div style={T.sectionHead}>
                            <Users size={14} color="#6366F1" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Team Roster</span>
                            <Pill bg="#EEF2FF" text="#3730A3" border="#C7D2FE" style={{ marginLeft: 'auto', fontSize: 10 }}>
                                {order.teamRoster.length} players
                            </Pill>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                                        {['Surname', 'No.', 'Jersey', 'Short'].map((col, ci) => (
                                            <th key={col} style={{
                                                padding: ci === 0 ? '10px 14px 10px 20px' : '10px 14px',
                                                ...T.labelXs,
                                                textAlign: ci === 0 ? 'left' : 'center', whiteSpace: 'nowrap',
                                            }}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.teamRoster.map((player, idx) => (
                                        <tr key={idx} style={{
                                            height: 50,
                                            background: idx % 2 === 0 ? '#fff' : '#FAFAFA',
                                            borderBottom: '1px solid #F1F5F9',
                                        }}>
                                            <td style={{ padding: '0 14px 0 20px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{player.surname || '—'}</td>
                                            <td style={{ padding: '0 14px', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#6366F1' }}>#{player.number}</td>
                                            <td style={{ padding: '0 14px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569' }}>{player.jerseySize || '—'}</td>
                                            <td style={{ padding: '0 14px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569' }}>{player.shortSize !== '-' ? player.shortSize : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Archive Notice ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '16px 22px', borderRadius: 16,
                background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                border: '1px solid #BBF7D0',
                boxShadow: '0 1px 3px rgba(16,185,129,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Archive size={18} color="#16A34A" />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Archive Record</div>
                        <p style={{ fontSize: 12, color: '#15803D', lineHeight: 1.5, fontWeight: 500 }}>
                            This order has been completed and archived. All production stages finished successfully.
                        </p>
                    </div>
                </div>
                <div style={{
                    flexShrink: 0, padding: '6px 16px', borderRadius: 10,
                    background: '#fff', border: '1px solid #BBF7D0',
                    fontSize: 10, fontWeight: 800, color: '#16A34A',
                    textTransform: 'uppercase', letterSpacing: '0.09em',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                    Read Only
                </div>
            </div>
        </div>
    );
};

// ─── Mobile Archive Card ───────────────────────────────────────────────────────

const ArchiveCard = ({ order, onClick }) => {
    const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.BOOKING;
    const TypeIcon = tc.icon;
    return (
        <button
            onClick={() => onClick(order.id)}
            style={{
                width: '100%', textAlign: 'left',
                background: '#fff', border: '1px solid #E2E8F0',
                borderRadius: 14, padding: '16px 18px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.15s, transform 0.1s',
            }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <MonoTag>#{order.id?.slice(-8).toUpperCase()}</MonoTag>
                <Pill bg={tc.bg} text={tc.text} border={tc.border}>
                    <TypeIcon size={9} /> {tc.label}
                </Pill>
            </div>
            <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                    {order.teamName || order.category || order.serviceTitle}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginTop: 3 }}>{order.customerName}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                    <CheckCircle2 size={12} color="#34D399" /> Completed {fmtDate(order.completedAt)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>
                    View <ChevronRight size={12} />
                </span>
            </div>
        </button>
    );
};

// ─── Main Archives Page ────────────────────────────────────────────────────────

const ArchivesPage = () => {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');
    const [tableHover, setTableHover] = useState(null);

    const filtered = useMemo(() => {
        let list = [...ARCHIVED_ORDERS];
        if (typeFilter !== 'All') list = list.filter(o => o.type === typeFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(o =>
                (o.teamName || '').toLowerCase().includes(q) ||
                (o.customerName || '').toLowerCase().includes(q) ||
                (o.serviceTitle || '').toLowerCase().includes(q) ||
                o.id?.slice(-8).toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const da = new Date(a.completedAt), db = new Date(b.completedAt);
            return sortOrder === 'newest' ? db - da : da - db;
        });
        return list;
    }, [search, typeFilter, sortOrder]);

    const selectedOrder = ARCHIVED_ORDERS.find(o => o.id === selectedId);

    if (selectedOrder) return (
        <div style={{ minHeight: 'calc(100vh - 80px)' }}>
            <ArchiveDetail order={selectedOrder} onBack={() => setSelectedId(null)} />
        </div>
    );

    const totalBooking = ARCHIVED_ORDERS.filter(o => o.type === 'BOOKING').length;
    const totalRepair = ARCHIVED_ORDERS.filter(o => o.type === 'REPAIR').length;

    const kpiCards = [
        { label: 'Total Archived', value: ARCHIVED_ORDERS.length, icon: Archive, color: '#059669', light: '#ECFDF5', border: '#A7F3D0', filter: 'All' },
        { label: 'Team Bookings', value: totalBooking, icon: Package, color: '#2563EB', light: '#EFF6FF', border: '#BFDBFE', filter: 'BOOKING' },
        { label: 'Repair Jobs', value: totalRepair, icon: Wrench, color: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE', filter: 'REPAIR' },
    ];

    return (
        <div style={{ fontFamily: "'Inter','system-ui',sans-serif", display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 13,
                        background: 'linear-gradient(135deg, #059669, #10B981)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                    }}>
                        <Archive size={21} color="#fff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 21, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                            Archives
                        </h1>
                        <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                            Completed orders &amp; production history
                        </p>
                    </div>
                </div>
                <Pill bg="#ECFDF5" text="#065F46" border="#A7F3D0">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', animation: 'pulse 2s infinite' }} />
                    {ARCHIVED_ORDERS.length} records
                </Pill>
            </div>

            {/* ── KPI Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {kpiCards.map(k => {
                    const isActive = typeFilter === k.filter;
                    return (
                        <button
                            key={k.label}
                            onClick={() => setTypeFilter(k.filter)}
                            style={{
                                background: isActive ? k.light : '#fff',
                                border: isActive ? `2px solid ${k.border}` : '1px solid #E2E8F0',
                                borderRadius: 16, padding: '18px 20px',
                                cursor: 'pointer', textAlign: 'left',
                                position: 'relative', overflow: 'hidden',
                                boxShadow: isActive
                                    ? `0 4px 20px rgba(0,0,0,0.08), 0 0 0 3px ${k.light}`
                                    : '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                                transition: 'all 0.18s ease',
                                transform: 'translateY(0)',
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = isActive
                                    ? `0 4px 20px rgba(0,0,0,0.08), 0 0 0 3px ${k.light}`
                                    : '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)';
                            }}
                        >
                            {/* Decorative circle */}
                            <div style={{
                                position: 'absolute', top: -20, right: -16,
                                width: 80, height: 80, borderRadius: '50%',
                                background: k.color, opacity: isActive ? 0.1 : 0.05,
                                transition: 'opacity 0.2s',
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: isActive ? k.color : k.light,
                                    border: `1px solid ${k.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: isActive ? `0 4px 12px ${k.color}44` : 'none',
                                    transition: 'all 0.18s',
                                }}>
                                    <k.icon size={20} color={isActive ? '#fff' : k.color} strokeWidth={2} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? k.color : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                                        {k.label}
                                    </div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.8px' }}>
                                        {k.value}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Filters Bar ── */}
            <div style={{
                ...T.card,
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
            }}>
                {/* Search */}
                <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <Search size={14} color="#CBD5E1" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Search by name, team, or order ID…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', paddingLeft: 34, paddingRight: search ? 34 : 12,
                            paddingTop: 9, paddingBottom: 9,
                            fontSize: 13, fontWeight: 500, color: '#1E293B',
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            borderRadius: 10, outline: 'none', fontFamily: 'inherit',
                            transition: 'border-color 0.15s, box-shadow 0.15s',
                            boxSizing: 'border-box',
                        }}
                        onFocus={e => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px #EFF6FF'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{
                                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#94A3B8', lineHeight: 1, padding: 2,
                            }}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} className="hidden sm:block" />

                {/* Type chips */}
                <div style={{ display: 'flex', gap: 6 }}>
                    {[['All', 'All'], ['BOOKING', 'Booking'], ['REPAIR', 'Repair']].map(([val, label]) => {
                        const active = typeFilter === val;
                        return (
                            <button
                                key={val}
                                onClick={() => setTypeFilter(val)}
                                style={{
                                    padding: '6px 14px', borderRadius: 9,
                                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    border: active ? '1px solid transparent' : '1px solid #E2E8F0',
                                    background: active ? '#0F172A' : '#F8FAFC',
                                    color: active ? '#fff' : '#64748B',
                                    transition: 'all 0.15s',
                                    letterSpacing: '0.02em',
                                }}
                                onMouseOver={e => { if (!active) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; } }}
                                onMouseOut={e => { if (!active) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; } }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Sort dropdown */}
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <select
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                        style={{
                            appearance: 'none',
                            paddingLeft: 12, paddingRight: 30, paddingTop: 7, paddingBottom: 7,
                            fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
                            background: '#F8FAFC', color: '#475569',
                            border: '1px solid #E2E8F0', borderRadius: 9,
                            outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <ChevronDown size={12} color="#94A3B8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* ── Desktop Table ── */}
            <div className="hidden md:block" style={T.card}>
                {/* Table header strip */}
                <div style={{ ...T.sectionHead, gap: 10 }}>
                    <Filter size={12} color="#94A3B8" />
                    <span style={T.labelXs}>Results</span>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: '#475569',
                        background: '#EEF2FF', border: '1px solid #C7D2FE',
                        padding: '1px 9px', borderRadius: 20,
                    }}>{filtered.length}</span>
                </div>

                {filtered.length === 0 ? (
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <Archive size={24} color="#CBD5E1" />
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>No archived orders found</p>
                        <p style={{ fontSize: 12, color: '#CBD5E1', marginTop: 6 }}>Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #F1F5F9' }}>
                                {[
                                    { label: 'Order ID', w: '130px' },
                                    { label: 'Type', w: '120px' },
                                    { label: 'Client / Team', w: 'auto' },
                                    { label: 'Service', w: '170px' },
                                    { label: 'Completed', w: '150px' },
                                    { label: 'Items', w: '80px' },
                                    { label: '', w: '90px' },
                                ].map(({ label, w }, ci) => (
                                    <th key={label + ci} style={{
                                        padding: ci === 0 ? '11px 14px 11px 22px' : '11px 14px',
                                        width: w,
                                        ...T.labelXs,
                                        textAlign: 'left', whiteSpace: 'nowrap',
                                    }}>{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order, idx) => {
                                const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.BOOKING;
                                const TypeIcon = tc.icon;
                                const isHovered = tableHover === order.id;
                                return (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelectedId(order.id)}
                                        onMouseOver={() => setTableHover(order.id)}
                                        onMouseOut={() => setTableHover(null)}
                                        style={{
                                            height: 62, cursor: 'pointer',
                                            background: isHovered ? '#EFF6FF' : (idx % 2 === 0 ? '#fff' : '#FAFAFA'),
                                            borderBottom: '1px solid #F1F5F9',
                                            transition: 'background 0.12s',
                                        }}
                                    >
                                        {/* Order ID */}
                                        <td style={{ padding: '0 14px 0 22px' }}>
                                            <MonoTag>#{order.id?.slice(-8).toUpperCase()}</MonoTag>
                                        </td>
                                        {/* Type */}
                                        <td style={{ padding: '0 14px' }}>
                                            <Pill bg={tc.bg} text={tc.text} border={tc.border}>
                                                <TypeIcon size={9} /> {tc.label}
                                            </Pill>
                                        </td>
                                        {/* Client / Team */}
                                        <td style={{ padding: '0 14px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                                                {order.teamName || order.customerName}
                                            </div>
                                            {order.teamName && (
                                                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                                                    {order.customerName}
                                                </div>
                                            )}
                                        </td>
                                        {/* Service */}
                                        <td style={{ padding: '0 14px', fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                                            {order.serviceTitle}
                                        </td>
                                        {/* Completed */}
                                        <td style={{ padding: '0 14px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#059669' }}>
                                                <CheckCircle2 size={13} color="#34D399" strokeWidth={2.5} />
                                                {fmtDate(order.completedAt)}
                                            </span>
                                        </td>
                                        {/* Items */}
                                        <td style={{ padding: '0 14px' }}>
                                            <span style={{
                                                fontFamily: "'JetBrains Mono',monospace",
                                                fontSize: 13, fontWeight: 700, color: '#334155',
                                            }}>
                                                {order.totalQty || order.items?.reduce((s, i) => s + (i.qty || 0), 0)}
                                                <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginLeft: 3 }}>pcs</span>
                                            </span>
                                        </td>
                                        {/* Action */}
                                        <td style={{ padding: '0 22px 0 14px' }}>
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedId(order.id); }}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    fontSize: 12, fontWeight: 700, color: '#3B82F6',
                                                    background: isHovered ? '#DBEAFE' : '#EFF6FF',
                                                    border: '1px solid #BFDBFE',
                                                    padding: '6px 14px', borderRadius: 9, cursor: 'pointer',
                                                    transition: 'background 0.12s',
                                                }}
                                            >
                                                <Eye size={13} /> View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Table Footer */}
                {filtered.length > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '11px 22px', borderTop: '1px solid #F1F5F9',
                        background: '#FAFAFA',
                    }}>
                        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                            Showing{' '}
                            <strong style={{ color: '#1E293B', fontWeight: 700 }}>{filtered.length}</strong>
                            {' '}of{' '}
                            <strong style={{ color: '#1E293B', fontWeight: 700 }}>{ARCHIVED_ORDERS.length}</strong>
                            {' '}archived orders
                        </span>
                        <Pill bg="#ECFDF5" text="#065F46" border="#A7F3D0">
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
                            All Completed
                        </Pill>
                    </div>
                )}
            </div>

            {/* ── Mobile Cards ── */}
            <div className="md:hidden flex flex-col gap-2.5">
                {filtered.length === 0 ? (
                    <div style={{ ...T.card, padding: '4rem 2rem', textAlign: 'center' }}>
                        <Archive size={28} color="#E2E8F0" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1' }}>No archived orders found</p>
                        <p style={{ fontSize: 11, color: '#E2E8F0', marginTop: 4 }}>Try adjusting your search or filter</p>
                    </div>
                ) : (
                    filtered.map(order => (
                        <ArchiveCard key={order.id} order={order} onClick={setSelectedId} />
                    ))
                )}
            </div>
        </div>
    );
};

export default ArchivesPage;