import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, Scissors, Briefcase, CheckCircle2 } from 'lucide-react';
import { bookingApi } from '../../../services/bookingApi.js';

const TYPE_CONFIG = {
    repair: { label: 'Repair', hex: '#EF4444', icon: Scissors },
    jersey: { label: 'Jersey', hex: '#0400ff', icon: Briefcase },
    org:    { label: 'Org',    hex: '#F59E0B', icon: Calendar },
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const pad = (n) => String(n).padStart(2, '0');
const toDateString = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const toInitialDateString = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return toDateString(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const AVAILABLE_TIMES = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Step indicator
const STEPS = ['date', 'time', 'confirm'];
const STEP_LABELS = ['Date', 'Time', 'Confirm'];

export default function RescheduleModal({ isOpen, onClose, onConfirm, mode = 'reschedule', currentDate }) {
    if (!isOpen) return null;

    const today = new Date();
    const fallbackDateStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());
    const [calendarDate, setCalendarDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDateStr, setSelectedDateStr] = useState(toInitialDateString(currentDate) || fallbackDateStr);
    const [selectedTime, setSelectedTime] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('date'); // 'date' | 'time' | 'confirm'

    useEffect(() => {
        if (!isOpen) return;

        const nextDateStr = toInitialDateString(currentDate) || fallbackDateStr;
        const nextDate = new Date(`${nextDateStr}T00:00:00`);

        setSelectedDateStr(nextDateStr);
        setSelectedTime('');
        setStep('date');

        if (!Number.isNaN(nextDate.getTime())) {
            setCalendarDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        }
    }, [isOpen, currentDate, fallbackDateStr]);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await bookingApi.getAllBookings();
                const mapped = response.bookings?.map(b => ({
                    date: b.pickupDate ? b.pickupDate.substring(0, 10) : new Date(b.createdAt).toISOString().split('T')[0],
                    time: b.pickupSlot || '09:00 AM',
                    customer: b.contact?.fullName || 'Unknown',
                    type: b.bookingType === 'organizational' ? 'org' : b.bookingType,
                })) || [];
                setAppointments(mapped);
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const marksByDate = useMemo(() => {
        const map = {};
        appointments.forEach(app => {
            if (!map[app.date]) map[app.date] = {};
            if (!map[app.date][app.type]) map[app.date][app.type] = 0;
            map[app.date][app.type]++;
        });
        return map;
    }, [appointments]);

    const selectedAppointments = useMemo(() =>
        appointments.filter(a => a.date === selectedDateStr)
            .sort((a, b) => new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`))
    , [appointments, selectedDateStr]);

    const bookedTimes = useMemo(() => selectedAppointments.map(a => a.time), [selectedAppointments]);

    const handleConfirm = () => {
        if (!selectedDateStr || !selectedTime) return;
        onConfirm(selectedDateStr, selectedTime);
        handleClose();
    };

    const handleClose = () => {
        const nextDateStr = toInitialDateString(currentDate) || fallbackDateStr;
        setStep('date');
        setSelectedTime('');
        setSelectedDateStr(nextDateStr);
        onClose();
    };

    const goBack = () => {
        if (step === 'time') setStep('date');
        if (step === 'confirm') setStep('time');
    };

    const selectedDateFormatted = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    const selectedDateShort = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const currentStepIndex = STEPS.indexOf(step);

    const renderCalendarCells = () => {
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(<div key={`pad-${i}`} className="aspect-square" />);

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = toDateString(year, month, d);
            const dateObj = new Date(year, month, d);
            const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
            const isPastDate = dateObj < today && !isToday; // Disable dates before today
            const isSelected = selectedDateStr === dateStr;
            const marks = marksByDate[dateStr] || {};
            const activeTypes = Object.keys(marks);
            const totalCount = Object.values(marks).reduce((s, n) => s + n, 0);

            cells.push(
                <button
                    key={d}
                    onClick={() => { if (!isPastDate) { setSelectedDateStr(dateStr); setStep('time'); setSelectedTime(''); } }}
                    disabled={isPastDate}
                    className={`
                        relative transition-all duration-200 border rounded-lg aspect-square flex flex-col items-center justify-center gap-0.5 p-1
                        ${isPastDate ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100'
                        : isSelected ? 'bg-blue-50 ring-2 ring-blue-500 border-transparent shadow-sm cursor-pointer'
                        : totalCount >= 8 ? 'bg-red-50 border-red-200 cursor-pointer'
                        : totalCount >= 5 ? 'bg-yellow-50 border-yellow-200 cursor-pointer'
                        : isToday ? 'bg-blue-50 border-blue-200 cursor-pointer'
                        : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50 cursor-pointer'}
                    `}
                >
                    <div className={`w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px]
                        ${isPastDate ? 'bg-gray-300 text-gray-500'
                        : isSelected ? 'bg-blue-600 text-white'
                        : totalCount >= 8 ? 'bg-red-500 text-white'
                        : totalCount >= 5 ? 'bg-yellow-400 text-gray-800'
                        : isToday ? 'bg-blue-600 text-white'
                        : 'text-gray-700'}`}
                    >
                        {d}
                    </div>
                    {activeTypes.length > 0 && !isPastDate && (
                        <div className="flex gap-0.5">
                            {activeTypes.map(type => (
                                <div key={type} className="w-1 h-1 rounded-full" style={{ backgroundColor: TYPE_CONFIG[type]?.hex }} />
                            ))}
                        </div>
                    )}
                </button>
            );
        }
        return cells;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-end">
            <div className="bg-white h-full w-full md:w-96 flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        {step !== 'date' && (
                            <button onClick={goBack} className="p-1 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {mode === 'approve' ? 'Set Schedule' : 'Reschedule Delivery'}
                            </h2>
                            <p className="text-[11px] text-gray-400">
                                {step === 'date' && 'Step 1 — Pick a new date'}
                                {step === 'time' && `Step 2 — Pick a time · ${selectedDateShort}`}
                                {step === 'confirm' && 'Step 3 — Review & confirm'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg border-none cursor-pointer transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Step progress bar */}
                <div className="shrink-0 px-5 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s}>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all
                                        ${i < currentStepIndex ? 'bg-blue-600 text-white'
                                        : i === currentStepIndex ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                                        : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        {i < currentStepIndex ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-[11px] font-bold transition-colors
                                        ${i <= currentStepIndex ? 'text-gray-700' : 'text-gray-300'}`}
                                    >
                                        {STEP_LABELS[i]}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded-full transition-all ${i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-100'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">

                    {/* ── STEP 1: DATE ── */}
                    {step === 'date' && (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-gray-800">{MONTH_NAMES[month]} {year}</span>
                                <div className="flex items-center gap-0.5 bg-gray-50 rounded-full p-0.5 border border-gray-100">
                                    <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-full hover:bg-white text-gray-500 transition-all cursor-pointer bg-transparent border-none">
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-full hover:bg-white text-gray-500 transition-all cursor-pointer bg-transparent border-none">
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 mb-1">
                                {WEEKDAYS.map((d, i) => (
                                    <div key={i} className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendarCells()}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Legend</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                                        <span className="text-[10px] text-gray-600 font-medium">Today / Selected</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                                        <span className="text-[10px] text-gray-600 font-medium">5–7 bookings</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                                        <span className="text-[10px] text-gray-600 font-medium">8+ bookings</span>
                                    </div>
                                    {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
                                        <div key={key} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: conf.hex }} />
                                            <span className="text-[10px] text-gray-600 font-medium">{conf.label} booking</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── STEP 2: TIME ── */}
                    {step === 'time' && (
                        <>
                            {selectedAppointments.length > 0 && (
                                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Already booked on this date</p>
                                    <div className="space-y-1.5">
                                        {selectedAppointments.map((app, idx) => {
                                            const conf = TYPE_CONFIG[app.type];
                                            return (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: conf?.hex }} />
                                                        <span className="text-xs font-medium text-gray-700">{app.customer}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${conf?.hex}18`, color: conf?.hex }}>
                                                            {conf?.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-gray-500">{app.time}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Clock size={12} /> Available Times
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {AVAILABLE_TIMES.map((time) => {
                                    const isBooked = bookedTimes.includes(time);
                                    const isSelected = selectedTime === time;
                                    return (
                                        <button
                                            key={time}
                                            onClick={() => !isBooked && setSelectedTime(time)}
                                            disabled={isBooked}
                                            className={`
                                                py-2 px-1 rounded-lg font-bold text-[11px] transition-all border
                                                ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : isBooked ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 cursor-pointer'}
                                            `}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── STEP 3: CONFIRM ── */}
                    {step === 'confirm' && (
                        <div className="flex flex-col gap-4">
                            {/* Big check icon */}
                            <div className="flex flex-col items-center py-4">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                    <CheckCircle2 size={36} className="text-blue-600" />
                                </div>
                                <p className="text-sm font-bold text-gray-800">
                                    {mode === 'approve' ? 'Confirm Schedule?' : 'Confirm Reschedule?'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 text-center">
                                    {mode === 'approve' 
                                        ? 'Please review the schedule below before confirming.' 
                                        : 'Please review the new schedule below before confirming.'}
                                </p>
                            </div>

                            {/* Summary card */}
                            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 bg-blue-600">
                                    <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                                        {mode === 'approve' ? 'Schedule' : 'New Schedule'}
                                    </p>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                            <Calendar size={15} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{selectedDateFormatted}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100" />
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                            <Clock size={15} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{selectedTime}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 text-center">
                                {mode === 'approve' 
                                    ? 'This will set the delivery schedule. The customer will be notified.' 
                                    : 'This will update the delivery schedule. The customer will be notified.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-5 py-3 shrink-0 flex gap-2">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>

                    {step === 'time' && (
                        <button
                            onClick={() => setStep('confirm')}
                            disabled={!selectedTime}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors border-none cursor-pointer"
                        >
                            Next →
                        </button>
                    )}

                    {step === 'confirm' && (
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors border-none cursor-pointer"
                        >
                            ✓ Confirm
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
