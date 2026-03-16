import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, PackageCheck, CheckCircle2, CalendarClock, User, Phone, MapPin, AlertCircle, ChevronDown } from 'lucide-react';

export default function ReleasedItems() {
    const [searchQuery, setSearchQuery] = useState("");
    const [releasedItems, setReleasedItems] = useState([]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('releasedItems') || '[]');
        setReleasedItems(stored);
    }, []);

    const repairOrders = useMemo(() => releasedItems.filter(o => o.serviceType === "Repair"), [releasedItems]);
    const teamOrgOrders = useMemo(() => releasedItems.filter(o => o.serviceType !== "Repair"), [releasedItems]);

    const filterData = (data) => data.filter(o =>
        o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.invoice?.billTo?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRepair = filterData(repairOrders);
    const filteredTeam = filterData(teamOrgOrders);

    return (
        <div className="font-inter min-h-screen bg-slate-50 flex flex-col p-4 lg:p-8 space-y-8 pb-24">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Released Items
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        History of all successfully released orders and details.
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search released orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {releasedItems.length === 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="bg-gray-50 p-4 rounded-full mb-4 inline-flex">
                        <PackageCheck size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Released Items Yet</h3>
                    <p className="text-gray-500 font-medium text-sm max-w-sm">
                        Orders scanned and marked as released will automatically show up here.
                    </p>
                </div>
            )}

            {releasedItems.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 lg:p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="bg-indigo-100 p-2 rounded-xl">
                            <User size={20} className="text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Team & Organization Orders</h2>
                        <span className="bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-lg text-xs ml-auto">
                            {filteredTeam.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Team Name</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Address/Phone</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Drop Date</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Release Date</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeam.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 px-6 text-center text-sm font-medium text-gray-400">No matching team/org orders found</td>
                                    </tr>
                                ) : filteredTeam.map((order, idx) => (
                                    <tr key={`team-${order.id}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-black text-gray-900 tracking-wide">{order.id}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-bold text-gray-900">{order.invoice?.teamName || "N/A"}</div>
                                            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">{order.serviceType}</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-700">
                                            {order.invoice?.billTo?.name || order.customer}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-xs font-medium text-gray-600 truncate max-w-[150px]" title={order.invoice?.billTo?.address}>
                                                {order.invoice?.billTo?.address || "N/A"}
                                            </div>
                                            <div className="text-xs font-medium text-gray-400 mt-0.5">
                                                {order.invoice?.billTo?.phone || "N/A"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-600">{order.date}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{order.releaseDate}</td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider">
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                                RELEASED
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {releasedItems.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 lg:p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="bg-orange-100 p-2 rounded-xl">
                            <MapPin size={20} className="text-orange-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Repair Orders</h2>
                        <span className="bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-lg text-xs ml-auto">
                            {filteredRepair.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Name</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Address/Phone</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Drop Date</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Release Date</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRepair.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 px-6 text-center text-sm font-medium text-gray-400">No matching repair orders found</td>
                                    </tr>
                                ) : filteredRepair.map((order, idx) => (
                                    <tr key={`repair-${order.id}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-black text-gray-900 tracking-wide">{order.id}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-bold text-gray-900">{order.customer}</div>
                                            <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-0.5">{order.item}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-xs font-medium text-gray-600 truncate max-w-[150px]" title={order.invoice?.billTo?.address}>
                                                {order.invoice?.billTo?.address || "N/A"}
                                            </div>
                                            <div className="text-xs font-medium text-gray-400 mt-0.5">
                                                {order.invoice?.billTo?.phone || "N/A"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-emerald-600">
                                            {order.invoice?.status || "Pending"}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-gray-600">{order.date}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{order.releaseDate}</td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider">
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                                RELEASED
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
