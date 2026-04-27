import React, { useMemo } from 'react';
import { ClipboardList, Scissors, Shirt, Sparkles, X } from 'lucide-react';

const ROLE_CONFIG = {
    layoutArtist: {
        label: 'Layout Artist',
        description: 'Handles layout setup and printing preparation.',
        positions: ['layout artist'],
        icon: Sparkles,
    },
    presser: {
        label: 'Presser',
        description: 'Handles heat press and final press workflow.',
        positions: ['presser'],
        icon: Shirt,
    },
    tailor: {
        label: 'Tailor',
        description: 'Handles sewing and final garment assembly.',
        positions: ['tailor'],
        icon: Scissors,
    },
};

const normalizePosition = (value = '') =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

const getVisibleOrderId = (order = {}) =>
    order.displayId || order.orderId || order.bookingId || order.id || order._id || 'N/A';

export default function ProductionAssignmentModal({
    isOpen,
    mode = 'start',
    order = null,
    staffList = [],
    value,
    requiredRoles = [],
    isSaving = false,
    onChange,
    onClose,
    onConfirm,
}) {
    const orderedRoles = useMemo(() => {
        const visibleRoles = requiredRoles.length > 0 ? requiredRoles : ['layoutArtist', 'presser', 'tailor'];
        return visibleRoles.filter((roleKey) => ROLE_CONFIG[roleKey]);
    }, [requiredRoles]);

    const groupedStaff = useMemo(() =>
        orderedRoles.reduce((acc, roleKey) => {
            const config = ROLE_CONFIG[roleKey];
            acc[roleKey] = staffList.filter((employee) =>
                config.positions.includes(normalizePosition(employee.position || employee.role))
            );
            return acc;
        }, {}),
    [orderedRoles, staffList]);

    if (!isOpen || !order) return null;

    const isStartMode = mode === 'start';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-blue-100 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                            <ClipboardList size={22} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-200">Production Assignment</p>
                            <h2 className="mt-1 text-xl font-black text-white">
                                {isStartMode ? 'Assign Team Before Work Starts' : 'Update Production Team'}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-blue-100/90">
                                {isStartMode
                                    ? 'Complete the production role assignments below. Once confirmed, this order will officially start its work progress.'
                                    : 'Update the assigned production staff for each workflow responsibility.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="border-none bg-transparent p-0 text-blue-100 transition-colors hover:text-white disabled:opacity-50 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 md:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Order ID</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{getVisibleOrderId(order)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Customer</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{order.customer || order.invoice?.billTo?.name || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Service</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{order.serviceType || order.bookingType || 'Production Order'}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                        <p className="text-sm font-bold text-blue-900">Assignment guide</p>
                        <p className="mt-1 text-sm leading-relaxed text-blue-800">
                            Assign the correct staff per role so the next workflow stages are clear and traceable. Required roles for this order are shown below.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {orderedRoles.map((roleKey) => {
                            const config = ROLE_CONFIG[roleKey];
                            const Icon = config.icon;
                            const options = groupedStaff[roleKey] || [];

                            return (
                                <div key={roleKey} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{config.label}</p>
                                            <p className="mt-1 text-xs leading-relaxed text-slate-500">{config.description}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                                            Assign {config.label}
                                        </label>
                                        <select
                                            value={value?.[roleKey] || ''}
                                            onChange={(event) => onChange(roleKey, event.target.value)}
                                            disabled={isSaving}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-300 focus:bg-white disabled:opacity-60"
                                        >
                                            <option value="">Select {config.label}</option>
                                            {options.map((employee) => (
                                                <option
                                                    key={employee._id || employee.id || employee.name}
                                                    value={employee.name || employee.fullName}
                                                >
                                                    {employee.name || employee.fullName}
                                                </option>
                                            ))}
                                        </select>
                                        {options.length === 0 && (
                                            <p className="mt-2 text-xs font-medium text-amber-600">
                                                No available {config.label.toLowerCase()} found in staff list.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="rounded-2xl border-none bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving
                            ? (isStartMode ? 'Starting Work Progress...' : 'Saving Assignments...')
                            : (isStartMode ? 'Start Work Progress' : 'Save Assignments')}
                    </button>
                </div>
            </div>
        </div>
    );
}
