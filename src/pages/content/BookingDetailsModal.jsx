import React, { useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    X
} from 'lucide-react';
import { TYPE_CONFIG, STATUS_CONFIG } from './appointmentUtils.js';

const BookingDetailsModal = ({ booking, onClose }) => {
    if (!booking) return null;
    const statusBadge = STATUS_CONFIG[booking.status] || STATUS_CONFIG['pending'];
    const TypeIcon = TYPE_CONFIG[booking.type].icon;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm relative flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
            >
                <div className="shrink-0 px-6 pt-6 pb-4">
                    <div className="flex justify-center mb-3 sm:hidden">
                        <div className="w-10 h-1 bg-gray-200 rounded-full" />
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-full p-1.5">
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${TYPE_CONFIG[booking.type].hex}1A`, color: TYPE_CONFIG[booking.type].hex }}>
                            <TypeIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{booking.customer}</h3>
                            <p className="text-sm font-medium text-gray-500">{booking.service}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-2">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-gray-100">
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Calendar size={14} /> Date</span>
                            <span className="text-sm font-bold text-gray-700">{booking.date}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-gray-100">
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Clock size={14} /> Time</span>
                            <span className="text-sm font-bold text-gray-700">{booking.time}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-gray-100">
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><User size={14} /> Staff</span>
                            <span className="text-sm font-bold text-gray-700">{booking.staff}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-gray-100">
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><CheckCircle size={14} /> Status</span>
                            <span className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${statusBadge.color}`}>
                                {booking.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 px-6 py-4 border-t border-gray-100">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm cursor-pointer" onClick={onClose}>
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;
