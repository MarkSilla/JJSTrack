import { useState, useMemo } from 'react';
import { MOCK_ORDERS, CURRENT_STAFF } from '../mock/mockOrders';

const STATUS_FLOW = ['Pending', 'In Progress', 'Completed'];

const getDerivedStatus = (order) => {
    if (!order) return 'Pending';
    if (order.status === 'Cancelled') return 'Cancelled';
    if (order.status === 'In Progress' || order.status === 'In-Progress') return 'In Progress';
    if (order.status === 'Completed' || order.status === 'Complete') return 'Completed';
    return 'Pending';
};

const getActiveStepIndex = (order) => {
    if (!order) return 0;
    if (order.steps && order.steps.length > 0) {
        const activeIdx = order.steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = order.steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : order.steps.length - 1;
    }
    if (order.status === 'Complete' || order.status === 'Completed') return 4;
    if (order.status === 'In Progress' || order.status === 'In-Progress') return 1;
    return 0;
};

const useOrders = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter by current staff
    const staffOrders = useMemo(() =>
        MOCK_ORDERS.filter(o => o.assignedTo === CURRENT_STAFF),
        []
    );

    const filteredOrders = useMemo(() => {
        let result = staffOrders.filter(o =>
            (o.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.item || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filterStatus !== 'All') {
            result = result.filter(o => getDerivedStatus(o) === filterStatus);
        }

        return result;
    }, [searchQuery, filterStatus, staffOrders]);

    const counts = useMemo(() => {
        const c = { All: 0, Pending: 0, 'In Progress': 0, Completed: 0 };
        staffOrders.forEach(o => {
            const s = getDerivedStatus(o);
            if (c[s] !== undefined) c[s]++;
            c.All++;
        });
        return c;
    }, [staffOrders]);

    return {
        orders: staffOrders,
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
    };
};

export default useOrders;
