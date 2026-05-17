import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, Inbox, RefreshCw, AlertTriangle } from 'lucide-react';
import useOrders from './order/hooks/useOrders';
import OrderFilters from './order/components/OrderFilters';
import OrderTable from './order/components/OrderTable';
import OrderCard from './order/components/OrderCard';
import OrderDetails from './order/components/OrderDetails';

const KPI_CARDS = [
    { label: 'All', key: 'All', icon: Inbox, sub: 'Total assigned', color: '#3B82F6' },
    { label: 'Pending', key: 'Pending', icon: Clock, sub: 'Awaiting start', color: '#F59E0B' },
    { label: 'Overdue', key: 'Overdue', icon: AlertTriangle, sub: 'Past due date', color: '#DC2626' },
    { label: 'In Progress', key: 'In Progress', icon: AlertCircle, sub: 'Currently active', color: '#8B5CF6' },
    { label: 'Completed', key: 'Completed', icon: CheckCircle2, sub: 'Ready for release', color: '#10B981' },
    { label: 'Released', key: 'Released', icon: ShoppingBag, sub: 'Picked up by client', color: '#06B6D4' },
];

const OrderPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId: selectedOrderId } = useParams();
    const {
        filteredOrders,
        counts,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        isFilterOpen,
        setIsFilterOpen,
        sortOption,
        setSortOption,
        getDerivedStatus,
        getActiveStepIndex,
        loading,
        error,
        refetchBookings,
    } = useOrders();

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const presetFilterStatus = location.state?.dashboardPreset?.filterStatus;

        if (typeof presetFilterStatus === 'string') {
            setFilterStatus(presetFilterStatus);
        }
    }, [location.state, setFilterStatus]);

    const handleOrderClick = (orderId) => navigate(`/staff/orders/${orderId}`);
    const handleBack = () => navigate('/staff/orders');

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await refetchBookings();
        setIsRefreshing(false);
    };

    if (selectedOrderId) {
        return (
            <div className="min-h-screen w-full max-w-full min-w-0 overflow-x-hidden">
                <OrderDetails orderId={selectedOrderId} onBack={handleBack} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin p-2">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
                    <p className="text-red-700 font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="font-inter flex flex-col flex-1 min-h-screen space-y-4 p-0 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Job Orders</h1>
                    <p className="text-xs text-gray-500 font-medium">Orders assigned to you</p>
                </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
                {KPI_CARDS.map((card, idx) => {
                    const Icon = card.icon;
                    const isActive = filterStatus === card.key;
                    const accent = card.color;
                    return (
                        <button
                            key={idx}
                            onClick={() => setFilterStatus(card.key)}
                            className={`font-inter bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left border-none outline-none ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md' : 'border border-gray-200/50'}`}
                            style={{ boxShadow: isActive ? "0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)" : "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                        >
                            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: accent + "18", border: `1.5px solid ${accent}30` }}>
                                    <Icon size={20} color={accent} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-0.5">{card.label}</div>
                                    <div className="text-xl font-black text-gray-900 leading-none mb-1">{counts[card.key] ?? 0}</div>
                                    <div className="text-[10px] font-medium text-gray-400">{card.sub}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <OrderFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                counts={counts}
                sortOption={sortOption}
                setSortOption={setSortOption}
                onRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
            />

            <div className="flex-1 hidden md:block">
                <OrderTable
                    orders={filteredOrders}
                    selectedOrderId={selectedOrderId}
                    onOrderClick={handleOrderClick}
                    getDerivedStatus={getDerivedStatus}
                    getActiveStepIndex={getActiveStepIndex}
                />
            </div>

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
