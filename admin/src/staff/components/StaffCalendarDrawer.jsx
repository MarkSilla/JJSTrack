import React, { useMemo, useState } from 'react';
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

    return (
        <>
            <div
                className={`fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            />

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

                <div className="flex-1 overflow-y-auto">
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

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                <div key={day} className="text-center text-xs font-semibold text-gray-400">{day}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                            {days.map((day, idx) => (
                                <div key={idx} className="flex justify-center aspect-square items-center relative group">
                                    {day && (
                                        <button
                                            onClick={() => setSelectedDayKey(getDayKey(day))}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                                                ${isSelectedDay(day)
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                    : isToday(day)
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : isPastDate(day)
                                                            ? 'text-gray-300 cursor-not-allowed'
                                                            : 'text-gray-700 hover:bg-gray-100'
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

                    <div className="h-px bg-gray-100 mx-5 my-2"></div>

                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">
                                    {selectedSchedules.length > 0 ? 'Selected Day Schedule' : 'Upcoming Schedule'}
                                </h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {selectedSchedules.length > 0
                                        ? `${selectedSchedules.length} task${selectedSchedules.length > 1 ? 's' : ''} on this date`
                                        : 'No schedule on the selected date yet'}
                                </p>
                            </div>
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                {visibleSchedules.length}
                            </span>
                        </div>

                        {schedules.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <p className="text-sm font-semibold text-gray-600">No assigned schedules yet</p>
                                <p className="text-xs text-gray-400 mt-1">Your upcoming bookings will appear here automatically.</p>
                            </div>
                        ) : visibleSchedules.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <p className="text-sm font-semibold text-gray-600">Nothing scheduled here yet</p>
                                <p className="text-xs text-gray-400 mt-1">Pick another date on the calendar to inspect your tasks.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {visibleSchedules.map((schedule) => (
                                    <div key={schedule.id} className="flex gap-3 items-start group">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors flex items-center justify-center shrink-0">
                                            <Clock3 size={18} />
                                        </div>
                                        <div className={`flex-1 border-l-2 pl-3 ${schedule.colorClass || 'border-blue-400'}`}>
                                            <div className="flex justify-between items-start gap-3">
                                                <h4 className="text-sm font-semibold text-gray-800">{schedule.title}</h4>
                                                <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    {schedule.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                                                <CalendarIcon size={12} /> {schedule.dateLabel}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                                                <Clock3 size={12} /> {[schedule.time, schedule.ampm].filter(Boolean).join(' ')}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                                                <MapPin size={12} /> {schedule.location}
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
