import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    ClipboardList, Clock, Loader, CheckCircle, AlertTriangle, CalendarDays, MoreVertical, CheckCircle2, Inbox, CalendarX, CalendarIcon
} from 'lucide-react';

const Dashboard = () => {
    const { toggleCalendar } = useOutletContext();
    const [tasks, setTasks] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [schedules, setSchedules] = useState([]);

    const summaryStats = {
        totalTasks: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
    };

    const summaryCards = [
        { label: 'Total Tasks', value: summaryStats.totalTasks, icon: ClipboardList, accent: "#3B82F6", bgAccent: "#EFF6FF", sub: '12 Applicants to process' },
        { label: 'Pending', value: summaryStats.pending, icon: Clock, accent: "#F59E0B", bgAccent: "#FFFBEB", sub: 'Documents pending approval' },
        { label: 'In Progress', value: summaryStats.inProgress, icon: Loader, accent: "#7C3AED", bgAccent: "#F5F3FF", sub: 'Deployment tasks ongoing' },
        { label: 'Completed', value: summaryStats.completed, icon: CheckCircle, accent: "#059669", bgAccent: "#ECFDF5", sub: 'Interviews wrapped up' },
    ];

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
            case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'Completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            default: return 'bg-slate-50 text-slate-600 border border-slate-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
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
                        onClick={toggleCalendar}
                        className="group flex items-center gap-2 bg-white text-blue-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-800 transition-all whitespace-nowrap border border-slate-200 hover:border-blue-200 shadow-sm cursor-pointer"
                    >
                        <CalendarDays className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        View Schedule
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map(({ icon: Icon, label, value, sub, accent }, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                    >
                        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
                        <div className="flex items-center gap-3 relative z-10">
                            <div 
                                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" 
                                style={{ background: accent + "18", border: `1.5px solid ${accent}30` }}
                            >
                                <Icon size={20} color={accent} strokeWidth={2.2} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-gray-500 tracking-tight leading-none mb-1.5">{label}</div>
                                <div className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">{value}</div>
                                <div className="text-[10px] text-gray-400 font-bold truncate leading-none uppercase tracking-tighter opacity-80">
                                    {value === 0 ? 'No records today' : sub}
                                </div>
                            </div>
                        </div>
                    </div>
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
                            <button className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
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
                            <button className="mt-5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
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
                                        <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm font-medium text-slate-800 block min-w-[150px]">{task.name}</span>
                                            </td>
                                            <td className="px-6 py-3.5 hidden sm:table-cell text-xs text-slate-400 whitespace-nowrap font-medium">
                                                {task.time}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(task.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(task.status)}`} />
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors mx-auto block border border-slate-200 cursor-pointer">
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
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
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[282px]">
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
                                {schedules.map((schedule, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex flex-col items-end min-w-[38px]">
                                            <span className="text-xs font-semibold text-slate-500">{schedule.time}</span>
                                            <span className="text-[10px] text-slate-400">{schedule.ampm}</span>
                                        </div>
                                        <div className={`flex-1 border-l-2 pl-3 ${schedule.colorClass || 'border-blue-300'}`}>
                                            <p className="text-xs font-semibold text-slate-800">{schedule.title}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{schedule.location}</p>
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