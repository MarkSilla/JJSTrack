import React, { useState, useMemo, useEffect } from 'react'
import { MdSearch, MdInventory, MdDesktopWindows, MdPrint, MdCheckCircle, MdShoppingBag, MdLoop, MdDoneAll } from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { orderApi } from '../../../services/orderApi'
import { bookingApi } from '../../../services/bookingApi'
import { useNavigate } from 'react-router-dom'

// 👇 Replace with your actual auth context
const useUser = () => ({ name: 'Juan' })

const getGreeting = () => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'Good morning'
    if (h >= 12 && h < 18) return 'Good afternoon'
    return 'Good evening'
}

const StepIcon = ({ step }) => {
    const done = step.done || step.active
    return (
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0
            ${done ? 'border-2 border-blue-500 text-blue-700' : 'bg-gray-200 text-gray-400'}`}>
            {(step.label === 'Dropped Off' || step.label === 'Drop Off' || step.label === 'Received') && <MdInventory size={16} />}
            {step.label === 'Layout' && <MdDesktopWindows size={16} />}
            {step.label === 'Printing' && <MdPrint size={16} />}
            {step.label === 'Sewing' && <GiSewingMachine size={16} />}
            {(step.label === 'Pick-up' || step.label === 'Ready' || step.label === 'Quality Check') && <MdCheckCircle size={16} />}
        </div>
    )
}

const OrderProgressTracker = ({ steps }) => (
    <>
        <div className="hidden md:flex items-center w-full mt-3 overflow-x-auto pb-2">
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
                                <p className={`text-sm leading-tight ${isDone ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{step.label}</p>
                                {step.active && <span className="text-[11px] text-blue-500 font-medium">In progress</span>}
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
    
    // Determine if this is a booking or order
    const isBooking = !order.amount && order.bookingType
    const displayName = isBooking 
        ? `${order.bookingType?.charAt(0).toUpperCase() + order.bookingType?.slice(1)} Request`
        : order.itemName || order.item
    const displayCustomer = isBooking ? order.contact?.fullName : order.customerName
    const displayStatus = order.status
    
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-4 sm:p-6 pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">{displayName}</h3>
                                <span className="bg-gray-100 text-gray-500 text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md tracking-widest whitespace-nowrap">
                                    {isBooking ? 'Booking' : 'Order'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <span>{isBooking ? 'Booking' : 'Order'} # {order._id?.slice(-8) || order.id}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>Created {isBooking ? 'on ' + new Date(order.createdAt).toLocaleDateString() : 'on ' + (order.date || 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[9px] sm:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-sm sm:text-base font-black text-gray-800">{displayStatus}</p>
                    </div>
                </div>
            </div>
            
            {isBooking ? (
                // Booking details
                <div className="p-4 sm:p-6 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Name</p>
                            <p className="text-sm font-bold text-gray-800">{displayCustomer}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Service Type</p>
                            <p className="text-sm font-bold text-gray-800">{order.service || order.bookingType}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                            <p className="text-sm font-bold text-gray-800">{order.contact?.phone || order.contact?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup Date</p>
                            <p className="text-sm font-bold text-gray-800">{order.pickupDate ? `Day ${order.pickupDate}` : 'Not scheduled'}</p>
                        </div>
                    </div>
                </div>
            ) : (
                // Order details
                <>
                    <div className="p-4 sm:p-6 py-4">
                        <OrderProgressTracker steps={order.steps} />
                    </div>
                    <div className="px-4 py-4 sm:px-6 sm:py-4 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assigned Tailor:</span>
                            <span className="text-xs font-black text-gray-700">{order.assignedTailor}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/invoices')} className="text-[10px] sm:text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest px-1 sm:px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
                                View Invoice
                            </button>
                            <button className="bg-white border border-gray-200 text-[#2563EB] text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center">
                                Track Details
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

const Order = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('All Orders')
    const [allOrders, setAllOrders] = useState([])
    const [allBookings, setAllBookings] = useState([])
    const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0, spent: '0' })
    const [filteredOrders, setFilteredOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const { name } = useUser()

    // Fetch orders and bookings from API
    useEffect(() => {
        const fetchOrdersAndBookings = async () => {
            try {
                setLoading(true)
                
                // Fetch orders
                const orderResponse = await orderApi.getOrders()
                const orders = orderResponse.success ? (orderResponse.orders || []) : []
                setAllOrders(orders)
                
                // Fetch bookings
                let bookings = []
                try {
                    const bookingResponse = await bookingApi.getBookings()
                    bookings = bookingResponse.success ? (bookingResponse.bookings || []) : []
                } catch (err) {
                    console.error('Error fetching bookings:', err)
                }
                setAllBookings(bookings)
                
                // Combine orders and bookings for stats
                const combined = [...orders, ...bookings]
                const inProgress = combined.filter(o => o.status === 'In Progress' || o.status === 'Pending').length || 0
                const completed = combined.filter(o => o.status === 'Completed').length || 0
                const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0) || 0
                
                setStats({
                    total: combined.length || 0,
                    inProgress,
                    completed,
                    spent: totalSpent.toLocaleString('en-US')
                })
            } catch (error) {
                console.error('Error fetching orders and bookings:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchOrdersAndBookings()
    }, [])

    // Filter orders and bookings based on search and filter
    useEffect(() => {
        let combined = [...allOrders, ...allBookings]
        
        if (activeFilter !== 'All Orders') {
            const status = activeFilter.replace(' Orders', '')
            combined = combined.filter(item => {
                // For orders
                if (item.amount !== undefined) return item.status === status
                // For bookings
                return item.status === status || (status === 'Pending' && item.status === 'Pending')
            })
        }
        
        if (searchQuery) {
            combined = combined.filter(item => {
                // For orders
                if (item.amount !== undefined) {
                    return item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item._id?.includes(searchQuery)
                }
                // For bookings
                return item.contact?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item._id?.includes(searchQuery)
            })
        }
        
        setFilteredOrders(combined)
    }, [searchQuery, activeFilter, allOrders, allBookings])

    return (
        <main className="p-4 sm:p-6 lg:p-10 w-full">

            {/* ── Hero Banner ── */}
            <div className="bg-[#0F172A] rounded-2xl p-6 shadow-2xl relative overflow-hidden mb-8">
                {/* Tailoring bg elements */}
                <div className="absolute -top-3 right-4 opacity-10 text-white pointer-events-none">
                    <GiSewingMachine size={140} />
                </div>
                <div className="absolute bottom-2 left-6 opacity-[0.07] text-white -rotate-12 pointer-events-none">
                    <MdPrint size={110} />
                </div>
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 opacity-[0.04] text-white pointer-events-none">
                    <div className="w-44 h-44 rounded-full border-[18px] border-current" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Left */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                            My Orders & Bookings
                        </h2>
                        <p className="text-slate-400 text-sm">Track and manage all your tailoring orders and service bookings.</p>
                    </div>

                    {/* Right — Stats */}
                    <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
                        {[
                            { label: 'Total Items', value: stats.total, sub: 'All time', icon: MdShoppingBag, color: 'bg-blue-400/20 text-blue-300' },
                            { label: 'In Progress', value: stats.inProgress, sub: 'Active', icon: MdLoop, color: 'bg-amber-400/20 text-amber-300' },
                            { label: 'Completed', value: stats.completed, sub: 'Done', icon: MdDoneAll, color: 'bg-green-400/20 text-green-300' },
                        ].map(({ label, value, sub, icon: Icon, color }) => (
                            <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/15 transition-all">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                                    <Icon size={20} className={color.split(' ')[1]} />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-medium">{label}</p>
                                    <p className="text-white text-xl font-bold leading-tight">{value}</p>
                                    <p className="text-slate-500 text-[10px]">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
                <div className="flex items-center gap-2 overflow-x-auto pb-4 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                    filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div className="bg-white rounded-3xl p-10 sm:p-20 text-center border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No orders found</p>
                    </div>
                )}
            </div>
        </main>
    )
}

export default Order