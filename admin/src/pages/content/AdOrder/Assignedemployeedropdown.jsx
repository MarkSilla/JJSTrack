import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, UserCheck, X, Check } from 'lucide-react';
import { staffApi } from '../../../services/staffApi';
import { mapStaffToEmployee } from '../../../utils/mapStaffToEmployee.js';

export default function AssignEmployeeDropdown({ currentId, onAssign }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const ref = useRef(null);
    const buttonRef = useRef(null);
    const current = employees.find(e => [e._id, e.id, e.fullName, e.name].includes(currentId));

    const fetchMyStaff = useCallback(async () => {
        try {
            setLoading(true);
            const response = await staffApi.getMyStaff();
            const rawStaff = Array.isArray(response?.staff) ? response.staff : [];
            const mapped = rawStaff.map((staff, index) => mapStaffToEmployee(staff, index));
            setEmployees(mapped);
        } catch (error) {
            console.error("Failed to fetch my staff:", error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyStaff();
    }, [fetchMyStaff]);

    // Calculate fixed position from button's bounding rect
    const handleOpen = () => {
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
        setOpen(v => !v);
    };

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Recalculate position on scroll/resize so it stays aligned
    useEffect(() => {
        if (!open) return;
        const update = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownStyle(prev => ({
                    ...prev,
                    top: rect.bottom + 6,
                    left: rect.left,
                    width: rect.width,
                }));
            }
        };
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all w-full cursor-pointer
                    ${current ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
                <UserCheck size={15} className={current ? 'text-blue-500' : 'text-gray-400'} />
                <span className="flex-1 text-left truncate">{current ? current.name : 'Select Employee'}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    style={dropdownStyle}
                    className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="px-3 py-2 border-b border-gray-50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Production Staff</span>
                    </div>
                    <div className="py-1 max-h-52 overflow-y-auto">
                        <button
                            onClick={() => { onAssign(null); setOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left border-none cursor-pointer
                                ${!currentId ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                            <div className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0">
                                <X size={10} className="text-gray-300" />
                            </div>
                            <span className="font-medium">Unassigned</span>
                        </button>
                        {employees.map(emp => (
                            <button
                                key={emp._id}
                                onClick={() => { onAssign(emp.fullName || emp.name); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left border-none cursor-pointer
                                    ${[emp._id, emp.id, emp.fullName, emp.name].includes(currentId) ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{emp.name}</div>
                                    <div className="text-[10px] text-gray-400">{emp.role}</div>
                                </div>
                                {[emp._id, emp.id, emp.fullName, emp.name].includes(currentId) && <Check size={13} className="text-blue-500 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}