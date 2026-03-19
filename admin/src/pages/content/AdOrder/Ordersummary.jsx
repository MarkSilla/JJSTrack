import React from 'react';
import { isOverdue, getDropDate } from '../../../utils/helpers.js';

export default function OrderSummary({ activeOrder, assignedEmployee }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-blue-50/50 p-5 border-b border-gray-50">
                <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase mb-5">Order Details</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-500">Drop Date</span>
                        <span className="font-bold text-gray-900">{getDropDate(activeOrder)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-500">Due Date</span>
                        <span className={`font-bold ${isOverdue(activeOrder.invoice?.dueDate || activeOrder.estimatedCompletion) ? 'text-red-500' : 'text-gray-900'}`}>
                            {activeOrder.invoice?.dueDate
                                ? new Date(activeOrder.invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : activeOrder.estimatedCompletion || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-500">Assigned To</span>
                        <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                            {assignedEmployee?.name || activeOrder.assignedTailor || activeOrder.tailor || 'Unassigned'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="p-5 bg-white">
                <div className="space-y-3 mb-5">
                    {activeOrder.invoice?.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                            <div className="pr-4">
                                <div className="font-semibold text-gray-800 line-clamp-1">{item.description}</div>
                                <div className="text-[11px] font-medium text-gray-400 mt-0.5">Qty: {item.qty}</div>
                            </div>
                            <div className="font-bold text-gray-900 whitespace-nowrap">
                                ₱{((item.qty * item.unitPrice) + (item.addOnPrice || 0)).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Total Price</span>
                    <span className="text-lg font-black text-gray-900">
                        ₱{(activeOrder.invoice?.total || activeOrder.totalPrice || activeOrder.invoice?.items?.reduce((s, i) => s + i.unitPrice * i.qty + (i.addOnPrice || 0), 0) || 0).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
