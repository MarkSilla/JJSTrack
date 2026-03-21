import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    CheckCircle,
    Clock,
    Scissors,
    Briefcase,
    Plus,
    X
} from 'lucide-react';
import BookingModal from './Bookingforms';
import { bookingApi } from '../../services/bookingApi.js';

const TYPE_CONFIG = {
    repair: { label: 'Repair', hex: '#EF4444', icon: Scissors },
    jersey: { label: 'Jersey', hex: '#0400ff', icon: Briefcase },
    org: { label: 'Org', hex: '#F59E0B', icon: Calendar },
};

const STATUS_CONFIG = {
    'ready': { color: 'bg-green-100 text-green-700' },
    'in progress': { color: 'bg-blue-100 text-blue-700' },
    'pending': { color: 'bg-amber-100 text-amber-700' },
    'completed': { color: 'bg-gray-100 text-gray-700' },
};

const WEEKDAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const pad = (n) => String(n).padStart(2, '0');
const toDateString = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

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

const AdAppointment = () => {
    const [showBooking, setShowBooking] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showSchedule, setShowSchedule] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDateStr, setSelectedDateStr] = useState(toDateString(today.getFullYear(), today.getMonth(), today.getDate()));

    const mapStatus = (backendStatus) => {
        const statusMap = {
            'pending': 'pending',
            'approved': 'ready',
            'in progress': 'in progress',
            'completed': 'completed',
            'cancelled': 'pending'
        };
        return statusMap[backendStatus?.toLowerCase()] || 'pending';
    };

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await bookingApi.getAllBookings();
                const mappedAppointments = response.bookings?.map(booking => ({
                    id: booking._id,
                    date: booking.pickupDate
                        ? booking.pickupDate.substring(0, 10)
                        : new Date(booking.createdAt).toISOString().split('T')[0],
                    time: booking.pickupSlot || '09:00 AM',
                    customer: booking.contact?.fullName || 'Unknown Customer',
                    service: booking.service,
                    type: booking.bookingType === 'organizational' ? 'org' : booking.bookingType,
                    status: mapStatus(booking.status),
                    staff: booking.assignedTailor || 'Unassigned',
                })) || [];
                setAppointments(mappedAppointments);
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
                setError('Failed to load appointments');
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const selectedAppointments = useMemo(() => {
        return appointments.filter(app => app.date === selectedDateStr).sort((a, b) => {
            return new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`);
        });
    }, [appointments, selectedDateStr]);

    const marksByDate = useMemo(() => {
        const map = {};
        appointments.forEach(app => {
            if (!map[app.date]) map[app.date] = {};
            if (!map[app.date][app.type]) map[app.date][app.type] = 0;
            map[app.date][app.type]++;
        });
        return map;
    }, [appointments]);

    const typesOnSelectedDate = useMemo(() => {
        const types = new Set(selectedAppointments.map(a => a.type));
        return [...types];
    }, [selectedAppointments]);

    // Auto-reset filter if current active type no longer exists on the selected date
    useEffect(() => {
        if (activeFilter !== 'all' && !typesOnSelectedDate.includes(activeFilter)) {
            setActiveFilter('all');
        }
    }, [typesOnSelectedDate, activeFilter]);

    const filteredAppointments = useMemo(() => {
        if (activeFilter === 'all') return selectedAppointments;
        return selectedAppointments.filter(a => a.type === activeFilter);
    }, [selectedAppointments, activeFilter]);

    const handleDayClick = (dateStr) => {
        setSelectedDateStr(dateStr);
        setShowSchedule(true);
        setActiveFilter('all');
    };

    const renderCalendarCells = () => {
        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`pad-${i}`} className="aspect-square sm:aspect-auto sm:min-h-[90px]" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = toDateString(year, month, d);
            const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = selectedDateStr === dateStr;
            const marks = marksByDate[dateStr] || {};
            const activeTypes = Object.keys(marks).sort();
            const totalCount = Object.values(marks).reduce((s, n) => s + n, 0);

            cells.push(
                <div
                    key={d}
                    onClick={() => handleDayClick(dateStr)}
                    className={`
                        relative cursor-pointer transition-all duration-200 border rounded-xl flex flex-col
                        aspect-square sm:aspect-auto sm:min-h-[90px]
                        p-1.5 sm:p-2.5
                        ${isSelected
                            ? 'bg-blue-50 ring-2 ring-blue-500 border-transparent shadow-md'
                            : totalCount >= 8
                                ? 'bg-red-50 border-red-200 hover:shadow-md'
                                : totalCount >= 5
                                    ? 'bg-yellow-50 border-yellow-200 hover:shadow-md'
                                    : isToday
                                        ? 'bg-blue-50 border-blue-200 hover:shadow-md'
                                        : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm'
                        }
                    `}
                >
                    <div className={`
                        w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold shrink-0 text-[11px] sm:text-sm
                        ${isSelected ? 'bg-blue-600 text-white shadow-sm' : totalCount >= 8 ? 'bg-red-500 text-white shadow-sm' : totalCount >= 5 ? 'bg-yellow-400 text-gray-800 shadow-sm' : isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700'}
                    `}>
                        {d}
                    </div>

                    <div className="mt-auto">
                        {activeTypes.length > 0 && (
                            <>
                                <div className="hidden sm:flex flex-col gap-1 w-full mt-1">
                                    {activeTypes.map(type => (
                                        <div key={type} className="flex items-center gap-1.5 w-full">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TYPE_CONFIG[type].hex }} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: TYPE_CONFIG[type].hex }}>
                                                {TYPE_CONFIG[type].label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex sm:hidden gap-0.5 mt-1 flex-wrap">
                                    {activeTypes.map(type => (
                                        <div key={type} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_CONFIG[type].hex }} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        return cells;
    };

    const selectedDateFormatted = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="font-inter min-h-screen bg-slate-50">
            <div className="px-4 sm:px-6 py-5 pb-24 sm:pb-10">

                {/* KEY FIX: items-start so the right panel doesn't stretch to match calendar height */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 xl:items-start">

                    {/* ── Calendar Panel ── */}
                    <div className="xl:col-span-2 bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-5 sm:mb-8 flex-wrap gap-3 sm:gap-4">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 sm:gap-3 tracking-tight">
                                <Calendar className="text-blue-500" size={22} />
                                {monthNames[month]} {year}
                            </h2>
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => setShowBooking(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-0 hover:gap-2 shrink-0 overflow-hidden group"
                                    style={{
                                        padding: '10px',
                                        width: '40px',
                                        transition: 'width 280ms cubic-bezier(0.4,0,0.2,1), padding 280ms cubic-bezier(0.4,0,0.2,1), gap 280ms cubic-bezier(0.4,0,0.2,1)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.width = '122px';
                                        e.currentTarget.style.padding = '10px 16px';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.width = '40px';
                                        e.currentTarget.style.padding = '10px';
                                    }}
                                >
                                    <Plus size={18} className="shrink-0" />
                                    <span
                                        className="overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[80px]"
                                        style={{ transition: 'max-width 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease' }}
                                    >
                                        Add new
                                    </span>
                                </button>
                                <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-gray-100">
                                    <button onClick={prevMonth} className="p-2 sm:p-2.5 rounded-full hover:bg-white hover:shadow-sm text-gray-600 transition-all cursor-pointer bg-transparent border-none">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button onClick={nextMonth} className="p-2 sm:p-2.5 rounded-full hover:bg-white hover:shadow-sm text-gray-600 transition-all cursor-pointer bg-transparent border-none">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 mb-2 sm:mb-4">
                            {WEEKDAYS_FULL.map((day, i) => (
                                <div key={day} className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">
                                    <span className="hidden sm:inline">{day}</span>
                                    <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {renderCalendarCells()}
                        </div>

                        <div className="flex flex-col gap-3 mt-5 sm:mt-8 p-3 sm:p-4 bg-gray-50/80 rounded-xl sm:rounded-2xl border border-gray-100">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-600">Today</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-600">5-7 Due Dates</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-600">8+ Due Dates</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                    {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
                                        <div key={key} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.hex }} />
                                            <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest">{conf.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Schedule Panel ──
                        sticky so it stays in view while scrolling the page,
                        fixed height = viewport minus top offset,
                        flex-col so header/filter are shrink-0 and list takes remaining space with overflow-y-auto
                    */}
                    <div className={`
                        xl:block bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100
                        flex flex-col
                        ${showSchedule ? 'block' : 'hidden xl:flex'}


                    `}>

                        {/* Header */}
                        <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-7 pb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                                    <Calendar className="text-blue-500" size={18} />
                                    <span>{selectedDateFormatted}</span>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">
                                        {activeFilter === 'all'
                                            ? `${selectedAppointments.length} items`
                                            : `${filteredAppointments.length}/${selectedAppointments.length}`}
                                    </span>
                                    <button
                                        onClick={() => setShowSchedule(false)}
                                        className="xl:hidden w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer border-none"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter navbar — only shows when 2+ types on this date */}
                        {typesOnSelectedDate.length > 1 && (
                            <div className="shrink-0 px-4 sm:px-6 lg:px-8 pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                    <button
                                        onClick={() => setActiveFilter('all')}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all border-none cursor-pointer ${activeFilter === 'all'
                                            ? 'bg-gray-800 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        All {selectedAppointments.length}
                                    </button>
                                    {typesOnSelectedDate.map(type => {
                                        const conf = TYPE_CONFIG[type];
                                        const TypeIcon = conf.icon;
                                        const isActive = activeFilter === type;
                                        const count = selectedAppointments.filter(a => a.type === type).length;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setActiveFilter(type)}
                                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all border-none cursor-pointer"
                                                style={{
                                                    backgroundColor: isActive ? conf.hex : `${conf.hex}18`,
                                                    color: isActive ? '#fff' : conf.hex,
                                                }}
                                            >
                                                <TypeIcon size={11} />
                                                {conf.label} {count}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Scrollable list — takes all remaining height inside the panel */}
                        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 pt-4 space-y-3 sm:space-y-4 max-h-[60vh]">
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map(app => {
                                    const TypeIcon = TYPE_CONFIG[app.type].icon;
                                    const statusBadge = STATUS_CONFIG[app.status] || STATUS_CONFIG['pending'];
                                    return (
                                        <div
                                            key={app.id}
                                            onClick={() => setSelectedBooking(app)}
                                            className="bg-[#F8FAFC] border border-gray-100 p-4 sm:p-5 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all cursor-pointer active:bg-blue-50"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-bold text-gray-400 tracking-wider">{app.time}</span>
                                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${statusBadge.color}`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <h4 className="text-[14px] sm:text-[15px] font-bold text-gray-800 mb-1.5 leading-snug">{app.customer}</h4>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <TypeIcon style={{ color: TYPE_CONFIG[app.type].hex }} size={14} />
                                                    <span className="truncate max-w-[100px] sm:max-w-[120px]">{app.service}</span>
                                                </div>
                                                <span className="text-gray-300">|</span>
                                                <div className="flex items-center gap-1.5">
                                                    <User size={14} className="text-blue-400" />
                                                    <span className="truncate">{app.staff}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-10 sm:py-16 px-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-gray-400">
                                        <Calendar size={28} />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">No appointments</p>
                                    <p className="text-xs text-gray-400 mt-1.5 max-w-[180px]">No scheduled events for this date.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {!showSchedule && (
                    <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                        {selectedAppointments.length > 0 && (
                            <button
                                onClick={() => setShowSchedule(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-full shadow-lg border-none cursor-pointer transition-all active:scale-95"
                            >
                                <Calendar size={16} />
                                {selectedAppointments.length} appointment{selectedAppointments.length > 1 ? 's' : ''} on {selectedDateFormatted}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} />
            <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
        </div>
    );
};

export default AdAppointment;