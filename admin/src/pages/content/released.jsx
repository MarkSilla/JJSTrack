import React, { useState, useMemo, useEffect } from 'react';
import { Search, Package, CheckCircle2, RefreshCw, Loader, Users, Wrench, Shirt } from 'lucide-react';
import { orderApi } from '../../services/orderApi';
import { bookingApi } from '../../services/bookingApi';

export default function ReleasedItems() {
    const [searchQuery, setSearchQuery] = useState("");
    const [releasedItems, setReleasedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchReleasedItems();
        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            fetchReleasedItems();
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchReleasedItems = async () => {
        try {
            const bookingsRes = await bookingApi.getAllBookings();

            // Handle different response formats - API returns {success, bookings: []}
            const bookingsData = bookingsRes?.bookings || bookingsRes?.data || bookingsRes || [];
            const releasedBookings = (Array.isArray(bookingsData) ? bookingsData : [])
                .filter(b => b.status === 'Released')
                .map(b => {
                    // Extract service type from various possible fields
                    const serviceType = b.serviceType || b.service || b.bookingType || b.eventType || 'booking';
                    
                    const item = {
                        ...b,
                        type: serviceType,
                        displayId: b._id,
                        customerName: b.contact?.fullName || b.guestName || 'N/A',
                        address: b.contact?.address || b.location || 'N/A',
                        phone: b.contact?.phone || b.phoneNumber || 'N/A',
                        releaseDate: b.pickedUpAt ? new Date(b.pickedUpAt).toLocaleDateString() : 'N/A',
                        dropDate: new Date(b.createdAt).toLocaleDateString()
                    };
                    return item;
                });

            setReleasedItems(releasedBookings);
        } catch (err) {
            // Silently fail
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchReleasedItems();
        setIsRefreshing(false);
    };

    const filteredItems = useMemo(() => {
        return releasedItems.filter(item =>
            item.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.item?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [releasedItems, searchQuery]);

    return (
        <div className="font-inter min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 flex flex-col p-4 lg:p-8 space-y-6 pb-24">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sticky top-0 z-10 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-white" />
                        </div>
                        Released Items
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        All successfully scanned and released orders
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, name, or item..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white font-bold rounded-xl transition-all cursor-pointer border-none shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        title="Refresh list"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {releasedItems.length === 0 && !isRefreshing && (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="bg-emerald-50 p-5 rounded-full mb-5 inline-flex">
                        <Package size={40} className="text-emerald-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Released Bookings Yet</h3>
                    <p className="text-gray-500 font-medium text-sm max-w-sm">
                        Bookings will appear here once they are scanned and marked as released through the QR scanner. Auto-refreshes every 5 seconds.
                    </p>
                </div>
            )}

            {/* Released Items Table */}
            {releasedItems.length > 0 && (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Released Bookings</h2>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Showing {filteredItems.length} booking{filteredItems.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <span className="bg-emerald-200 text-emerald-700 font-bold px-3 py-1 rounded-lg text-xs">
                            {releasedItems.length} total
                        </span>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="py-12 px-6 text-center">
                            <p className="text-sm font-medium text-gray-400">No items match your search</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Drop Date</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Release Date</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((item, idx) => (
                                        <tr 
                                            key={`${item.type}-${item.displayId}-${idx}`} 
                                            className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <span className="text-xs font-bold text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {item.displayId?.slice(-6)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm font-bold text-gray-900">{item.customerName}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs text-gray-600 truncate max-w-[180px]" title={item.address}>
                                                    {item.address || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs font-medium text-gray-600">
                                                    {item.phone || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm font-semibold text-gray-600">
                                                {item.dropDate}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm font-bold text-emerald-700">{item.releaseDate}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {item.type?.toLowerCase() === 'jersey' && (
                                                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
                                                        <Shirt size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Jersey</span>
                                                    </div>
                                                )}
                                                {item.type?.toLowerCase() === 'organizational' && (
                                                    <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg">
                                                        <Users size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Organizational</span>
                                                    </div>
                                                )}
                                                {item.type?.toLowerCase() === 'repair' && (
                                                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg">
                                                        <Wrench size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Repair</span>
                                                    </div>
                                                )}
                                                {!['jersey', 'organizational', 'repair'].includes(item.type?.toLowerCase()) && (
                                                    <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                                                        <Package size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">{item.type || 'Unknown'}</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
