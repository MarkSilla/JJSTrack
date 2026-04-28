import React from 'react';
import {
    ArrowLeft,
    Archive,
    Calendar,
    CheckCircle2,
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

const getOriginStatusStyles = (status = '') => {
    if (status === 'Cancelled') {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (status === 'Released') {
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
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
            statusPillClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
            statusLabel: 'Released',
            accentBar: 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300',
            accentText: 'text-cyan-600',
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
            { label: 'Released', value: record?.releaseDate, color: 'text-cyan-600' },
        ];

    const quickAction = typeof onArchive === 'function'
        ? {
            wrapperClass: 'bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm',
            headerClass: 'px-4 py-2.5 border-b border-amber-100 flex items-center gap-2 bg-amber-50',
            headerIcon: <Archive size={14} className="text-amber-500" />,
            bodyClass: 'p-4 space-y-2.5',
            text: 'Move this released record to archives.',
            buttonClass: 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold px-3.5 py-2 text-xs transition-colors border-none cursor-pointer',
            buttonIcon: <Archive size={14} />,
            busy: isArchiving,
            idleLabel: 'Archive Record',
            busyLabel: 'Archiving...',
            onClick: onArchive,
        }
        : null;

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
                <div className="pt-5 px-6 pb-5">
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

                    <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug mb-1">
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

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-4">
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <CheckCircle2 size={15} className={headerConfig.accentText} />
                            <span className="text-[13px] font-bold text-slate-800">Production Timeline</span>
                            <Pill className={`ml-auto ${headerConfig.statusPillClass} text-[10px]`}>
                                {steps.length > 0 ? 'Step by step' : 'No steps available'}
                            </Pill>
                        </div>
                        <div className="p-5">
                            {steps.length === 0 ? (
                                <div className="text-sm text-slate-500">
                                    No production steps are available for this {isArchivedView ? 'archived' : 'released'} record.
                                </div>
                            ) : (
                                steps.map((step, idx) => (
                                    <div key={`${step?.label || step?.step || idx}-${idx}`} className="flex gap-4 relative">
                                        {idx < steps.length - 1 && (
                                            <div className="absolute left-[15px] top-[34px] bottom-0 w-px bg-slate-200" />
                                        )}
                                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-[0_0_0_4px_#F8FAFC,0_2px_8px_rgba(148,163,184,0.16)] z-10 ${isArchivedView ? 'bg-amber-500' : 'bg-cyan-500'}`}>
                                            <CheckCircle2 size={15} />
                                        </div>
                                        <div className={`flex-1 ${idx < steps.length - 1 ? 'pb-6' : ''}`}>
                                            <div className="text-[13px] font-bold text-slate-900 leading-snug">
                                                {step?.step || step?.label || `Step ${idx + 1}`}
                                            </div>
                                            <div className="flex gap-3.5 mt-1 flex-wrap text-[11px] text-slate-400 font-semibold">
                                                {step?.date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} /> {fmtDate(step.date)}
                                                    </span>
                                                )}
                                                {step?.worker && (
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
                                            <tr key={`${player?.surname || player?.name || 'player'}-${idx}`} className={`h-[52px] border-b border-slate-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="pl-5 pr-3 text-[13px] font-bold text-slate-900">
                                                    {player?.surname || player?.name || 'N/A'}
                                                </td>
                                                <td className="px-3 text-center">
                                                    <span className="inline-block min-w-[2rem] text-slate-600 px-1.5 text-[11px] font-black tracking-wide">
                                                        #{player?.number ?? 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-3 text-center text-[13px] font-semibold text-slate-700">
                                                    {player?.jerseySize || player?.size || 'N/A'}
                                                </td>
                                                <td className="px-3 text-center text-[12px] font-semibold text-slate-700">
                                                    {player?.shortSize || player?.size || 'N/A'}
                                                </td>
                                                <td className="px-3 pr-5 text-center text-[10px] text-slate-500">
                                                    {getLineupAddOns(player).join(', ') || 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {isRepair && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <Wrench size={15} className="text-blue-500" />
                                <span className="text-[13px] font-bold text-slate-800">Repair Specification</span>
                                <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full tracking-wide">
                                    {record?.items?.length ?? 0} Tasks
                                </span>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText size={13} className="text-slate-500" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Repair Service</span>
                                    </div>
                                    <div className="text-[12px] font-medium text-slate-700 leading-relaxed">{repairDisplayLabel}</div>
                                </div>
                                {record?.notes && (
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText size={13} className="text-amber-500" />
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Repair Notes</span>
                                        </div>
                                        <div className="text-[12px] font-medium text-slate-700 leading-relaxed">{record.notes}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {hasImages && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <ImageIcon size={15} className="text-slate-500" />
                                <span className="text-[13px] font-bold text-slate-800">Uploaded Images</span>
                            </div>
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {record.imageUrls.map((src, index) => (
                                    <a
                                        key={`${src}-${index}`}
                                        href={src}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm"
                                    >
                                        <img
                                            src={src}
                                            alt={`Uploaded asset ${index + 1}`}
                                            className="w-full h-36 object-cover"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {(record?.releaseProofImage || record?.releaseNotes) && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <CheckCircle2 size={15} className="text-emerald-500" />
                                <span className="text-[13px] font-bold text-slate-800">Release Proof</span>
                            </div>
                            <div className="p-5 space-y-4">
                                {record?.releaseProofImage && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-2">Captured Photo</p>
                                        <a
                                            href={record.releaseProofImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm transition-transform hover:scale-[1.02]"
                                        >
                                            <img
                                                src={record.releaseProofImage}
                                                alt="Release proof"
                                                className="w-full max-h-64 object-contain"
                                            />
                                        </a>
                                    </div>
                                )}
                                {record?.releaseNotes && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-1">Notes / Signature Name</p>
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-sm font-medium text-slate-700">{record.releaseNotes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {quickAction && (
                        <div className={quickAction.wrapperClass}>
                            <div className={quickAction.headerClass}>
                                {quickAction.headerIcon}
                                <span className="text-[12px] font-bold text-slate-800">Quick Action</span>
                            </div>
                            <div className={quickAction.bodyClass}>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {quickAction.text}
                                </p>
                                <button
                                    onClick={quickAction.onClick}
                                    disabled={quickAction.busy}
                                    className={quickAction.buttonClass}
                                >
                                    {quickAction.buttonIcon}
                                    {quickAction.busy ? quickAction.busyLabel : quickAction.idleLabel}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <User size={15} className="text-blue-500" />
                            <span className="text-[13px] font-bold text-slate-800">Contact Information</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Name</p>
                                <p className="text-sm font-medium text-slate-800">{record?.customerName}</p>
                            </div>
                            {record?.contact?.phone && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Phone</p>
                                    <a href={`tel:${record.contact.phone}`} className="text-sm font-medium text-blue-600 hover:underline">{record.contact.phone}</a>
                                </div>
                            )}
                            {record?.contact?.email && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Email</p>
                                    <a href={`mailto:${record.contact.email}`} className="text-sm font-medium text-blue-600 hover:underline">{record.contact.email}</a>
                                </div>
                            )}
                            {record?.contact?.address && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Address</p>
                                    <p className="text-sm font-medium text-slate-800">{record.contact.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <Package size={15} className="text-violet-500" />
                            <span className="text-[13px] font-bold text-slate-800">Record Information</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Kind</p>
                                <p className="text-sm font-medium text-slate-800">{record?.entityLabel}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Type</p>
                                <TypeBadge typeKey={record?.typeKey} />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Status</p>
                                <div className="flex flex-wrap gap-2">
                                    <Pill className={headerConfig.statusPillClass}>
                                        {isArchivedView ? <Archive size={10} /> : <CheckCircle2 size={10} />}
                                        {headerConfig.statusLabel}
                                    </Pill>
                                    {isArchivedView && (
                                        <Pill className={getOriginStatusStyles(record?.sourceStatus)}>
                                            {record?.sourceStatus}
                                        </Pill>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Service</p>
                                <p className="text-sm font-medium text-slate-800">{record?.serviceLabel}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-1">Drop Date</p>
                                <p className="text-sm font-medium text-slate-800">{record?.dropDate}</p>
                            </div>
                            {!isArchivedView && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Released Date</p>
                                    <p className="text-sm font-bold text-cyan-600">{record?.releaseDate}</p>
                                </div>
                            )}
                            {isArchivedView && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Archived Date</p>
                                    <p className="text-sm font-bold text-amber-600">{record?.archiveDate}</p>
                                </div>
                            )}
                            {isArchivedView && record?.archivedBy && (
                                <div>
                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Archived By</p>
                                    <p className="text-sm font-bold text-amber-700">{record.archivedBy}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <CreditCard size={15} className="text-emerald-500" />
                            <span className="text-[13px] font-bold text-slate-800">Payment Information</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-600">Payment Status:</span>
                                <PayBadge status={record?.payStatus} />
                            </div>
                            <div className="flex justify-between items-center gap-3">
                                <span className="text-sm font-semibold text-slate-600">Amount:</span>
                                <span className="text-lg font-bold text-slate-900 text-right">
                                    {record?.totalPrice != null
                                        ? `P${record.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : 'N/A'}
                                </span>
                            </div>
                            {record?.paidAt && (
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-600">Paid At:</span>
                                    <span className="text-sm font-medium text-slate-800 text-right">
                                        {new Date(record.paidAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {(record?.notes || record?.adminNotes || record?.driveLink || record?.orgDriveLink) && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                <FileText size={15} className="text-amber-500" />
                                <span className="text-[13px] font-bold text-slate-800">Notes</span>
                            </div>
                            <div className="p-5 space-y-3">
                                {record?.notes && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-1">Customer Notes:</p>
                                        <p className="text-sm text-slate-700">{record.notes}</p>
                                    </div>
                                )}
                                {record?.adminNotes && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-1">Admin Notes:</p>
                                        <p className="text-sm text-slate-700">{record.adminNotes}</p>
                                    </div>
                                )}
                                {(record?.driveLink || record?.orgDriveLink) && (
                                    <div className="pt-1">
                                        <a
                                            href={record?.driveLink || record?.orgDriveLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                        >
                                            <ExternalLink size={14} />
                                            Open Google Drive Reference
                                        </a>
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
