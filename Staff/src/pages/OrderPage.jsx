import React, { useState } from 'react';
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, Inbox } from 'lucide-react';
import useOrders from './order/hooks/useOrders';
import OrderFilters from './order/components/OrderFilters';
import OrderTable from './order/components/OrderTable';
import OrderCard from './order/components/OrderCard';
import OrderDetails from './order/components/OrderDetails';

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
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Job Orders</h1>
                        <p className="text-xs text-gray-500 font-medium">Orders assigned to you</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                {[
                    { label: 'All', value: counts.All, icon: Inbox, color: '#3B82F6', sub: 'Total assigned' },
                    { label: 'Pending', value: counts['Pending'] || 0, icon: Clock, color: '#F59E0B', sub: 'Awaiting start' },
                    { label: 'In Progress', value: counts['In Progress'] || 0, icon: AlertCircle, color: '#7C3AED', sub: 'Currently active' },
                    { label: 'Completed', value: counts['Completed'] || 0, icon: CheckCircle2, color: '#059669', sub: 'Finished orders' },
                ].map(card => {
                    const accent = card.color;
                    const isActive = filterStatus === card.label;
                    return (
                        <button
                            key={card.label}
                            onClick={() => setFilterStatus(card.label)}
                            className={`bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left border-none outline-none ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md' : 'border border-slate-200/50'}`}
                            style={{ boxShadow: isActive ? "0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)" : "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                        >
                            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
                            <div className="flex items-center gap-3 relative z-10">
                                <div 
                                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" 
                                    style={{ background: accent + "18", border: `1.5px solid ${accent}30` }}
                                >
                                    <card.icon size={20} color={accent} strokeWidth={2.2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-semibold text-gray-500 tracking-tight leading-none mb-1.5 uppercase">{card.label}</div>
                                    <div className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">{card.value}</div>
                                    <div className="text-[10px] text-gray-400 font-bold truncate leading-none uppercase tracking-tighter opacity-80">
                                        {card.sub}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
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
