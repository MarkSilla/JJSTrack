import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, Inbox, RefreshCw, AlertTriangle } from 'lucide-react';
import useOrders from './order/hooks/useOrders';
import OrderFilters from './order/components/OrderFilters';
import OrderTable from './order/components/OrderTable';
import OrderCard from './order/components/OrderCard';
import OrderDetails from './order/components/OrderDetails';
import { StatCardsSkeleton, TableSkeleton } from '../../components/SkeletonLoaders.jsx';
import { StatCard } from '../../components/ui';

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
            <div className="font-inter flex min-h-screen w-full flex-col space-y-4">
                <div>
                    <div className="mb-2 h-7 w-40 animate-pulse rounded-lg bg-slate-200/80" />
                    <div className="h-3 w-48 animate-pulse rounded-lg bg-slate-100" />
                </div>
                <StatCardsSkeleton count={6} className="grid grid-cols-2 xl:grid-cols-6 gap-4" />
                <TableSkeleton rows={7} columns={7} />
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

            <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
                {KPI_CARDS.map((card, idx) => (
                    <StatCard
                        key={idx}
                        icon={card.icon}
                        label={card.label}
                        value={counts[card.key] ?? 0}
                        sub={card.sub}
                        accentColor={card.color}
                        isActive={filterStatus === card.key}
                        onClick={() => setFilterStatus(card.key)}
                    />
                ))}
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
