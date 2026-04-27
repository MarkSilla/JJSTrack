import React, { useMemo } from 'react';
import { ClipboardList, CheckCircle2, Shirt, Sparkles, Scissors } from 'lucide-react';

const ROLE_META = {
    layoutArtist: {
        label: 'Layout Artist',
        hint: 'Layout and printing preparation',
        icon: Sparkles,
        tone: 'bg-violet-50 text-violet-700 border-violet-100',
    },
    presser: {
        label: 'Presser',
        hint: 'Heat press and finishing',
        icon: Shirt,
        tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    tailor: {
        label: 'Tailor',
        hint: 'Sewing and final assembly',
        icon: Scissors,
        tone: 'bg-blue-50 text-blue-700 border-blue-100',
    },
};

const normalizeStepLabel = (label = '') =>
    String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ');

const fmt = (n) => '\u20B1' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });

export default function AssignedTailorPanel({
    activeOrder,
    staffAssignments,
    earningsPreview,
    onManageAssignments,
    isCancelled,
}) {
    const visibleRoles = useMemo(() => {
        const labels = (Array.isArray(activeOrder?.steps) ? activeOrder.steps : [])
            .map((step) => normalizeStepLabel(step?.label || step));

        const roles = [];
        if (labels.includes('layout') || labels.includes('printing')) roles.push('layoutArtist');
        if (labels.includes('pressing')) roles.push('presser');
        if (labels.includes('sewing') || roles.length === 0) roles.push('tailor');
        return roles;
    }, [activeOrder]);

    const assignedCount = visibleRoles.filter((roleKey) => staffAssignments?.[roleKey]).length;
    const canManageAssignments = !isCancelled && assignedCount > 0;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-blue-50/60 px-4 py-3 border-b border-blue-100/60 flex items-center justify-between gap-3">
                <div>
                    <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase flex items-center gap-2">
                        <ClipboardList size={13} className="text-blue-600" />Production Team Assignment
                    </h4>
                    <p className="mt-1 text-xs font-medium text-blue-700/80">
                        {assignedCount > 0
                            ? `${assignedCount} of ${visibleRoles.length} required roles assigned`
                            : 'Assign the production team for the next workflow stages.'}
                    </p>
                </div>
                {!isCancelled && (
                    <button
                        onClick={() => {
                            if (!canManageAssignments) return;
                            onManageAssignments(activeOrder.id || activeOrder._id);
                        }}
                        disabled={!canManageAssignments}
                        className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${
                            canManageAssignments
                                ? 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50 cursor-pointer'
                                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        Manage Team
                    </button>
                )}
            </div>

            <div className="p-5 flex flex-col gap-4">
                {isCancelled ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[12px] font-semibold text-red-600">
                        Cannot assign production staff to cancelled orders.
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-600">
                        {assignedCount > 0
                            ? 'These assignments define who will handle each production responsibility after drop-off. Update them anytime if the workload changes.'
                            : 'Initial production assignment is only available from the drop-off workflow step. This panel becomes manageable after the team has been assigned.'}
                    </div>
                )}

                <div className="grid gap-3">
                    {visibleRoles.map((roleKey) => {
                        const meta = ROLE_META[roleKey];
                        const Icon = meta.icon;
                        const assignedName = staffAssignments?.[roleKey] || 'Unassigned';

                        return (
                            <div key={roleKey} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${meta.tone}`}>
                                    <Icon size={17} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-black text-slate-900">{meta.label}</div>
                                    <div className="text-[11px] font-medium text-slate-400">{meta.hint}</div>
                                </div>
                                <div className="min-w-0 text-right">
                                    <div className="truncate text-sm font-bold text-slate-900">{assignedName}</div>
                                    <div className={`mt-1 text-[10px] font-black uppercase tracking-wider ${assignedName === 'Unassigned' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {assignedName === 'Unassigned' ? 'Pending' : 'Assigned'}
                                    </div>
                                </div>
                                {assignedName !== 'Unassigned' && <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />}
                            </div>
                        );
                    })}
                </div>

                {earningsPreview && (
                    <div className="mt-1 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                        <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Tailor Earnings Preview</div>
                        <div className="flex flex-col gap-1.5 mb-2.5">
                            {earningsPreview.lines.map((line, i) => (
                                <div key={i} className="flex justify-between text-[11px]">
                                    <span className="text-blue-600 font-medium">{line.qty} {line.label}s x {fmt(line.rate)}</span>
                                    <span className="font-bold text-blue-900">{fmt(line.earned)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                            <span className="text-[11px] font-bold text-blue-800">Total Salary</span>
                            <span className="text-sm font-black text-blue-900">{fmt(earningsPreview.total)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
