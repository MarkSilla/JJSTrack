import React, { useState, useMemo } from 'react'
import HomeSidebar from '../../components/HomeSidebar'
import HomeNavbar from '../../components/HomeNavbar'
import { MdSearch, MdFilterList, MdChevronRight, MdDescription, MdTrackChanges, MdInventory, MdDesktopWindows, MdPrint, MdCheckCircle } from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { mockOrders } from '../../data/mockData'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ label, value, colorClass }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
        <p className={`text-3xl font-black ${colorClass || 'text-gray-800'}`}>{value}</p>
    </div>
)

const StepIcon = ({ step }) => {
    const done = step.done || step.active
    return (
        <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0
                ${done ? 'border-2 border-blue-500 text-blue-700' : 'bg-gray-200 text-gray-400'}`}
        >
            {(step.label === 'Dropped Off' || step.label === 'Drop Off' || step.label === 'Received') && <MdInventory size={16} />}
            {step.label === 'Layout' && <MdDesktopWindows size={16} />}
            {step.label === 'Printing' && <MdPrint size={16} />}
            {step.label === 'Sewing' && <GiSewingMachine size={16} />}
            {(step.label === 'Pick-up' || step.label === 'Ready' || step.label === 'Quality Check' || step.label === 'Ready') && <MdCheckCircle size={16} />}
        </div>
    )
}

const OrderProgressTracker = ({ steps }) => (
    <>
        <div className="hidden md:flex items-center w-full mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {steps.map((step, i) => (
                <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center min-w-[80px]">
                        <StepIcon step={step} />
                        <span className={`text-[11px] mt-1.5 whitespace-nowrap ${step.done || step.active ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                            {step.label}
                        </span>
                        {(step.date || step.time) ? (
                            <span className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                                {step.date}{step.time && `, ${step.time}`}
                            </span>
                        ) : (
                            <span className="text-[10px] text-gray-300 mt-0.5">—</span>
                        )}
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-[3px] min-w-[30px] flex-1 -mt-10 mx-1 rounded ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
        <div className="md:hidden mt-3 ml-1">
            {steps.map((step, i) => {
                const isDone = step.done || step.active
                return (
                    <div key={step.label} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <StepIcon step={step} />
                            {i < steps.length - 1 && (
                                <div className={`w-[2px] flex-1 my-1 rounded ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            )}
                        </div>
                        <div className={`flex-1 flex items-start justify-between pb-6 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
                            <div>
                                <p className={`text-sm leading-tight ${isDone ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                    {step.label}
                                </p>
                                {step.active && (
                                    <span className="text-[11px] text-blue-500 font-medium">In progress</span>
                                )}
                            </div>
                            {(step.date || step.time) ? (
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 mt-1">
                                    {step.date}{step.time && ` · ${step.time}`}
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-300 ml-2 mt-1">—</span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    </>
)

const OrderCard = ({ order }) => {
    const navigate = useNavigate()
    const handleInvoice = () => {
        //const targetId = order.invoice?.id || order.id
        navigate(`/invoices`)
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden mb-6">
            {/* Card Header */}
            <div className="p-4 sm:p-6 pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">{order.item}</h3>
                                <span className="bg-gray-100 text-gray-500 text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md tracking-widest whitespace-nowrap">
                                    {order.serviceType}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <span>Order # {order.id}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>Placed on {order.date}</span>
                            </div>
                        </div>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[9px] sm:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Estimated Completion</p>
                        <p className="text-sm sm:text-base font-black text-gray-800">{order.estimatedCompletion}</p>
                    </div>
                </div>
            </div>

            {/* Progress Area */}
            <div className="p-4 sm:p-6 py-4">
                <OrderProgressTracker steps={order.steps} />
            </div>

            {/*Footer */}
            <div className="px-4 py-4 sm:px-6 sm:py-4 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assigned Tailor:</span>
                    <span className="text-xs font-black text-gray-700">{order.assignedTailor}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleInvoice} className="text-[10px] sm:text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest px-1 sm:px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
                        View Invoice
                    </button>
                    <button className="bg-white border border-gray-200 text-[#2563EB] text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center">
                        Track Details
                    </button>
                </div>
            </div>
        </div>
    )
}

const Order = () => {
    const [collapsed, setCollapsed] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('All Orders')

    const stats = useMemo(() => {
        const inProgress = mockOrders.filter(o => o.status === 'In Progress').length
        const completed = mockOrders.filter(o => o.status === 'Completed').length
        const totalSpent = mockOrders.reduce((sum, o) => {
            const orderTotal = o.invoice?.items?.reduce((s, item) => s + (item.qty * item.unitPrice), 0) || 0
            return sum + orderTotal
        }, 0)

        return {
            total: mockOrders.length,
            inProgress,
            completed,
            spent: totalSpent.toLocaleString('en-US')
        }
    }, [])

    const filteredOrders = useMemo(() => {
        return mockOrders.filter(order => {
            const matchesSearch = order.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.id.toLowerCase().includes(searchQuery.toLowerCase())

            if (activeFilter === 'All Orders') return matchesSearch
            return matchesSearch && order.status === activeFilter
        })
    }, [searchQuery, activeFilter])

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <HomeSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-0 sm:ml-[70px]' : 'ml-0 sm:ml-[240px]'}`}>
                <HomeNavbar collapsed={collapsed} setCollapsed={setCollapsed} />

                <main className="p-4 sm:p-6 lg:p-10 w-full">
                    {/* Header Stats */}
                    <div className="grid grid-cols-1 xs:grid-cols-1 md:grid-cols-3 gap-4 mb-8 sm:mb-10">
                        <StatCard label="Total Orders" value={stats.total} />
                        <StatCard label="In Progress" value={stats.inProgress} colorClass="text-blue-600" />
                        <StatCard label="Completed" value={stats.completed} colorClass="text-emerald-500" />
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div className="relative flex-1 max-w-xl">
                            <MdSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by order # or item name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400 font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                            {['All Orders', 'In Progress', 'Completed', 'Cancelled'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer
                                        ${activeFilter === filter
                                            ? 'bg-[#0F172A] text-white shadow-lg'
                                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-transparent'}`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-6">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))
                        ) : (
                            <div className="bg-white rounded-3xl p-10 sm:p-20 text-center border-2 border-dashed border-gray-100">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No orders found</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Order
