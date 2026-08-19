import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    ClipboardList, Clock, Loader, CheckCircle, AlertTriangle, CalendarDays, MoreVertical, CheckCircle2, Inbox, CalendarX, CalendarIcon, ChevronDown, ChevronUp, Search, X, User, ChevronRight
} from 'lucide-react';
import { bookingApi } from '../services/bookingApi';
import { orderApi } from '../services/orderApi.js';
import {
    isStandaloneBookingTask,
    mapBookingToTask,
    mapOrderToTask,
} from '../utils/taskMappers.js';
import useOrderFeedSocket from '../hooks/useOrderFeedSocket.js';
import { getPickupSlotDisplay } from '../utils/pickupSlot.js';
import { getStaffDerivedStatus } from '../utils/orderStatus.js';
import { StaffDashboardSkeleton } from '../../components/SkeletonLoaders.jsx';
import { StatCard, StatusBadge, DataCard, EmptyState } from '../../components/ui';

const FALLBACK_REFRESH_MS = 60000;

const parseScheduleDate = (value) => {
    if (!value) return null;
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const splitTimeLabel = (pickupSlot) => {
    const raw = getPickupSlotDisplay(pickupSlot, 'TBA');
    const match = raw.match(/^(.+?)\s*(AM|PM)$/i);

    if (!match || raw.includes(' - ')) {
        return { time: raw, ampm: '' };
    }

    return {
        time: match[1].trim(),
        ampm: match[2].toUpperCase(),
    };
};

const getScheduleColorClass = (status) => {
    if (status === 'Released') return 'border-cyan-400';
    if (status === 'Completed') return 'border-emerald-400';
    if (status === 'Pending' || status === 'Approved') return 'border-amber-400';
    return 'border-blue-400';
};

const buildScheduleEntries = (bookings = []) =>
    bookings
        .filter((booking) => {
            const derivedStatus = getStaffDerivedStatus(booking);
            return derivedStatus !== 'Cancelled' && derivedStatus !== 'Completed' && derivedStatus !== 'Released';
        })
        .map((booking) => {
            const scheduleDate = parseScheduleDate(booking.pickupDate || booking.estimatedCompletion || booking.createdAt);
            const derivedStatus = getStaffDerivedStatus(booking);

            if (!scheduleDate) {
                return null;
            }

            const { time, ampm } = splitTimeLabel(booking.pickupSlot);
            const customerName = booking.contact?.fullName || booking.customer || 'Customer';
            const serviceName = booking.service || booking.item || booking.serviceType || booking.bookingType || 'Service';
            const location = booking.contact?.address || booking.serviceType || booking.bookingType || 'Assigned booking';

            return {
                id: booking._id || booking.id,
                title: `${customerName} - ${serviceName}`,
                location,
                time,
                ampm,
                dateLabel: scheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                dateValue: scheduleDate.toISOString(),
                dayKey: formatDateKey(scheduleDate),
                status: derivedStatus,
                colorClass: getScheduleColorClass(derivedStatus),
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(a.dateValue) - new Date(b.dateValue));

const buildAlerts = (bookings = []) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings
        .filter((booking) => {
            const derivedStatus = getStaffDerivedStatus(booking);
            return derivedStatus !== 'Cancelled' && derivedStatus !== 'Completed' && derivedStatus !== 'Released';
        })
        .map((booking) => {
            const scheduleDate = parseScheduleDate(booking.pickupDate || booking.estimatedCompletion);
            const customerName = booking.contact?.fullName || booking.customer || 'Customer';
            const taskName = booking.service || booking.item || booking.serviceType || booking.bookingType || 'Task';
            const derivedStatus = getStaffDerivedStatus(booking);
            const taskId = booking._id || booking.id;

            if (scheduleDate && scheduleDate < today && derivedStatus !== 'Completed' && derivedStatus !== 'Released') {
                return {
                    id: taskId,
                    type: 'overdue',
                    title: `${customerName} is overdue`,
                    desc: `${taskName} was scheduled for ${scheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
                };
            }

            if (derivedStatus === 'Pending') {
                return {
                    id: taskId,
                    type: 'pending',
                    title: `${customerName} is waiting`,
                    desc: `${taskName} still needs attention from the team.`,
                };
            }

            return null;
        })
        .filter(Boolean)
        .slice(0, 5);
};

const getTaskPriority = (task) => {
    if (task.priority) return task.priority;
    if (task.urgent || task.isUrgent) return 'High';
    const derivedStatus = getStaffDerivedStatus(task);
    if (derivedStatus === 'Overdue') return 'High';
    return 'Normal';
};

const Dashboard = () => {
    const navigate = useNavigate();
    const outletContext = useOutletContext() || {};
    const toggleCalendar = outletContext.toggleCalendar;
    const setCalendarEntries = outletContext.setCalendarEntries;
    const [tasks, setTasks] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const upcomingScheduleRef = useRef(null);

    const fetchTasks = useCallback(async (silent = false) => {
        const updateCalendarEntries = typeof setCalendarEntries === 'function' ? setCalendarEntries : () => { };

        try {
            if (!silent) {
                setLoading(true);
            }

            const token = localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const [bookingResponse, orderResponse] = await Promise.allSettled([
                bookingApi.getAllBookings(),
                orderApi.getAllOrders(),
            ]);

            const bookings =
                bookingResponse.status === 'fulfilled' && bookingResponse.value?.success
                    ? Array.isArray(bookingResponse.value.bookings)
                        ? bookingResponse.value.bookings
                        : []
                    : [];
            const orders =
                orderResponse.status === 'fulfilled' && orderResponse.value?.success
                    ? Array.isArray(orderResponse.value.orders)
                        ? orderResponse.value.orders
                        : []
                    : [];

            const mergedTasks = [
                ...orders.map(mapOrderToTask),
                ...bookings.filter(isStandaloneBookingTask).map(mapBookingToTask),
            ].sort((first, second) => {
                const firstDate = parseScheduleDate(first.pickupDate || first.estimatedCompletion || first.createdAt);
                const secondDate = parseScheduleDate(second.pickupDate || second.estimatedCompletion || second.createdAt);
                return (secondDate?.getTime?.() || 0) - (firstDate?.getTime?.() || 0);
            });

            const nextSchedules = buildScheduleEntries(mergedTasks);
            const nextAlerts = buildAlerts(mergedTasks);

            setTasks(mergedTasks);
            setAlerts(nextAlerts);
            setSchedules(nextSchedules);
            updateCalendarEntries(nextSchedules);
        } catch (error) {
            console.error('Error fetching staff tasks:', error);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [setCalendarEntries]);

    useEffect(() => {
        fetchTasks(false);

        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            fetchTasks(true);
        }, FALLBACK_REFRESH_MS);

        return () => {
            window.clearInterval(intervalId);
            if (typeof setCalendarEntries === 'function') {
                setCalendarEntries([]);
            }
        };
    }, [fetchTasks, setCalendarEntries]);

    useOrderFeedSocket(() => {
        fetchTasks(true);
    });

    const summaryStats = useMemo(() => ({
        totalTasks: tasks.length,
        pending: tasks.filter(task => getStaffDerivedStatus(task) === 'Pending').length,
        overdue: tasks.filter(task => getStaffDerivedStatus(task) === 'Overdue').length,
        inProgress: tasks.filter(task => getStaffDerivedStatus(task) === 'In Progress').length,
        completed: tasks.filter(task => getStaffDerivedStatus(task) === 'Completed').length,
        released: tasks.filter(task => getStaffDerivedStatus(task) === 'Released').length,
    }), [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const derivedStatus = getStaffDerivedStatus(task);
            const matchesStatus = statusFilter === 'All' || derivedStatus.toLowerCase() === statusFilter.toLowerCase();

            const query = searchQuery.toLowerCase().trim();
            if (!query) return matchesStatus;

            const taskName = String(task.service || task.item || task.serviceType || '').toLowerCase();
            const customer = String(task.customer || task.customerName || '').toLowerCase();
            const displayId = String(task.displayId || task._id || '').toLowerCase();

            const matchesQuery = taskName.includes(query) || customer.includes(query) || displayId.includes(query);

            return matchesStatus && matchesQuery;
        });
    }, [tasks, statusFilter, searchQuery]);

    const summaryCards = [
        { label: 'Pending', value: summaryStats.pending, icon: Clock, accent: "#F59E0B", sub: summaryStats.pending === 0 ? 'No pending items' : 'Awaiting staff action', filterStatus: 'Pending' },
        { label: 'Overdue', value: summaryStats.overdue, icon: AlertTriangle, accent: "#DC2626", sub: summaryStats.overdue === 0 ? 'No overdue items' : 'Past target completion date', filterStatus: 'Overdue' },
        { label: 'In Progress', value: summaryStats.inProgress, icon: Loader, accent: "#7C3AED", sub: summaryStats.inProgress === 0 ? 'No active production' : 'Ongoing production work', filterStatus: 'In Progress' },
        { label: 'Total Tasks', value: summaryStats.totalTasks, icon: ClipboardList, accent: "#3B82F6", sub: summaryStats.totalTasks === 0 ? 'No records logged' : 'All active & logged items', filterStatus: 'All' },
        { label: 'Completed', value: summaryStats.completed, icon: CheckCircle, accent: "#059669", sub: summaryStats.completed === 0 ? 'No ready items' : 'Ready for customer pickup', filterStatus: 'Completed' },
        { label: 'Released', value: summaryStats.released, icon: CheckCircle2, accent: "#06B6D4", sub: summaryStats.released === 0 ? 'No released items' : 'Fulfilled to client', filterStatus: 'Released' },
    ];

    const upcomingSchedules = useMemo(() => schedules.slice(0, 5), [schedules]);

    const openOrdersPage = useCallback((filterStatus = 'All') => {
        navigate('/staff/orders', {
            state: {
                dashboardPreset: { filterStatus },
            },
        });
    }, [navigate]);

    const openTaskDetails = useCallback((taskId) => {
        if (!taskId) return;
        navigate(`/staff/orders/${taskId}`);
    }, [navigate]);

    const scrollToUpcomingSchedule = useCallback(() => {
        if (upcomingScheduleRef.current) {
            upcomingScheduleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        if (typeof toggleCalendar === 'function') {
            toggleCalendar();
        }
    }, [toggleCalendar]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-700 bg-red-50 border border-red-200/60';
            case 'Medium': return 'text-amber-700 bg-amber-50 border border-amber-200/60';
            case 'Low': return 'text-slate-600 bg-slate-100 border border-slate-200/60';
            default: return 'text-slate-600 bg-slate-50 border border-slate-200/60';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Overdue': return 'bg-red-50 text-red-700 border border-red-200/60';
            case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200/60';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border border-blue-200/60';
            case 'Completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
            case 'Released': return 'bg-cyan-50 text-cyan-700 border border-cyan-200/60';
            default: return 'bg-slate-50 text-slate-600 border border-slate-200/60';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Overdue': return 'bg-red-500';
            case 'Pending': return 'bg-amber-500';
            case 'In Progress': return 'bg-blue-500';
            case 'Completed': return 'bg-emerald-500';
            case 'Released': return 'bg-cyan-500';
            default: return 'bg-slate-400';
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formattedTodayDate = useMemo(() => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, []);

    const urgentItemsCount = useMemo(() => {
        return summaryStats.overdue + summaryStats.pending;
    }, [summaryStats]);

    if (loading) {
        return <StaffDashboardSkeleton />;
    }

    return (
        <div className="space-y-4 sm:space-y-5 font-inter">
            {/* SECTION 1: WELCOME BANNER (Mobile-First SaaS Workspace Header) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/80">
                                <CalendarDays className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>{formattedTodayDate}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span>Active Staff Workspace</span>
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                            {getGreeting()}, Staff
                        </h1>
                        <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl">
                            {urgentItemsCount > 0
                                ? `${urgentItemsCount} workload item${urgentItemsCount !== 1 ? 's require' : ' requires'} immediate staff action today.`
                                : "All scheduled operational workloads are running smoothly."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pt-1 md:pt-0">
                        <button
                            type="button"
                            onClick={() => typeof toggleCalendar === 'function' && toggleCalendar()}
                            disabled={loading}
                            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl border border-blue-500 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
                        >
                            <CalendarDays className="w-4 h-4 text-white shrink-0" />
                            <span>View Schedule</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* DESKTOP KPI METRIC CARDS (Visible on Desktop >=768px) */}
            <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {summaryCards.map(({ icon, label, value, sub, accent, filterStatus }, idx) => (
                    <StatCard
                        key={idx}
                        icon={icon}
                        label={label}
                        value={value}
                        sub={sub}
                        accentColor={accent}
                        onClick={() => openOrdersPage(filterStatus)}
                    />
                ))}
            </div>

            {/* MAIN CONTENT SPLIT LAYOUT (Mobile Vertical Order -> Tablet/Desktop Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
                
                {/* LEFT MAIN COLUMN: Workspace & Mobile Alerts */}
                <div className="lg:col-span-2 space-y-4">
                    
                    {/* SECTION 2: TODAY'S TASK ALERT (High-Visibility Mobile Workload Alert) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200/60">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Today's Task Alert</h3>
                                    <p className="text-[11px] text-slate-500 font-medium">Workload items needing attention</p>
                                </div>
                            </div>
                            {alerts.length > 0 ? (
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                    {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                                </span>
                            ) : (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    <span>All Clear</span>
                                </span>
                            )}
                        </div>

                        {alerts.length === 0 ? (
                            <div className="p-4 sm:p-5 flex items-center gap-3 bg-emerald-50/40">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-emerald-900">No Pending Alert items</p>
                                    <p className="text-emerald-700 mt-0.5">All scheduled tasks and customer orders for today are up to date.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                                {alerts.map((alert, i) => (
                                    <div
                                        key={i}
                                        tabIndex={alert.id ? 0 : undefined}
                                        role={alert.id ? "button" : undefined}
                                        onClick={() => alert.id && openTaskDetails(alert.id)}
                                        onKeyDown={(e) => {
                                            if (alert.id && (e.key === 'Enter' || e.key === ' ')) {
                                                e.preventDefault();
                                                openTaskDetails(alert.id);
                                            }
                                        }}
                                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 min-h-[44px] ${
                                            alert.id ? 'cursor-pointer hover:shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none' : ''
                                        } ${
                                            alert.type === 'overdue'
                                                ? 'bg-rose-50/70 border-rose-200 text-rose-950 hover:bg-rose-100/70'
                                                : 'bg-amber-50/70 border-amber-200 text-amber-950 hover:bg-amber-100/70'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                alert.type === 'overdue' ? 'bg-rose-600' : 'bg-amber-600'
                                            }`} />
                                            <div className="min-w-0">
                                                <p className={`text-xs font-bold ${alert.type === 'overdue' ? 'text-rose-900' : 'text-amber-900'}`}>
                                                    {alert.title}
                                                </p>
                                                <p className={`text-[11px] mt-0.5 font-medium leading-relaxed ${
                                                    alert.type === 'overdue' ? 'text-rose-700' : 'text-amber-800'
                                                }`}>
                                                    {alert.desc}
                                                </p>
                                            </div>
                                        </div>
                                        {alert.id && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openTaskDetails(alert.id);
                                                }}
                                                className="shrink-0 min-h-[36px] px-2.5 py-1 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                            >
                                                <span>Resolve</span>
                                                <ChevronRight size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 3 & 4: TODAY'S TASKS WORKSPACE & LIGHTWEIGHT SAAS TABLE */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                                    <ClipboardList size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Today's Tasks Workspace</h3>
                                    <p className="text-xs text-slate-500 font-medium">Main operational workload items</p>
                                </div>
                            </div>
                            {tasks.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => openOrdersPage('All')}
                                    className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                                >
                                    View all ({tasks.length})
                                </button>
                            ) : (
                                <span className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-lg cursor-not-allowed">
                                    View all
                                </span>
                            )}
                        </div>

                        {/* Search Bar & Filter Controls */}
                        {tasks.length > 0 && (
                            <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Touch-Friendly Search Input */}
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search task, customer, or ID..."
                                        className="w-full pl-9 pr-8 min-h-[40px] text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[32px] px-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Status Filter Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                                    {['All', 'Pending', 'In Progress', 'Overdue', 'Completed'].map((status) => {
                                        const isSelected = statusFilter === status;
                                        return (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setStatusFilter(status)}
                                                className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Task List / Data Table Rendering */}
                        {filteredTasks.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 border border-blue-100">
                                    <Inbox className="w-6 h-6 text-blue-600" strokeWidth={1.75} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 mb-1">
                                    {tasks.length === 0 ? "No tasks for today" : "No matching tasks found"}
                                </h4>
                                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                                    {tasks.length === 0
                                        ? "You have a clean slate. Prepare for upcoming schedules or review archived items."
                                        : "Try adjusting your search query or status filter to see other tasks."}
                                </p>
                                {tasks.length > 0 && (searchQuery || statusFilter !== 'All') ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setStatusFilter('All');
                                        }}
                                        className="mt-4 px-4 min-h-[40px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                    >
                                        Reset Filters
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={scrollToUpcomingSchedule}
                                        className="mt-4 px-4 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                                    >
                                        Check Upcoming
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Mobile Touch-Optimized Task Card List (<768px) */}
                                <div className="md:hidden divide-y divide-slate-100">
                                    {filteredTasks.map((task) => {
                                        const derivedStatus = getStaffDerivedStatus(task);
                                        const priority = getTaskPriority(task);
                                        const taskId = task._id || task.id;
                                        const customerName = task.customer || task.customerName || 'Customer';
                                        const taskName = task.service || task.item || task.serviceType || 'Assigned task';
                                        const dateStr = `${task.pickupDate || task.estimatedCompletion || task.dueDate || 'TBA'} ${getPickupSlotDisplay(task.pickupSlot)}`;

                                        return (
                                            <div
                                                key={taskId}
                                                tabIndex={0}
                                                role="button"
                                                onClick={() => openTaskDetails(taskId)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        openTaskDetails(taskId);
                                                    }
                                                }}
                                                className="p-4 hover:bg-blue-50/30 focus-visible:bg-blue-50/50 focus-visible:outline-none transition-colors cursor-pointer space-y-2.5 active:bg-slate-100"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-500 font-mono">
                                                        {task.displayId || `#${String(taskId).slice(-6)}`}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {priority && priority !== 'Normal' && (
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${getPriorityColor(priority)}`}>
                                                                {priority}
                                                            </span>
                                                        )}
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(derivedStatus)}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(derivedStatus)}`} />
                                                            {derivedStatus}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                                        {taskName}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                                                        <User size={13} className="text-slate-400 shrink-0" />
                                                        <span>{customerName}</span>
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                                                    <span className="text-slate-500 font-medium">
                                                        {dateStr}
                                                    </span>
                                                    <span className="min-h-[36px] inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                                                        <span>View details</span>
                                                        <ChevronRight size={14} />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop Structured Lightweight SaaS Data Table (>=768px) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50/90 border-b border-slate-200/80">
                                            <tr>
                                                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Task / Order</th>
                                                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Schedule Time</th>
                                                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Priority</th>
                                                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                            {filteredTasks.map((task) => (
                                                (() => {
                                                    const derivedStatus = getStaffDerivedStatus(task);
                                                    const priority = getTaskPriority(task);
                                                    const taskId = task._id || task.id;
                                                    const customerName = task.customer || task.customerName || 'Customer';
                                                    const taskName = task.service || task.item || task.serviceType || 'Assigned task';

                                                    return (
                                                        <tr
                                                            key={taskId}
                                                            tabIndex={0}
                                                            role="button"
                                                            onClick={() => openTaskDetails(taskId)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    openTaskDetails(taskId);
                                                                }
                                                            }}
                                                            className="hover:bg-blue-50/30 focus-visible:bg-blue-50/50 focus-visible:outline-none transition-colors cursor-pointer"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                                                        {taskName}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                                        {task.displayId || `#${String(taskId).slice(-6)}`}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-slate-700 font-medium whitespace-nowrap">
                                                                {customerName}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap font-medium">
                                                                {task.pickupDate || task.estimatedCompletion || task.dueDate || 'TBA'} {getPickupSlotDisplay(task.pickupSlot)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${getPriorityColor(priority)}`}>
                                                                    {priority}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(derivedStatus)}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(derivedStatus)}`} />
                                                                    {derivedStatus}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        openTaskDetails(taskId);
                                                                    }}
                                                                    className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200/60 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                                                                >
                                                                    <span>View Order</span>
                                                                    <ChevronRight size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })()
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE COLUMN: Upcoming Schedule & Mobile Metric Cards */}
                <div className="space-y-4 lg:col-span-1">
                    
                    {/* SECTION 4: UPCOMING TASKS (Upcoming Schedule Timeline) */}
                    <div ref={upcomingScheduleRef} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
                        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                                    <CalendarIcon size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Upcoming Schedule</h3>
                                    <p className="text-[11px] text-slate-500 font-medium">Next operational appointments</p>
                                </div>
                            </div>
                        </div>

                        {schedules.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-8 px-5">
                                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mb-2.5 border border-slate-200/60">
                                    <CalendarX className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
                                </div>
                                <p className="text-xs font-bold text-slate-700">Schedule is clear</p>
                                <p className="text-xs text-slate-500 mt-0.5">Check back later for new events.</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2.5">
                                {upcomingSchedules.map((schedule, i) => (
                                    <div
                                        key={i}
                                        tabIndex={0}
                                        role="button"
                                        onClick={() => openTaskDetails(schedule.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                openTaskDetails(schedule.id);
                                            }
                                        }}
                                        className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none border border-slate-100 bg-white"
                                    >
                                        <div className="flex flex-col items-center justify-center min-w-[50px] px-2 py-1.5 bg-slate-100 rounded-lg border border-slate-200/60 text-center shrink-0">
                                            <span className="text-xs font-bold text-slate-900">{schedule.time}</span>
                                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{schedule.ampm}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="text-xs font-bold text-slate-900 truncate">{schedule.title}</p>
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                    schedule.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                                }`} />
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                                                {schedule.dateLabel} • {schedule.location}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: MOBILE METRIC SUMMARY (2-column Grid on Mobile <768px) */}
                    <div className="block md:hidden space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Progress Summary</h4>
                        <div className="grid grid-cols-2 gap-2.5">
                            {summaryCards.map(({ icon, label, value, sub, accent, filterStatus }, idx) => (
                                <StatCard
                                    key={idx}
                                    icon={icon}
                                    label={label}
                                    value={value}
                                    sub={sub}
                                    accentColor={accent}
                                    variant="compact"
                                    onClick={() => openOrdersPage(filterStatus)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
