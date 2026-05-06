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

const Section = ({ icon, title, badge, children }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-slate-500">{icon}</span>
            <span className="text-[13px] font-bold text-slate-800">{title}</span>
            {badge && <span className="ml-auto">{badge}</span>}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const Field = ({ label, children }) => (
    <div className="flex items-start py-2.5 border-b border-slate-50 last:border-0">
        <span className="w-28 shrink-0 text-[11px] font-semibold text-slate-400 uppercase tracking-wide pt-0.5">{label}</span>
        <span className="flex-1 text-[13px] font-medium text-slate-800 leading-snug">{children}</span>
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
                    <a key={`${src}-${i}`} href={src} target="_blank" rel="noreferrer"
                        className="block rounded-xl overflow-hidden border border-slate-100 bg-slate-50 hover:opacity-90 transition-opacity">
                        <img src={src} alt={`Image ${i + 1}`} className="w-full h-36 object-cover" />
                    </a>
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
                <div className="overflow-x-auto -mx-5">
                    <table className="w-full min-w-[520px] border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                {['Name', 'No.', 'Jersey', 'Short', 'Add-ons'].map((col, ci) => (
                                    <th key={col} className={`py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${ci === 0 ? 'text-left pl-5' : 'text-center px-3'}`}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPlayers.map((player, idx) => (
                                <tr key={`${player?.surname || player?.name || 'p'}-${idx}`}
                                    className={`h-12 border-b border-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                    <td className="pl-5 pr-3 text-[13px] font-bold text-slate-900">{player?.surname || player?.name || '—'}</td>
                                    <td className="px-3 text-center text-[11px] font-black text-slate-600">#{player?.number ?? '—'}</td>
                                    <td className="px-3 text-center text-[13px] font-semibold text-slate-700">{player?.jerseySize || player?.size || '—'}</td>
                                    <td className="px-3 text-center text-[12px] font-semibold text-slate-700">{player?.shortSize || player?.size || '—'}</td>
                                    <td className="px-3 pr-5 text-center text-[10px] text-slate-400">{getLineupAddOns(player).join(', ') || '—'}</td>
                                </tr>
                            ))}
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
                        <a href={record.releaseProofImage} target="_blank" rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:opacity-90 transition-opacity">
                            <img src={record.releaseProofImage} alt="Release proof" className="w-full max-h-64 object-contain" />
                        </a>
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

    const itemsSection = (Array.isArray(record?.items) && record.items.length > 0) && (
        <Section icon={<ClipboardList size={15} />} title="Items Ordered">
            <div className="space-y-4">
                {record.items.map((item, idx) => (
                    <div key={`${item.description}-${idx}`} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800">{item.description}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type: {item.type || 'Service'}</p>
                            <div className="flex gap-4 mt-2">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Unit Price</p>
                                    <p className="text-xs font-bold text-slate-700">P{(item.unitPrice || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Total</p>
                                    <p className="text-xs font-extrabold text-blue-600">P{((item.qty || 1) * (item.unitPrice || 0)).toLocaleString()}</p>
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
                    {timelineSection}
                    {isComplex ? (
                        <>
                            {itemsSection}
                            {rosterSection}
                            {notesSection}
                        </>
                    ) : (
                        <>
                            {itemsSection}
                            {imagesSection}
                            {rosterSection}
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
                            {imagesSection}
                            {contactSection}
                            {infoSection}
                        </>
                    ) : null}
                    {proofSection}
                    {repairSection}
                    {paymentSection}
                </div>
            </div>
        </div>
    );
}
