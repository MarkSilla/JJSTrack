import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Scissors, Briefcase } from 'lucide-react';

export default function StaffCalendarDrawer({ isOpen, onClose }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Simple calendar logic
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const todayDate = new Date();
    const isToday = (day) => {
        return todayDate.getDate() === day &&
            todayDate.getMonth() === currentDate.getMonth() &&
            todayDate.getFullYear() === currentDate.getFullYear();
    };

    const isPastDate = (day) => {
        const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const cutoffDate = new Date();
        cutoffDate.setHours(0, 0, 0, 0);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        return dateToCheck < cutoffDate;
    };
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            ></div>

            {/* Sliding Drawer */}
            <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CalendarIcon size={20} />
                        </div>
                        <h2 className="font-bold text-gray-800">Your Schedule</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Calendar Widget */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800 text-sm">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <div className="flex gap-1">
                                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"><ChevronLeft size={16} /></button>
                                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-center text-xs font-semibold text-gray-400">{d}</div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                            {days.map((day, idx) => (
                                <div key={idx} className="flex justify-center aspect-square items-center relative group">
                                    {day && (
                                        <button
                                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                                                ${isToday(day)
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                    : isPastDate(day)
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }
                                            `}
                                            disabled={isPastDate(day)}
                                        >
                                            {day}
                                            {/* Mock dot for events */}
                                            {day % 5 === 0 && !isToday(day) && !isPastDate(day) && (
                                                <span className={`absolute bottom-[2px] w-1 h-1 rounded-full ${isToday(day) ? 'bg-white' : 'bg-blue-500'}`}></span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 mx-5 my-2"></div>

                    {/* Upcoming Tasks Section (Mimicking the admin data) */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800 text-sm">Assigned Tasks</h3>
                            <button className="text-xs font-medium text-blue-600 hover:text-blue-800">View all</button>
                        </div>

                        <div className="space-y-4 mb-4">
                            {/* Real mock data mapped from Admin */}
                            <div className="flex gap-3 items-center group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors flex items-center justify-center shrink-0">
                                    <Scissors size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Juan Dela Cruz</h4>
                                        <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Repair • 09:00 AM</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-center group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors flex items-center justify-center shrink-0">
                                    <Briefcase size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Maria Santos</h4>
                                        <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">In Progress</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Jersey • 01:30 PM</p>
                                </div>
                            </div>
                        </div>

                        {/* Note: User requested removal of + Add New Event button since staff cannot add */}
                    </div>
                </div>
            </div>
        </>
    );
}
