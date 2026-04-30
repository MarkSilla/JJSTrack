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
    isAssignmentLocked = false,
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
    const canManageAssignments = !isCancelled && !isAssignmentLocked && assignedCount > 0;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-none px-4 py-3 border-b border-gray-300/60 flex items-center justify-between gap-3">
                <div>
                    <h4 className="text-[11px] font-black text-gray-400 tracking-wider uppercase flex items-center gap-2">
                        Production Team Assignment
                    </h4>
                    <p className="mt-1 text-xs font-medium text-gray-600">
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
                        className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${canManageAssignments
                            ? 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50 cursor-pointer'
                            : 'border-slate-200 bg-slate-100 text-slate-400 bg-white cursor-not-allowed'
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
                ) : isAssignmentLocked ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-600">
                        Production team assignments are locked once an order is completed or released.
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-600">
                        {assignedCount > 0
                            ? 'These assignments define who will handle each production responsibility after drop-off. Update them anytime if the workload changes.'
                            : 'Initial production assignment is only available from the drop-off workflow step. This panel becomes manageable after the team has been assigned.'}
                    </div>
                )}

                <div className={`grid grid-cols-1 ${visibleRoles.length === 1 ? 'md:flex md:justify-center' : 'md:grid-cols-3'} gap-3`}>
                    {visibleRoles.map((roleKey) => {
                        const meta = ROLE_META[roleKey];
                        const Icon = meta.icon;
                        const assignedName = staffAssignments?.[roleKey] || 'Unassigned';

                        return (
                            <div key={roleKey} className={`flex flex-col items-center text-center p-4 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-blue-100 group ${visibleRoles.length === 1 ? 'md:min-w-[480px] md:max-w-xs' : ''}`}>
                                <div className="mb-2">
                                    <div className="truncate text-[13px] font-bold text-slate-900 px-1">{assignedName}</div>
                                    <div className="text-[13px] font-black text-slate-900 leading-tight">{meta.label}</div>

                                </div>
                                <div className="mt-auto w-full pt-3 border-t border-gray-50">
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <div className={`text-[9px] font-black uppercase tracking-wider ${assignedName === 'Unassigned' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {assignedName === 'Unassigned' ? 'Pending' : 'Assigned'}
                                        </div>
                                        {assignedName !== 'Unassigned' && <CheckCircle2 size={12} className="text-emerald-500" />}
                                    </div>
                                </div>
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
