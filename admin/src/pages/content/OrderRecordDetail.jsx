import React from 'react';
import {
    ArrowLeft,
    Archive,
    Calendar,
    CheckCircle2,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Mail,
    Package,
    Phone,
    User,
    Users,
    Wrench,
    Shirt,
    X,
    ClipboardList,
} from 'lucide-react';
import { fmtDate, getRepairDisplayLabel } from './orderRecordUtils.js';

function TypeBadge({ typeKey }) {
    if (typeKey === 'jersey') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Shirt size={11} />
                Jersey
            </span>
        );
    }

    if (typeKey === 'organizational') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Users size={11} />
                Org
            </span>
        );
    }

    if (typeKey === 'repair') {
        return (
            <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Wrench size={11} />
                Repair
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <Package size={11} />
            Service
        </span>
    );
}

function PayBadge({ status }) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'paid') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={10} />
                Paid
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <X size={10} />
            Unpaid
        </span>
    );
}

const Pill = ({ children, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide leading-relaxed border ${className}`}>
        {children}
    </span>
);

const MonoTag = ({ children, className = '' }) => (
    <span className={`font-mono text-[11px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md ${className}`}>
        {children}
    </span>
);

const PESO_SYMBOL = '\u20B1';
const DEFAULT_POCKET_PRICE = 100;
const VISIBLE_ORDER_ITEMS = 6;

const ADD_ON_CONFIG = {
    warmer: { label: 'Long Sleeve Warmer', price: 750 },
    hoodie: { label: 'Hoodie T-shirt', price: 700 },
};

const JERSEY_PRODUCT_TYPES = {
    jersey: { label: 'Jersey Only', price: 550 },
    fullset: { label: 'Full Set (Jersey + Shorts)', price: 850 },
    short: { label: 'Short Only', price: 400 },
};

const formatCurrency = (value) => `${PESO_SYMBOL}${Number(value || 0).toLocaleString()}`;

const getAddOnMeta = (addOnId) => {
    const key = String(addOnId || '').toLowerCase();
    return ADD_ON_CONFIG[key] || { label: addOnId || 'Add-on', price: 0 };
};

const getPlayerName = (player, index) => {
    const fullName = [player?.firstName, player?.surname].filter(Boolean).join(' ').trim();
    return fullName || player?.name || player?.surname || `Player ${index + 1}`;
};

const getJerseyItemLabel = (player = {}, item = {}) => {
    const productType = String(player?.productType || '').toLowerCase();
    if (JERSEY_PRODUCT_TYPES[productType]) return JERSEY_PRODUCT_TYPES[productType].label;

    const classification = String(player?.classification || item?.type || item?.description || '').trim();
    const normalized = classification.toLowerCase();
    if (normalized.includes('jersey only')) return 'Jersey Only';
    if (normalized.includes('short only')) return 'Short Only';
    if (normalized.includes('full set') || normalized === 'fullset') return 'Full Set (Jersey + Shorts)';
    return classification || 'Team Jersey';
};

const getJerseyBasePrice = (player = {}, item = {}) => {
    const unitPrice = Number(item?.unitPrice);
    if (Number.isFinite(unitPrice) && unitPrice > 0) return unitPrice;

    const productType = String(player?.productType || '').toLowerCase();
    if (JERSEY_PRODUCT_TYPES[productType]) return JERSEY_PRODUCT_TYPES[productType].price;

    const itemLabel = getJerseyItemLabel(player, item).toLowerCase();
    if (itemLabel.includes('jersey only')) return JERSEY_PRODUCT_TYPES.jersey.price;
    if (itemLabel.includes('short only')) return JERSEY_PRODUCT_TYPES.short.price;
    return JERSEY_PRODUCT_TYPES.fullset.price;
};

const getLineTotal = (item = {}) =>
    ((Number(item.qty) || 1) * (Number(item.unitPrice) || 0)) + (Number(item.addOnPrice) || 0);

const Section = ({ icon, title, badge, children }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-slate-500">{icon}</span>
            <span className="text-[12px] sm:text-[13px] font-bold text-slate-800">{title}</span>
            {badge && <span className="ml-auto">{badge}</span>}
        </div>
        <div className="p-3 sm:p-5">{children}</div>
    </div>
);

const Field = ({ label, children }) => (
    <div className="flex flex-col sm:flex-row items-start py-2 sm:py-2.5 border-b border-slate-50 last:border-0 gap-0.5 sm:gap-0">
        <span className="w-full sm:w-28 shrink-0 text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide pt-0 sm:pt-0.5">{label}</span>
        <span className="flex-1 text-[12px] sm:text-[13px] font-medium text-slate-800 leading-snug">{children}</span>
    </div>
);

const getOriginStatusStyles = (status = '') => {
    if (status === 'Cancelled') {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (status === 'Released') {
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
};

const getJerseySizeText = (player) => {
    if (player?.useManualjerseySize) {
        return `${player.jerseyLength || '-'}" x ${player.jerseyBody || '-'}"`;
    }
    if (player?.useManualSize) {
        return `${player.manualBody || '-'}" x ${player.manualLength || '-'}" x ${player.manualSleeveLength || '-'}"`;
    }
    return player?.jerseySize || player?.size || 'N/A';
};

const getShortSizeText = (player) => {
    if (player?.useManualsShortSize) {
        return `${player.shortHips || '-'}" x ${player.shortLength || '-'}"`;
    }
    return player?.shortSize || 'N/A';
};

const getLineupAddOns = (player = {}) => {
    const addOns = Array.isArray(player?.addOns) ? [...player.addOns] : [];

    if (player?.hasPocketShorts || player?.pockets) {
        addOns.unshift('Pockets');
    }

    return addOns.filter(Boolean);
};

export default function OrderRecordDetail({
    record,
    mode = 'released',
    onBack,
    onArchive,
    isArchiving = false,
}) {
    const isArchivedView = mode === 'archived';
    const steps = record?.steps || [];
    const teamRoster = record?.teamRoster || [];
    const isJersey = record?.typeKey === 'jersey';
    const isRepair = record?.typeKey === 'repair';
    const repairDisplayLabel = getRepairDisplayLabel(record);
    const hasImages = Array.isArray(record?.imageUrls) && record.imageUrls.length > 0;
    const [previewImage, setPreviewImage] = React.useState(null);
    const displayItems = React.useMemo(() => {
        const sourceItems = Array.isArray(record?.items) ? record.items : [];

        if (!isJersey || teamRoster.length === 0) {
            return sourceItems.map((item, index) => ({
                id: item?._id || item?.id || `${item?.description || 'item'}-${index}`,
                description: item?.description || item?.name || record?.serviceLabel || 'Service',
                type: item?.type || 'Service',
                qty: Number(item?.qty) || 1,
                unitPrice: Number(item?.unitPrice) || 0,
                addOnPrice: Number(item?.addOnPrice) || 0,
                addOns: [],
                hasPocket: false,
                total: getLineTotal(item),
            }));
        }

        return teamRoster.map((player, index) => {
            const sourceItem = sourceItems[index] || {};
            const addOns = Array.isArray(player?.addOns)
                ? player.addOns.map((addOnId) => ({ id: addOnId, ...getAddOnMeta(addOnId) }))
                : [];
            const hasPocket = Boolean(player?.pockets || player?.hasPocketShorts);
            const addOnPrice = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0) + (hasPocket ? DEFAULT_POCKET_PRICE : 0);
            const itemLabel = getJerseyItemLabel(player, sourceItem);
            const playerName = getPlayerName(player, index);
            const numberSuffix = player?.number !== undefined && player?.number !== null && player?.number !== ''
                ? ` #${player.number}`
                : '';
            const qty = Number(sourceItem?.qty) || 1;
            const unitPrice = getJerseyBasePrice(player, sourceItem);

            return {
                id: sourceItem?._id || sourceItem?.id || `${playerName}-${index}`,
                description: `${itemLabel} (${playerName}${numberSuffix})`,
                type: sourceItem?.type || 'Custom',
                qty,
                unitPrice,
                addOnPrice,
                addOns,
                hasPocket,
                total: (unitPrice * qty) + addOnPrice,
            };
        });
    }, [isJersey, record?.items, record?.serviceLabel, teamRoster]);

    const headerConfig = isArchivedView
        ? {
            backLabel: 'Back to Archives',
            statusPillClass: 'bg-amber-50 text-amber-800 border-amber-200',
            statusLabel: 'Archived',
            accentBar: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300',
            accentText: 'text-amber-600',
        }
        : {
            backLabel: 'Back to Released',
            statusPillClass: 'bg-green-50 text-green-800 border-green-200',
            statusLabel: 'Released',
            accentBar: 'bg-gradient-to-r from-green-500 via-green-400 to-green-300',
            accentText: 'text-green-600',
        };

    const headerDates = isArchivedView
        ? [
            { label: 'Drop off', value: record?.dropDate, color: 'text-slate-600' },
            ...(record?.sourceStatus === 'Released' && record?.releaseDate !== 'N/A'
                ? [{ label: 'Released', value: record?.releaseDate, color: 'text-cyan-600' }]
                : [{ label: 'Final status', value: record?.sourceStatus, color: record?.sourceStatus === 'Cancelled' ? 'text-rose-600' : 'text-slate-600' }]),
            { label: 'Archived', value: record?.archiveDate, color: 'text-amber-600' },
        ]
        : [
            { label: 'Drop off', value: record?.dropDate, color: 'text-slate-600' },
            { label: 'Released', value: record?.releaseDate, color: 'text-green-600' },
        ];

    const isComplex = isJersey || record?.typeKey === 'organizational';

    const timelineSection = (
        <Section
            icon={<CheckCheck size={15} color="#00b400ff" />}
            title="Production Timeline"
        >
            {steps.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No production steps recorded.</p>
            ) : (
                steps.map((step, idx) => (
                    <div key={`${step?.label || step?.step || idx}-${idx}`} className="flex gap-4 relative">
                        {idx < steps.length - 1 && (
                            <div className="absolute left-[15px] top-[34px] bottom-0 w-px bg-slate-200" />
                        )}
                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-[0_0_0_4px_#F8FAFC] z-10 ${isArchivedView ? 'bg-amber-500' : 'bg-green-400'}`}>
                            <CheckCircle2 size={14} />
                        </div>
                        <div className={`flex-1 ${idx < steps.length - 1 ? 'pb-5' : ''}`}>
                            <p className="text-[13px] font-bold text-slate-900 leading-snug">
                                {step?.step || step?.label || `Step ${idx + 1}`}
                            </p>
                            <div className="flex gap-4 mt-1 flex-wrap text-[11px] text-slate-400 font-semibold">
                                {step?.date && <span className="flex items-center gap-1"><Calendar size={10} />{fmtDate(step.date)}</span>}
                                {step?.worker && <span className="flex items-center gap-1"><User size={10} />{step.worker}</span>}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </Section>
    );

    const imagesSection = hasImages && (
        <Section icon={<ImageIcon size={15} />} title="Uploaded Images">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {record.imageUrls.map((src, i) => (
                    <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={() => setPreviewImage({ src, alt: `Image ${i + 1}` })}
                        className="block w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50 hover:opacity-90 transition-opacity cursor-pointer p-0"
                    >
                        <img src={src} alt={`Image ${i + 1}`} className="w-full h-56 object-cover" />
                    </button>
                ))}
            </div>
        </Section>
    );

    const [rosterPage, setRosterPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;

    const rosterSection = isJersey && teamRoster.length > 0 && (() => {
        const totalPages = Math.ceil(teamRoster.length / ITEMS_PER_PAGE);
        const paginatedPlayers = teamRoster.slice(
            (rosterPage - 1) * ITEMS_PER_PAGE,
            rosterPage * ITEMS_PER_PAGE
        );
        const startIndex = (rosterPage - 1) * ITEMS_PER_PAGE + 1;
        const endIndex = Math.min(rosterPage * ITEMS_PER_PAGE, teamRoster.length);

        return (
            <Section
                icon={<Users size={15} />}
                title="Team Roster"
                badge={
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        {teamRoster.length} players
                    </span>
                }
            >
                {/* Premium Grid Header */}
                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 mb-4">
                    <div className="text-center mb-5">
                        <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase">JJS SPORTSWEAR</h2>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Contact: 0908 997 2332</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Purok 3B National Highway, Calapacuan, Subic, Zambales</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-end gap-2">
                            <span className="text-[9px] font-black text-blue-600/70 uppercase tracking-wider mb-1">Headline:</span>
                            <span className="flex-1 border-b border-gray-200 px-2 py-0.5 text-xs font-extrabold text-gray-800 uppercase truncate">
                                {record?.headline || 'N/A'}
                            </span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-[9px] font-black text-blue-600/70 uppercase tracking-wider mb-1">Contact:</span>
                            <span className="flex-1 border-b border-gray-200 px-2 py-0.5 text-xs font-extrabold text-gray-800 truncate">
                                {record?.customerName || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="border border-gray-200 p-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-12">No.</th>
                                <th className="border border-gray-200 p-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">Full Name</th>
                                <th className="border border-gray-200 p-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-20">Number</th>
                                <th className="border border-gray-200 p-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Jersey Size</th>
                                <th className="border border-gray-200 p-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Short Size</th>
                                <th className="border border-gray-200 p-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">Add-ons</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPlayers.map((player, idx) => {
                                const realIdx = startIndex + idx;
                                return (
                                    <tr key={`${player?.surname || player?.name || 'p'}-${idx}`}
                                        className="hover:bg-blue-50/30 transition-colors">
                                        <td className="border border-gray-200 p-2 text-center text-[11px] font-bold text-gray-400">{realIdx}.</td>
                                        <td className="border border-gray-200 p-2 text-[12px] font-extrabold text-gray-900 uppercase">
                                            {player?.surname || player?.name || '—'}
                                        </td>
                                        <td className="border border-gray-200 p-2 text-center text-[12px] font-black text-blue-600">
                                            {player?.number !== undefined ? `#${player.number}` : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="border border-gray-200 p-2 text-center text-[12px] font-bold text-gray-700 bg-gray-50/30">
                                            {getJerseySizeText(player)}
                                        </td>
                                        <td className="border border-gray-200 p-2 text-center text-[12px] font-bold text-gray-700">
                                            {getShortSizeText(player)}
                                        </td>
                                        <td className="border border-gray-200 p-2">
                                            <div className="flex flex-wrap gap-1">
                                                {getLineupAddOns(player).map((addon, ai) => (
                                                    <span key={ai} className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase">
                                                        {addon}
                                                    </span>
                                                ))}
                                                {getLineupAddOns(player).length === 0 && <span className="text-[10px] text-gray-300 italic">None</span>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRosterPage(p => Math.max(1, p - 1))}
                                disabled={rosterPage === 1}
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setRosterPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${rosterPage === pageNum
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setRosterPage(p => Math.min(totalPages, p + 1))}
                                disabled={rosterPage === totalPages}
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{startIndex}-{endIndex}</span> of <span className="text-slate-900">{teamRoster.length}</span>
                        </div>
                    </div>
                )}
            </Section>
        );
    })();

    const contactSection = (
        <Section icon={<User size={15} />} title="Contact">
            <Field label="Name">{record?.customerName}</Field>
            {record?.contact?.phone && (
                <Field label="Phone">
                    <a href={`tel:${record.contact.phone}`} className="text-blue-600 hover:underline">{record.contact.phone}</a>
                </Field>
            )}
            {record?.contact?.email && (
                <Field label="Email">
                    <a href={`mailto:${record.contact.email}`} className="text-blue-600 hover:underline">{record.contact.email}</a>
                </Field>
            )}
            {record?.contact?.address && (
                <Field label="Address">{record.contact.address}</Field>
            )}
        </Section>
    );

    const infoSection = (
        <Section icon={<Package size={15} />} title="Record Info">
            <Field label="Type"><TypeBadge typeKey={record?.typeKey} /></Field>
            <Field label="Service">{record?.serviceLabel}</Field>
            <Field label="Status">
                <div className="flex flex-wrap gap-1.5">
                    <Pill className={headerConfig.statusPillClass}>
                        {isArchivedView ? <Archive size={10} /> : <CheckCircle2 size={10} />}
                        {headerConfig.statusLabel}
                    </Pill>
                    {isArchivedView && (
                        <Pill className={getOriginStatusStyles(record?.sourceStatus)}>{record?.sourceStatus}</Pill>
                    )}
                </div>
            </Field>
            <Field label="Drop Date">{record?.dropDate}</Field>
            {!isArchivedView && (
                <Field label="Released">
                    <span className="font-bold text-green-600">{record?.releaseDate}</span>
                </Field>
            )}
            {!isArchivedView && record?.releasedBy && (
                <Field label="Released By">
                    <span className="font-semibold text-green-700">{record.releasedBy}</span>
                </Field>
            )}
            {isArchivedView && (
                <Field label="Archived">
                    <span className="font-bold text-amber-600">{record?.archiveDate}</span>
                </Field>
            )}
            {isArchivedView && record?.archivedBy && (
                <Field label="Archived By">
                    <span className="font-semibold text-amber-700">{record.archivedBy}</span>
                </Field>
            )}
        </Section>
    );

    const notesSection = (record?.notes || record?.adminNotes || record?.driveLink || record?.orgDriveLink) && (
        <Section icon={<FileText size={15} />} title="Notes">
            <div className="space-y-3">
                {record?.notes && (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{record.notes}</p>
                    </div>
                )}
                {record?.adminNotes && (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Admin</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{record.adminNotes}</p>
                    </div>
                )}
                {(record?.driveLink || record?.orgDriveLink) && (
                    <a
                        href={record?.driveLink || record?.orgDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        <ExternalLink size={13} />
                        Open Google Drive Reference
                    </a>
                )}
            </div>
        </Section>
    );

    const proofSection = (record?.releaseProofImage || record?.releaseNotes) && (
        <Section icon={<CheckCircle2 size={15} color="#00b400ff" />} title="Release Proof">
            <div className="space-y-4">
                {record?.releaseProofImage && (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Captured Photo</p>
                        <button
                            type="button"
                            onClick={() => setPreviewImage({ src: record.releaseProofImage, alt: 'Release proof' })}
                            className="block w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:opacity-90 transition-opacity cursor-pointer p-0"
                        >
                            <img src={record.releaseProofImage} alt="Release proof" className="w-full max-h-96 object-contain" />
                        </button>
                    </div>
                )}
                {record?.releaseNotes && (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes / Signature Name</p>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-sm font-medium text-slate-700">{record.releaseNotes}</p>
                        </div>
                    </div>
                )}
            </div>
        </Section>
    );

    const itemsSection = displayItems.length > 0 && (
        <Section icon={<ClipboardList size={15} />} title="Items Ordered">
            <div
                className={`space-y-4 ${displayItems.length > VISIBLE_ORDER_ITEMS ? 'max-h-[720px] overflow-y-auto pr-2' : ''}`}
            >
                {displayItems.map((item, idx) => (
                    <div key={`${item.id || item.description}-${idx}`} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex justify-between items-start gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800">{item.description}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type: {item.type || 'Service'}</p>
                            {(item.addOns?.length > 0 || item.hasPocket) && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {item.addOns.map((addOn) => (
                                        <span key={`${item.id}-${addOn.id}`} className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase">
                                            {addOn.label} +{formatCurrency(addOn.price)}
                                        </span>
                                    ))}
                                    {item.hasPocket && (
                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                                            Pockets +{formatCurrency(DEFAULT_POCKET_PRICE)}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-4 mt-2">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Unit Price</p>
                                    <p className="text-xs font-bold text-slate-700">{formatCurrency(item.unitPrice)}</p>
                                </div>
                                {(item.addOnPrice || 0) > 0 && (
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Add-ons</p>
                                        <p className="text-xs font-bold text-slate-700">{formatCurrency(item.addOnPrice)}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Qty</p>
                                    <p className="text-xs font-bold text-slate-700">x{item.qty || 1}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Total</p>
                                    <p className="text-xs font-extrabold text-blue-600">{formatCurrency(item.total)}</p>
                                </div>
                            </div>
                        </div>
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm shadow-blue-100">
                            x{item.qty || 1}
                        </span>
                    </div>
                ))}
            </div>
        </Section>
    );

    const repairSection = isRepair && (
        <Section
            icon={<Wrench size={15} />}
            title="Repair Specification"
        >
            <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Repair Service</p>
                    <p className="text-[13px] font-medium text-slate-700 leading-relaxed">{repairDisplayLabel}</p>
                </div>
                {record?.notes && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Repair Notes</p>
                        <p className="text-[13px] font-medium text-slate-700 leading-relaxed">{record.notes}</p>
                    </div>
                )}
            </div>
        </Section>
    );

    const paymentSection = (
        <Section icon={<CreditCard size={15} />} title="Payment">
            <Field label="Status"><PayBadge status={record?.payStatus} /></Field>
            <Field label="Amount">
                <span className="text-base font-extrabold text-slate-900">
                    {record?.totalPrice != null
                        ? `P${record.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'N/A'}
                </span>
            </Field>
            {record?.paidAt && (
                <Field label="Paid At">
                    {new Date(record.paidAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Field>
            )}
        </Section>
    );

    return (
        <div className="font-inter flex flex-col gap-4 pb-8">
            <button
                onClick={onBack}
                className="self-start inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 hover:text-slate-800"
            >
                <ArrowLeft size={14} /> {headerConfig.backLabel}
            </button>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
                <div className={`h-1 ${headerConfig.accentBar}`} />
                <div className="pt-3 sm:pt-5 px-4 sm:px-6 pb-4 sm:pb-5">
                    <div className="flex items-center gap-2 flex-wrap mb-3.5">
                        <MonoTag>{record?.displayId}</MonoTag>
                        <Pill className={headerConfig.statusPillClass}>
                            {isArchivedView ? <Archive size={10} /> : <CheckCircle2 size={10} />}
                            {headerConfig.statusLabel}
                        </Pill>
                        <TypeBadge typeKey={record?.typeKey} />
                        {isArchivedView && (
                            <Pill className={getOriginStatusStyles(record?.sourceStatus)}>
                                {record?.sourceStatus}
                            </Pill>
                        )}
                        <Pill className="bg-slate-100 text-slate-700 border-slate-200">
                            {record?.entityLabel}
                        </Pill>
                    </div>

                    <h1 className="text-[18px] sm:text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug mb-1">
                        {record?.headline}
                    </h1>
                    <p className="text-xs text-slate-400 font-medium mb-4">
                        {record?.secondaryLabel}
                    </p>

                    <div className="flex flex-wrap gap-y-1.5 gap-x-5">
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                            <User size={13} className="text-slate-300" />
                            {record?.customerName}
                        </span>
                        {record?.contact?.phone && (
                            <span className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
                                <Phone size={13} className="text-slate-300" />
                                {record.contact.phone}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                            Payment:
                            <span className="ml-1">
                                <PayBadge status={record?.payStatus} />
                            </span>
                        </span>
                        {isArchivedView && record?.archivedBy && (
                            <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                                Archived by
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md ml-1">
                                    {record.archivedBy}
                                </span>
                            </span>
                        )}
                        {typeof onArchive === 'function' && (
                            <button
                                onClick={onArchive}
                                disabled={isArchiving}
                                className="inline-flex ml-auto items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-600 hover:border-amber-600 hover:text-white disabled:opacity-60 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                            >
                                <Archive size={13} />
                                {isArchiving ? 'Archiving...' : 'Archive Record'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="absolute top-6 right-6 hidden sm:flex flex-col gap-1.5 items-end">
                    {headerDates.map(({ label, value, color }) => (
                        <div key={label} className="flex gap-2 items-center">
                            <span className="text-[11px] text-slate-400 font-semibold">{label}</span>
                            <span className={`text-xs font-bold ${color}`}>{value || 'N/A'}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[60%_40%] gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    {itemsSection}
                    {timelineSection}
                    {paymentSection}
                    {isComplex ? (
                        <>
                            {notesSection}
                        </>
                    ) : (
                        <>
                            {proofSection}
                            {contactSection}
                            {infoSection}
                            {notesSection}
                        </>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {isComplex ? (
                        <>
                            {proofSection}
                            {imagesSection}
                            {contactSection}
                            {infoSection}
                        </>
                    ) : (
                        imagesSection
                    )}
                    {repairSection}
                </div>
            </div>

            {rosterSection}
            {previewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
                    <button
                        type="button"
                        onClick={() => setPreviewImage(null)}
                        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
                        aria-label="Close image preview"
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={previewImage.src}
                        alt={previewImage.alt}
                        className="max-h-[92vh] max-w-[96vw] rounded-xl object-contain shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
}
