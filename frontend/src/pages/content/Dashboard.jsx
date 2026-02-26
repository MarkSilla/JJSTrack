import React, { useState, useCallback, useEffect } from 'react'
import BookingModal from './Bookingforms'
import CalendarComponent, { toKey, MAX_SLOTS, SLOT_MAP, USER_BOOKINGS } from '../../components/calendar'
import { MdAdd, MdShoppingBag, MdCheckCircle, MdInventory, MdDesktopWindows, MdPrint, MdRefresh } from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { orderApi } from '../../../services/orderApi'
import { appointmentApi } from '../../../services/appointmentApi'
import '../../styles/calendar.css'

// Auth context hook - gets user from localStorage
const useUser = () => {
    const [user, setUser] = useState(null)
    
    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser)
                setUser(parsedUser)
            } catch (e) {
                setUser(null)
            }
        }
    }, [])
    
    return user
}

const getGreeting = () => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'Good morning'
    if (h >= 12 && h < 18) return 'Good afternoon'
    return 'Good evening'
}

const StepIcon = ({ step }) => {
    const done = step.done || step.active
    return (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
            ${done ? 'border-2 border-blue-500 text-blue-700' : 'bg-gray-200 text-gray-400'}`}>
            {(step.label === 'Dropped Off' || step.label === 'Drop Off') && <MdInventory size={16} />}
            {step.label === 'Layout' && <MdDesktopWindows size={16} />}
            {step.label === 'Printing' && <MdPrint size={16} />}
            {step.label === 'Sewing' && <GiSewingMachine size={16} />}
            {step.label === 'Pick-up' && <MdCheckCircle size={16} />}
        </div>
    )
}

const ProgressTracker = ({ steps }) => (
    <>
        <div className="hidden md:flex items-center w-full mt-3">
            {steps.map((step, i) => (
                <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center min-w-10">
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
                        <div className={`h-[3px] w-full flex-1 -mt-10 mx-1 rounded ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
        <div className="md:hidden mt-3 ml-1">
            {steps.map((step, i) => {
                const isDone = step.done || step.active
                return (
                    <div key={step.label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <StepIcon step={step} />
                            {i < steps.length - 1 && (
                                <div className={`w-[3px] flex-1 my-1 rounded ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            )}
                        </div>
                        <div className={`flex-1 flex items-start justify-between pb-4 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
                            <div>
                                <p className={`text-sm leading-tight ${isDone ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                    {step.label}
                                </p>
                                {step.active && (
                                    <span className="text-[11px] text-blue-500 font-medium">In progress</span>
                                )}
                            </div>
                            {(step.date || step.time) ? (
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 mt-0.5">
                                    {step.date}{step.time && ` · ${step.time}`}
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-300 ml-2 mt-0.5">—</span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    </>
)

const Dashboard = () => {
    const [showBooking, setShowBooking] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [orders, setOrders] = useState([])
    const [stats, setStats] = useState({ active: 0, pickupReady: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const user = useUser()

    // Fetch orders and stats from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                // Fetch orders
                const ordersResponse = await orderApi.getOrders({ status: 'In Progress' })
                if (ordersResponse.success) {
                    setOrders(ordersResponse.orders || [])
                }
                
                // Fetch stats
                const statsResponse = await orderApi.getOrderStats()
                if (statsResponse.success) {
                    setStats(statsResponse.stats || { active: 0, pickupReady: 0, total: 0 })
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        
        fetchData()
    }, [])

    const name = user?.fullName || 'Guest'

    const dayCellClassNames = useCallback((arg) => {
        const key = toKey(arg.date)
        const now = new Date(); now.setHours(0, 0, 0, 0)
        const classes = []
        if (arg.date < now) return classes
        const used = SLOT_MAP[key] || 0
        const isFull = used >= MAX_SLOTS
        const isNearFull = used >= 7
        if (isFull) classes.push('day-full')
        else if (isNearFull) classes.push('day-near-full')
        if (USER_BOOKINGS.some((b) => b.date === key)) classes.push('day-user-booking')
        if (selectedDate === key) classes.push('day-selected')
        return classes
    }, [selectedDate])

    const dayCellContent = useCallback((arg) => {
        const key = toKey(arg.date)
        const now = new Date(); now.setHours(0, 0, 0, 0)
        const isPast = arg.date < now
        const used = SLOT_MAP[key] || 0
        const isFull = used >= MAX_SLOTS
        const ratio = used / MAX_SLOTS
        const ub = USER_BOOKINGS.find((b) => b.date === key)
        const isSelected = selectedDate === key

        let fillColor = 'green'
        if (ratio >= 1) fillColor = 'red'
        else if (used >= 7) fillColor = 'orange'
        else if (ratio >= 0.5) fillColor = 'yellow'

        return (
            <div className="day-cell-inner">
                <span className="fc-daygrid-day-number">{arg.dayNumberText}</span>
                <div className="day-cell-spacer" />
                {ub && !isSelected && <span className="pickup-badge">Pickup</span>}
                {isFull && !isPast && <span className="full-badge">Full</span>}
                {!isPast && !isFull && used > 0 && !isSelected && (
                    <div className="slot-badge">
                        <div className="slot-bar">
                            <div className={`slot-bar-fill ${fillColor}`} style={{ width: `${ratio * 100}%` }} />
                        </div>
                        <span className="slot-text">{used}/{MAX_SLOTS}</span>
                    </div>
                )}
            </div>
        )
    }, [selectedDate])

    return (
        <>
            <main className="p-3 sm:p-4 md:p-6 lg:p-8">

                {/* ── Hero Banner with Stats inside ── */}
                <div className="bg-[#0F172A] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl relative overflow-hidden mb-6 sm:mb-8">

                    {/* Tailoring bg elements */}
                    <div className="absolute -top-3 right-4 opacity-5 sm:opacity-10 text-white pointer-events-none">
                        <GiSewingMachine size={100} className="sm:w-32 sm:h-32" />
                    </div>
                    <div className="absolute bottom-2 left-6 opacity-[0.03] sm:opacity-[0.07] text-white -rotate-12 pointer-events-none">
                        <MdInventory size={80} className="sm:w-28 sm:h-28" />
                    </div>
                    <div className="absolute top-3 left-1/2 opacity-[0.02] sm:opacity-[0.04] text-white rotate-6 pointer-events-none">
                        <MdPrint size={70} className="sm:w-24 sm:h-24" />
                    </div>
                    <div className="absolute top-1/2 right-1/4 -translate-y-1/2 opacity-[0.02] sm:opacity-[0.04] text-white pointer-events-none">
                        <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-[14px] sm:border-[18px] border-current" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">

                        {/* Left — Greeting + Book Now */}
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <div>
                                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1">
                                    {getGreeting()}, <span className="text-blue-300 truncate">{name}</span> 👋
                                </h2>
                                <p className="text-slate-400 text-xs sm:text-sm">Here's what's happening with your orders.</p>
                            </div>
                            <button
                                onClick={() => setShowBooking(true)}
                                className="flex items-center justify-center sm:justify-start gap-2 bg-white text-[#0F172A] hover:bg-blue-50 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer shadow-lg w-full sm:w-fit"
                            >
                                Book Now <MdAdd size={16} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {/* Right — Stat Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto lg:flex lg:gap-3">

                            {/* My Order */}
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-col items-center sm:items-start gap-2 sm:gap-3 hover:bg-white/15 transition-all">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-400/20 flex items-center justify-center shrink-0">
                                    <MdShoppingBag size={16} className="sm:w-5 sm:h-5 text-blue-300" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-medium">My Orders</p>
                                    <p className="text-white text-base sm:text-xl font-bold leading-tight">2</p>
                                    <p className="text-slate-500 text-[9px] sm:text-[10px]">Active</p>
                                </div>
                            </div>

                            {/* Pickup Ready */}
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-col items-center sm:items-start gap-2 sm:gap-3 hover:bg-white/15 transition-all">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-400/20 flex items-center justify-center shrink-0">
                                    <MdCheckCircle size={16} className="sm:w-5 sm:h-5 text-green-300" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-medium">Pickup Ready</p>
                                    <p className="text-white text-base sm:text-xl font-bold leading-tight">1</p>
                                    <p className="text-slate-500 text-[9px] sm:text-[10px]">Awaiting</p>
                                </div>
                            </div>

                            {/* Total Orders */}
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-col items-center sm:items-start gap-2 sm:gap-3 hover:bg-white/15 transition-all col-span-2 sm:col-span-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-400/20 flex items-center justify-center shrink-0">
                                    <MdInventory size={16} className="sm:w-5 sm:h-5 text-orange-300" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-medium">Total Orders</p>
                                    <p className="text-white text-base sm:text-xl font-bold leading-tight">8</p>
                                    <p className="text-slate-500 text-[9px] sm:text-[10px]">Lifetime</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Calendar + Order Tracker */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 sm:mb-4">Calendar</h3>
                            <div className="calendar-wrapper" style={{ padding: '0', boxShadow: 'none', border: 'none' }}>
                                <CalendarComponent
                                    dayCellClassNames={dayCellClassNames}
                                    dayCellContent={dayCellContent}
                                    dateClick={(arg) => setSelectedDate(toKey(arg.date))}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-3 bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-5">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Order Tracker</h3>
                            <span className="text-[11px] sm:text-xs bg-green-100 text-green-600 px-2 sm:px-3 py-1 rounded-full font-medium whitespace-nowrap">
                                {orders.length} Active Orders
                            </span>
                        </div>
                        <div className="flex flex-col gap-3 sm:gap-6">
                            {orders.map((order) => (
                                <div key={order._id} className="border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 gap-1 sm:gap-0">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-800">{order.itemName || 'Order'}</p>
                                        <span className="text-[10px] sm:text-[11px] text-gray-400 font-mono">{order._id?.slice(-6)}</span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-gray-400 mb-2 sm:mb-2">{order.customerName || 'Customer'} · Status: {order.status || 'Pending'}</p>
                                </div>
                            ))}
                            {orders.length === 0 && (
                                <div className="text-center text-gray-400 text-sm py-8">
                                    <p>No active orders yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} />
        </>
    )
}

export default Dashboard