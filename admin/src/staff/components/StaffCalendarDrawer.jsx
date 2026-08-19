import React, { useMemo, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock3, MapPin } from 'lucide-react';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function StaffCalendarDrawer({ isOpen, onClose, schedules = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayKey, setSelectedDayKey] = useState(formatDateKey(new Date()));

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const todayDate = useMemo(() => new Date(), []);
    const todayKey = useMemo(() => formatDateKey(todayDate), [todayDate]);

    const groupedSchedules = useMemo(() => {
        return schedules.reduce((acc, schedule) => {
            if (!schedule?.dayKey) return acc;
            acc[schedule.dayKey] = acc[schedule.dayKey] || [];
            acc[schedule.dayKey].push(schedule);
            return acc;
        }, {});
    }, [schedules]);

    const selectedSchedules = groupedSchedules[selectedDayKey] || [];
    const upcomingSchedules = useMemo(() => {
        return schedules
            .filter((schedule) => schedule?.dayKey >= todayKey)
            .slice(0, 6);
    }, [schedules, todayKey]);

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

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const getDayKey = (day) => formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    const hasSchedules = (day) => Boolean(groupedSchedules[getDayKey(day)]?.length);
    const isSelectedDay = (day) => getDayKey(day) === selectedDayKey;
    const visibleSchedules = selectedSchedules.length > 0 ? selectedSchedules : upcomingSchedules;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-over Drawer */}
            <div className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col font-inter border-l border-slate-200/80 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100/60">
                            <CalendarIcon size={18} />
                        </div>
                        <h2 className="text-sm font-semibold text-slate-900">Your Schedule</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close schedule drawer"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Calendar Month & Grid */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-3.5">
                            <h3 className="font-semibold text-slate-900 text-sm">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    aria-label="Previous month"
                                    onClick={prevMonth}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Next month"
                                    onClick={nextMonth}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                <div key={day} className="text-center text-xs font-semibold text-slate-400">{day}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                            {days.map((day, idx) => (
                                <div key={idx} className="flex justify-center aspect-square items-center relative group">
                                    {day && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDayKey(getDayKey(day))}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none
                                                ${isSelectedDay(day)
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : isToday(day)
                                                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60'
                                                        : isPastDate(day)
                                                            ? 'text-slate-300 cursor-not-allowed'
                                                            : 'text-slate-700 hover:bg-slate-100'
                                                }
                                            `}
                                            disabled={isPastDate(day)}
                                        >
                                            {day}
                                            {hasSchedules(day) && (
                                                <span className={`absolute bottom-[2px] w-1 h-1 rounded-full ${isSelectedDay(day) ? 'bg-white' : 'bg-blue-500'}`}></span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 mx-5 my-1" />

                    {/* Schedule List */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">
                                    {selectedSchedules.length > 0 ? 'Selected Day Schedule' : 'Upcoming Schedule'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                    {selectedSchedules.length > 0
                                        ? `${selectedSchedules.length} task${selectedSchedules.length > 1 ? 's' : ''} on this date`
                                        : 'No schedule on the selected date yet'}
                                </p>
                            </div>
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/60">
                                {visibleSchedules.length}
                            </span>
                        </div>

                        {schedules.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                                <p className="text-xs font-semibold text-slate-700">No assigned schedules yet</p>
                                <p className="text-xs text-slate-500 mt-1">Your upcoming bookings will appear here automatically.</p>
                            </div>
                        ) : visibleSchedules.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                                <p className="text-xs font-semibold text-slate-700">Nothing scheduled here yet</p>
                                <p className="text-xs text-slate-500 mt-1">Pick another date on the calendar to inspect your tasks.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {visibleSchedules.map((schedule) => (
                                    <div key={schedule.id} className="flex gap-3 items-start p-2.5 rounded-lg border border-slate-200/60 bg-white hover:bg-slate-50/80 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center shrink-0 mt-0.5">
                                            <Clock3 size={16} />
                                        </div>
                                        <div className={`flex-1 border-l-2 pl-2.5 ${schedule.colorClass || 'border-blue-400'}`}>
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="text-xs font-semibold text-slate-900">{schedule.title}</h4>
                                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/60 whitespace-nowrap">
                                                    {schedule.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                <CalendarIcon size={12} className="text-slate-400 shrink-0" />
                                                <span>{schedule.dateLabel}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                <Clock3 size={12} className="text-slate-400 shrink-0" />
                                                <span>{[schedule.time, schedule.ampm].filter(Boolean).join(' ')}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                <MapPin size={12} className="text-slate-400 shrink-0" />
                                                <span>{schedule.location}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
