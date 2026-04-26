import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    ClipboardList, Clock, Loader, CheckCircle, AlertTriangle, CalendarDays, MoreVertical, CheckCircle2, Inbox, CalendarX, CalendarIcon
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
    if (status === 'Completed' || status === 'Released') return 'border-emerald-400';
    if (status === 'Pending' || status === 'Approved') return 'border-amber-400';
    return 'border-blue-400';
};

const buildScheduleEntries = (bookings = []) =>
    bookings
        .filter((booking) => booking.status !== 'Cancelled' && booking.status !== 'Released')
        .map((booking) => {
            const scheduleDate = parseScheduleDate(booking.pickupDate || booking.estimatedCompletion || booking.createdAt);

            if (!scheduleDate) {
                return null;
            }

            const { time, ampm } = splitTimeLabel(booking.pickupSlot);
            const customerName = booking.contact?.fullName || booking.customer || 'Customer';
            const serviceName = booking.service || booking.item || booking.serviceType || booking.bookingType || 'Service';
            const location = booking.contact?.address || booking.serviceType || booking.bookingType || 'Assigned booking';

            return {
                id: booking._id,
                title: `${customerName} - ${serviceName}`,
                location,
                time,
                ampm,
                dateLabel: scheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                dateValue: scheduleDate.toISOString(),
                dayKey: formatDateKey(scheduleDate),
                status: booking.status,
                colorClass: getScheduleColorClass(booking.status),
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(a.dateValue) - new Date(b.dateValue));

const buildAlerts = (bookings = []) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings
        .filter((booking) => booking.status !== 'Cancelled' && booking.status !== 'Released')
        .map((booking) => {
            const scheduleDate = parseScheduleDate(booking.pickupDate || booking.estimatedCompletion);
            const customerName = booking.contact?.fullName || booking.customer || 'Customer';
            const taskName = booking.service || booking.item || booking.serviceType || booking.bookingType || 'Task';

            if (scheduleDate && scheduleDate < today && booking.status !== 'Completed') {
                return {
                    type: 'overdue',
                    title: `${customerName} is overdue`,
                    desc: `${taskName} was scheduled for ${scheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
                };
            }

            if (booking.status === 'Pending' || booking.status === 'Approved') {
                return {
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

const Dashboard = () => {
    const navigate = useNavigate();
    const outletContext = useOutletContext() || {};
    const toggleCalendar = outletContext.toggleCalendar;
    const setCalendarEntries = outletContext.setCalendarEntries;
    const [tasks, setTasks] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const upcomingScheduleRef = useRef(null);

    const fetchTasks = useCallback(async (silent = false) => {
        const updateCalendarEntries = typeof setCalendarEntries === 'function' ? setCalendarEntries : () => {};

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

    const summaryStats = {
        totalTasks: tasks.length,
        pending: tasks.filter(task => getStaffDerivedStatus(task) === 'Pending').length,
        overdue: tasks.filter(task => getStaffDerivedStatus(task) === 'Overdue').length,
        inProgress: tasks.filter(task => getStaffDerivedStatus(task) === 'In Progress').length,
        completed: tasks.filter(task => getStaffDerivedStatus(task) === 'Completed').length,
    };

    const summaryCards = [
        { label: 'Total Tasks', value: summaryStats.totalTasks, icon: ClipboardList, accent: "#3B82F6", bgAccent: "#EFF6FF", sub: '12 Applicants to process', filterStatus: 'All' },
        { label: 'Pending', value: summaryStats.pending, icon: Clock, accent: "#F59E0B", bgAccent: "#FFFBEB", sub: 'Documents pending approval', filterStatus: 'Pending' },
        { label: 'Overdue', value: summaryStats.overdue, icon: AlertTriangle, accent: "#DC2626", bgAccent: "#FEF2F2", sub: 'Tasks past due date', filterStatus: 'Overdue' },
        { label: 'In Progress', value: summaryStats.inProgress, icon: Loader, accent: "#7C3AED", bgAccent: "#F5F3FF", sub: 'Deployment tasks ongoing', filterStatus: 'In Progress' },
        { label: 'Completed', value: summaryStats.completed, icon: CheckCircle, accent: "#059669", bgAccent: "#ECFDF5", sub: 'Interviews wrapped up', filterStatus: 'Completed' },
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
            case 'High': return 'text-red-700 bg-red-50 border border-red-100';
            case 'Medium': return 'text-amber-700 bg-amber-50 border border-amber-100';
            case 'Low': return 'text-slate-500 bg-slate-50 border border-slate-200';
            default: return 'text-slate-500 bg-slate-50 border border-slate-200';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Overdue': return 'bg-red-50 text-red-700 border border-red-200';
            case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'Completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            default: return 'bg-slate-50 text-slate-600 border border-slate-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Overdue': return 'bg-red-500';
            case 'Pending': return 'bg-amber-500';
            case 'In Progress': return 'bg-blue-500';
            case 'Completed': return 'bg-emerald-500';
            default: return 'bg-slate-400';
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-2xl px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-0 opacity-60 transform translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {getGreeting()}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">
                        Here's what's happening with your tasks today.
                    </p>
                </div>
                <div className="relative z-10 flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => typeof toggleCalendar === 'function' && toggleCalendar()}
                        disabled={loading}
                        className="group flex items-center gap-2 bg-white text-blue-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-800 transition-all whitespace-nowrap border border-slate-200 hover:border-blue-200 shadow-sm cursor-pointer"
                    >
                        <CalendarDays className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        {loading ? 'Loading Schedule...' : 'View Schedule'}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {summaryCards.map(({ icon, label, value, sub, accent, filterStatus }, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => openOrdersPage(filterStatus)}
                        className="bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left border-none outline-none"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                    >
                        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
                        <div className="flex items-center gap-3 relative z-10">
                            <div 
                                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" 
                                style={{ background: accent + "18", border: `1.5px solid ${accent}30` }}
                            >
                                {React.createElement(icon, { size: 20, color: accent, strokeWidth: 2.2 })}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-gray-500 tracking-tight leading-none mb-1.5">{label}</div>
                                <div className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">{value}</div>
                                <div className="text-[10px] text-gray-400 font-bold truncate leading-none uppercase tracking-tighter opacity-80">
                                    {value === 0 ? 'No records today' : sub}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[580px]">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 text-blue-600 rounded-lg">
                                <ClipboardList size={20} />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">Today's Tasks</h3>
                        </div>
                        {tasks.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => openOrdersPage('All')}
                                className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                                View all
                            </button>
                        ) : (
                            <span className="text-xs font-medium text-slate-300 px-3 py-1.5 rounded-lg cursor-not-allowed">
                                View all
                            </span>
                        )}
                    </div>

                    {tasks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                <Inbox className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                            </div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-1">No tasks for today</h4>
                            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                You have a clean slate. Get ahead by preparing for your upcoming schedules.
                            </p>
                            <button
                                type="button"
                                onClick={scrollToUpcomingSchedule}
                                className="mt-5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                                Check Upcoming
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Name</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Time</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tasks.map((task) => (
                                        (() => {
                                            const derivedStatus = getStaffDerivedStatus(task);

                                            return (
                                                <tr
                                                    key={task._id}
                                                    onClick={() => openTaskDetails(task._id || task.id)}
                                                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-3.5">
                                                        <span className="text-sm font-medium text-slate-800 block min-w-[150px]">
                                                            {task.service || task.item || task.serviceType || 'Assigned task'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 hidden sm:table-cell text-xs text-slate-400 whitespace-nowrap font-medium">
                                                        {task.pickupDate || task.estimatedCompletion || task.dueDate || 'TBA'} {getPickupSlotDisplay(task.pickupSlot)}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getPriorityColor('Normal')}`}>
                                                            Normal
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(derivedStatus)}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(derivedStatus)}`} />
                                                            {derivedStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openTaskDetails(task._id || task.id);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors mx-auto block border border-slate-200 cursor-pointer"
                                                        >
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })()
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="space-y-4 lg:col-span-1">

                    {/* Alert */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[282px]">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5 shrink-0">
                            <div className="text-amber-600 rounded-lg">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">Alerts</h3>
                        </div>

                        {alerts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-5">
                                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <p className="text-sm font-semibold text-emerald-700">All Clear</p>
                                <p className="text-xs text-slate-400 mt-1">No warnings or overdue items.</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                                {alerts.map((alert, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${alert.type === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                                        <div className="flex justify-between items-start">
                                            <p className={`text-xs font-semibold ${alert.type === 'overdue' ? 'text-red-700' : 'text-amber-700'}`}>{alert.title}</p>
                                            {alert.type === 'overdue' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 flex-shrink-0" />}
                                        </div>
                                        <p className={`text-xs mt-1 ${alert.type === 'overdue' ? 'text-red-500' : 'text-amber-600'}`}>{alert.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Schedule */}
                    <div ref={upcomingScheduleRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[282px]">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5 shrink-0">
                            <div className="text-green-600 rounded-lg">
                                <CalendarIcon size={20} />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">Upcoming Schedule</h3>
                        </div>

                        {schedules.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-5">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
                                    <CalendarX className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
                                </div>
                                <p className="text-xs font-semibold text-slate-600">Schedule is clear</p>
                                <p className="text-xs text-slate-400 mt-1">Check back later for new events.</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                                {upcomingSchedules.map((schedule, i) => (
                                    <div
                                        key={i}
                                        onClick={() => openTaskDetails(schedule.id)}
                                        className="flex w-full gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-50 cursor-pointer border-none bg-transparent"
                                    >
                                        <div className="flex flex-col items-end min-w-[38px]">
                                            <span className="text-xs font-semibold text-slate-500">{schedule.time}</span>
                                            <span className="text-[10px] text-slate-400">{schedule.ampm}</span>
                                        </div>
                                        <div className={`flex-1 border-l-2 pl-3 ${schedule.colorClass || 'border-blue-300'}`}>
                                            <p className="text-xs font-semibold text-slate-800">{schedule.title}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{schedule.dateLabel} • {schedule.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
};

export default Dashboard;
