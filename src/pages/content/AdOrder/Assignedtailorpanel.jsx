import React from 'react';
import { UserCheck, CheckCircle2, User } from 'lucide-react';
import AssignEmployeeDropdown from './Assignedemployeedropdown';

const fmt = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });

export default function AssignedTailorPanel({
    activeOrder,
    assignments,
    assignedEmployee,
    earningsPreview,
    onAssign,
    isCancelled,
}) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-blue-50/60 px-4 py-3 border-b border-blue-100/60">
                <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase flex items-center gap-2">
                    <UserCheck size={13} className="text-blue-600" />Assigned Tailor / Staff
                </h4>
            </div>
            <div className="p-5 flex flex-col gap-4">
                {isCancelled ? (
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 bg-red-50 rounded-xl px-3.5 py-3 border border-red-200">
                        <span className="text-red-600 font-semibold">Cannot assign staff to cancelled orders</span>
                    </div>
                ) : (
                    <AssignEmployeeDropdown
                        currentId={assignments[activeOrder.id]}
                        onAssign={(empId) => onAssign(activeOrder.id, empId)}
                    />
                )}
                {assignedEmployee ? (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-black text-blue-700 shrink-0">
                            {assignedEmployee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">{assignedEmployee.name}</div>
                            <div className="text-[11px] text-gray-400">{assignedEmployee.role} · {assignedEmployee.dept}</div>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-[12px] text-gray-400 bg-gray-50 rounded-xl px-3.5 py-3 border border-dashed border-gray-200">
                        <User size={14} className="text-gray-300" />No one assigned yet
                    </div>
                )}
                {assignedEmployee && activeOrder.invoice?.items?.length > 0 && (
                    <div className="mt-1">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Work Items</div>
                        <div className="flex flex-col gap-1.5">
                            {activeOrder.invoice.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                    <span className="font-semibold text-gray-700">{item.description}</span>
                                    <span className="font-black text-gray-900">{item.qty} pcs</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {earningsPreview && (
                    <div className="mt-1 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                        <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Earnings Preview</div>
                        <div className="flex flex-col gap-1.5 mb-2.5">
                            {earningsPreview.lines.map((line, i) => (
                                <div key={i} className="flex justify-between text-[11px]">
                                    <span className="text-blue-600 font-medium">{line.qty} {line.label}s × {fmt(line.rate)}</span>
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
