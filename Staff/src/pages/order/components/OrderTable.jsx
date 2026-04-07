import React from 'react';
import OrderRow from './OrderRow';

const OrderTable = ({ orders, selectedOrderId, onOrderClick, getDerivedStatus, getActiveStepIndex }) => {
    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-gray-500">No orders found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
        );
    }

    return (
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Type</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Item</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden xl:table-cell">Current Step</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <OrderRow
                            key={order.id}
                            order={order}
                            isSelected={selectedOrderId === order.id}
                            onClick={onOrderClick}
                            getDerivedStatus={getDerivedStatus}
                            getActiveStepIndex={getActiveStepIndex}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderTable;
