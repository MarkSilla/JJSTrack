import React from 'react';
import { AlertCircle } from 'lucide-react';
import { EMPLOYEE_POOL } from './Constants.js';

export default function AssignConfirmationModal({ assignConfirm, staffList = [], onConfirm, onCancel }) {
    if (!assignConfirm.show) return null;

    const empName = assignConfirm.empId;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                <div className="bg-[#0F172A] p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <AlertCircle size={20} />
                        Assign Tailor
                    </h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 text-sm mb-2">Are you sure you want to assign</p>
                    <p className="text-gray-900 font-bold text-lg mb-6 bg-blue-50 p-3 rounded-lg">"{empName}"</p>
                    <p className="text-gray-600 text-sm">to this order? This action cannot be undone.</p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg font-bold text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg font-bold text-sm text-white bg-[#0F172A] hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                        Confirm Assign
                    </button>
                </div>
            </div>
        </div>
    );
}
