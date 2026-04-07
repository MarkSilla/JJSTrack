import React, { useState } from 'react';
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, Inbox } from 'lucide-react';
import useOrders from '../hooks/useOrders';
import OrderFilters from '../components/OrderFilters';
import OrderTable from '../components/OrderTable';
import OrderCard from '../components/OrderCard';
import OrderDetails from '../components/OrderDetails';

const OrderPage = () => {
    const {
        filteredOrders,
        counts,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        isFilterOpen,
        setIsFilterOpen,
        getDerivedStatus,
        getActiveStepIndex,
    } = useOrders();

    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const handleOrderClick = (orderId) => {
        setSelectedOrderId(orderId);
    };

    const handleBack = () => {
        setSelectedOrderId(null);
    };

    // If an order is selected, show the detail view
    if (selectedOrderId) {
        return (
            <div className="min-h-[calc(100vh-80px)]">
                <OrderDetails orderId={selectedOrderId} onBack={handleBack} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <ShoppingBag size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Orders</h1>
                        <p className="text-xs text-gray-500 font-medium">Orders assigned to you</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                {[
                    { label: 'All', value: counts.All, icon: Inbox, color: '#2563EB', sub: 'Total assigned' },
                    { label: 'Pending', value: counts['Pending'] || 0, icon: Clock, color: '#D97706', sub: 'Awaiting start' },
                    { label: 'In Progress', value: counts['In Progress'] || 0, icon: AlertCircle, color: '#7C3AED', sub: 'Currently active' },
                    { label: 'Completed', value: counts['Completed'] || 0, icon: CheckCircle2, color: '#059669', sub: 'Finished orders' },
                ].map(card => (
                    <button
                        key={card.label}
                        onClick={() => setFilterStatus(card.label)}
                        className={`bg-white rounded-2xl py-3.5 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left border-none outline-none
                            ${filterStatus === card.label ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md' : ''}`}
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                    >
                        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-500" style={{ background: card.color }} />
                        <div className="flex items-center gap-3 relative z-10">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                                style={{ background: card.color + "15", border: `1.5px solid ${card.color}25` }}
                            >
                                <card.icon size={18} color={card.color} strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{card.label}</div>
                                <div className="text-xl font-black text-gray-900 tracking-tighter leading-none">{card.value}</div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <OrderFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                counts={counts}
            />

            {/* Desktop Table */}
            <OrderTable
                orders={filteredOrders}
                selectedOrderId={selectedOrderId}
                onOrderClick={handleOrderClick}
                getDerivedStatus={getDerivedStatus}
                getActiveStepIndex={getActiveStepIndex}
            />

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                        <p className="text-sm font-semibold text-gray-500">No orders found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onClick={handleOrderClick}
                            getDerivedStatus={getDerivedStatus}
                            getActiveStepIndex={getActiveStepIndex}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default OrderPage;
