import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    CheckCircle,
    Clock,
    Scissors,
    Briefcase,
    X,
    Package
} from 'lucide-react';
import { bookingApi } from '../../services/bookingApi.js';
import { getPickupSlotDisplay, getPickupSlotSortValue } from '../../utils/pickupSlot.js';

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
    'released': { color: 'bg-cyan-100 text-cyan-700' },
    'cancelled': { color: 'bg-red-100 text-red-700' },
};

const WEEKDAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const LIVE_REFRESH_MS = 5000;
const getRepairDisplayLabel = (booking = {}) =>
    booking.selectedOptions?.[0]?.name || booking.service || booking.repairDescription || 'Repair';

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
                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                        onClick={() => {
                            onClose();
                            window.location.href = `/admin/orders/${booking.id}`;
                        }}
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdAppointment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showSchedule, setShowSchedule] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDateStr, setSelectedDateStr] = useState(toDateString(today.getFullYear(), today.getMonth(), today.getDate()));

    useEffect(() => {
        const preset = location.state?.dashboardPreset;
        if (!preset) return;

        if (typeof preset.selectedDateStr === 'string') {
            setSelectedDateStr(preset.selectedDateStr);

            const selectedDate = new Date(`${preset.selectedDateStr}T00:00:00`);
            if (!Number.isNaN(selectedDate.getTime())) {
                setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
            }
        }

        if (typeof preset.activeFilter === 'string') {
            setActiveFilter(preset.activeFilter);
        }

        if (typeof preset.showSchedule === 'boolean') {
            setShowSchedule(preset.showSchedule);
        }
    }, [location.state]);

    const mapStatus = (backendStatus) => {
        const statusMap = {
            'pending': 'pending',
            'approved': 'ready',
            'in progress': 'in progress',
            'completed': 'completed',
            'released': 'released',
            'cancelled': 'cancelled'
        };
        return statusMap[backendStatus?.toLowerCase()] || 'pending';
    };

    const fetchBookings = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
                setError(null);
            }
            const response = await bookingApi.getAllBookings();
            const mappedAppointments = response.bookings?.map(booking => ({
                id: booking._id,
                date: booking.pickupDate
                    ? booking.pickupDate.substring(0, 10)
                    : new Date(booking.createdAt).toISOString().split('T')[0],
                time: getPickupSlotDisplay(booking.pickupSlot, '09:00 AM'),
                customer: booking.contact?.fullName || 'Unknown Customer',
                service: booking.bookingType === 'repair' ? getRepairDisplayLabel(booking) : booking.service,
                type: booking.bookingType === 'organizational' ? 'org' : booking.bookingType,
                status: mapStatus(booking.status),
                staff: booking.assignedTailor || 'Unassigned',
            })) || [];
            setAppointments(mappedAppointments);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            if (!silent) {
                setError('Failed to load appointments');
                setAppointments([]);
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchBookings(false);

        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            fetchBookings(true);
        }, LIVE_REFRESH_MS);

        return () => window.clearInterval(intervalId);
    }, [fetchBookings]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const selectedAppointments = useMemo(() => {
        return appointments.filter(app => app.date === selectedDateStr).sort((a, b) => {
            return getPickupSlotSortValue(a.time, '09:00 AM') - getPickupSlotSortValue(b.time, '09:00 AM');
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

            const countStatus =
                totalCount >= 7 ? 'full' :
                    totalCount >= 4 ? 'near-full' :
                        totalCount >= 1 ? 'available' : 'none';

            cells.push(
                <div
                    key={d}
                    onClick={() => handleDayClick(dateStr)}
                    className={`
                        relative transition-all duration-300 border rounded-2xl flex flex-col
                        aspect-square sm:aspect-auto sm:min-h-[100px]
                        p-2 sm:p-3 cursor-pointer group
                        ${isSelected
                            ? 'bg-green-600/70 border-green-600 shadow-xl z-10 -translate-y-0.5'
                            : countStatus === 'full'
                                ? 'bg-red-50/50 border-red-100 hover:border-red-300 hover:shadow-md'
                                : countStatus === 'near-full'
                                    ? 'bg-amber-50/50 border-amber-100 hover:border-amber-300 hover:shadow-md'
                                    : countStatus === 'available'
                                        ? 'bg-blue-50/50 border-blue-100 hover:border-blue-300 hover:shadow-md'
                                        : isToday
                                            ? 'bg-slate-100 border-slate-200 hover:shadow-md'
                                            : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50/50 hover:shadow-sm'
                        }
                    `}
                >
                    <div className={`
                        w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl font-black shrink-0 text-[11px] sm:text-[13px] transition-all duration-300
                        ${isSelected
                            ? 'bg-white/20 text-white backdrop-blur-sm'
                            : countStatus === 'full'
                                ? 'bg-red-500 text-white shadow-sm ring-4 ring-red-50'
                                : countStatus === 'near-full'
                                    ? 'bg-amber-400 text-amber-900 shadow-sm ring-4 ring-amber-50'
                                    : countStatus === 'available'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : isToday
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                            : 'text-slate-600 group-hover:text-blue-600'
                        }
                    `}>
                        {d}
                    </div>

                    <div className="mt-auto pt-2">
                        {activeTypes.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {activeTypes.map(type => (
                                    <div
                                        key={type}
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-white"
                                        style={{ backgroundColor: isSelected ? '#fff' : TYPE_CONFIG[type].hex }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {totalCount > 0 && !isSelected && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                                {totalCount}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return cells;
    };

    const selectedDateFormatted = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();

    const stats = useMemo(() => {
        const repairCount = appointments.filter(a => a.type === 'repair').length;
        const jerseyCount = appointments.filter(a => a.type === 'jersey').length;
        const orgCount = appointments.filter(a => a.type === 'org').length;
        const totalCount = appointments.length;

        return [
            { label: 'Repair', value: repairCount, sub: 'Repair services', icon: Scissors, color: '#EF4444', bg: '#FEF2F2' },
            { label: 'Jersey', value: jerseyCount, sub: 'Jersey orders', icon: Briefcase, color: '#0400ff', bg: '#EEF2FF' },
            { label: 'Organization', value: orgCount, sub: 'Company Order', icon: Calendar, color: '#F59E0B', bg: '#FFFBEB' },
            { label: 'Overall Total', value: totalCount, sub: 'All appointments', icon: Package, color: '#2563EB', bg: '#EFF6FF' },
        ];
    }, [appointments]);

    return (
        <div className="font-inter min-h-screen bg-slate-50">
            <div className="px-4 sm:px-6 py-5 pb-24 sm:pb-10">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50"
                            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                        >
                            <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: stat.color }} />
                            <div className="flex items-center gap-2 mb-1.5 sm:mb-3">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: stat.bg }}>
                                    <stat.icon size={13} color={stat.color} strokeWidth={2.5} className="sm:hidden" />
                                    <stat.icon size={16} color={stat.color} strokeWidth={2.2} className="hidden sm:block" />
                                </div>
                                <span className="text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">{stat.label}</span>
                            </div>
                            <div className="mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] font-black sm:font-extrabold text-gray-900 leading-none tracking-tight pl-[36px] sm:pl-[45px] text-left">
                                {stat.value}
                            </div>
                            <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[36px] sm:pl-[45px] opacity-80 sm:opacity-100">{stat.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 xl:items-start">

                    <div className="xl:col-span-2 bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-5 sm:mb-8 flex-wrap gap-3 sm:gap-4">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 sm:gap-3 tracking-tight">
                                <Calendar className="text-blue-500" size={22} />
                                {monthNames[month]} {year}
                            </h2>
                            <div className="flex items-center gap-2 ml-auto">
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

                    </div>
                    <div className={`
                        xl:block bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100
                        flex flex-col h-full
                        ${showSchedule ? 'block' : 'hidden xl:flex'}
                    `}>

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
                                                {conf.label} {count}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="overflow-y-auto p-3 sm:px-4 lg:px-6 pt-3 space-y-2 sm:space-y-2.5 max-h-[540px] custom-scrollbar">
                            {filteredAppointments.length > 0 ? (
                                <>
                                    {filteredAppointments.map(app => {
                                        const statusBadge = STATUS_CONFIG[app.status] || STATUS_CONFIG['pending'];
                                        return (
                                            <div
                                                key={app.id}
                                                onClick={() => navigate(`/admin/orders/${app.id}`)}
                                                className="bg-[#F8FAFC] border border-gray-100 p-2.5 sm:p-3.5 rounded-xl hover:border-blue-200 hover:shadow-md transition-all cursor-pointer active:bg-blue-50"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold text-gray-400 tracking-wider">{app.time}</span>
                                                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${statusBadge.color}`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                                <h4 className="text-[14px] sm:text-[15px] font-bold text-gray-800 mb-1.5 leading-snug">{app.customer}</h4>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_CONFIG[app.type].hex }} />
                                                        <span className="truncate max-w-[100px] sm:max-w-[120px]">{app.service}</span>
                                                    </div>
                                                    <span className="text-gray-300">|</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate">{app.staff}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredAppointments.length > 0 && filteredAppointments.length < 5 && (
                                        <div className="py-10 rounded-2xl flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-slate-300 tracking-[0.2em]">Nothing here</span>
                                        </div>
                                    )}
                                </>
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
                        <div className="shrink-0 px-4 py-3 sm:px-6 bg-slate-50 border-t border-gray-200 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Service Types</h4>
                                    <div className="space-y-2">
                                        {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
                                            <div key={key} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-200/50 shadow-xs">
                                                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: conf.hex }} />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{conf.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Workload & Status</h4>
                                    <div className="space-y-2">
                                        {[
                                            { color: 'bg-blue-600', ring: 'ring-blue-50', label: '1-3 Low' },
                                            { color: 'bg-amber-400', ring: 'ring-amber-50', label: '4-6 Med' },
                                            { color: 'bg-red-500', ring: 'ring-red-50', label: '7+ Full' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-200/50 shadow-xs">
                                                <div className={`w-2 h-2 rounded-full shadow-sm ring-2 ${item.ring} ${item.color}`} />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
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

            <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
        </div>
    );
};

export default AdAppointment;
