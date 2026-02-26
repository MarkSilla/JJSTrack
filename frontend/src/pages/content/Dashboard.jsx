import React, { useState, useCallback, useEffect } from 'react'
import BookingModal from './Bookingforms'
import CalendarComponent, { toKey, MAX_SLOTS, SLOT_MAP, USER_BOOKINGS } from '../../components/calendar'
import {
    MdAdd, MdShoppingBag, MdCheckCircle, MdInventory,
    MdDesktopWindows, MdPrint, MdMoveToInbox, MdLocalShipping, MdLocalPrintshop,
    MdRefresh,
} from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { bookingApi } from '../../../services/bookingApi'
import { appointmentApi } from '../../../services/appointmentApi'
import '../../styles/calendar.css'

const useUser = () => {
    const [user, setUser] = useState(null)
    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)) } catch { setUser(null) }
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

// ─── Step icons — lowercase keys to match .toLowerCase() ───
const STEP_ICON = {
    'dropped off': MdMoveToInbox,
    'layout':      MdDesktopWindows,
    'printing':    MdLocalPrintshop,
    'sewing':      GiSewingMachine,
    'pick-up':     MdLocalShipping,
}

const StepIcon = ({ step }) => {
    const label    = step.label?.toLowerCase().trim() ?? ''
    const isDone   = step.done
    const isActive = !step.done && step.active
    const Icon     = STEP_ICON[label]

    return (
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
            ${isDone   ? 'bg-blue-500 text-white border-2 border-blue-500'                 : ''}
            ${isActive ? 'bg-white text-blue-500 border-2 border-blue-500 shadow-sm'      : ''}
            ${!isDone && !isActive ? 'bg-gray-100 text-gray-300 border-2 border-gray-200' : ''}
        `}>
            {Icon && <Icon size={15} />}
        </div>
    )
}

const ProgressTracker = ({ steps }) => (
    <>
        {/* Desktop */}
        <div className="hidden md:flex items-center w-full mt-3">
            {steps.map((step, i) => (
                <React.Fragment key={step.label + i}>
                    <div className="flex flex-col items-center min-w-[60px]">
                        <StepIcon step={step} />
                        <span className={`text-[10px] mt-1 whitespace-nowrap font-medium
                            ${step.done   ? 'text-blue-600' : ''}
                            ${step.active ? 'text-blue-500' : ''}
                            ${!step.done && !step.active ? 'text-gray-400' : ''}
                        `}>
                            {step.label}
                        </span>
                        {step.active
                            ? <span className="text-[9px] text-blue-400 font-semibold">Active</span>
                            : <span className="text-[9px] text-gray-300">{step.date || '—'}</span>
                        }
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-[2px] flex-1 -mt-9 mx-1 rounded transition-all
                            ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>

        {/* Mobile — full width, no scroll */}
        <div className="md:hidden flex items-start w-full mt-3">
            {steps.map((step, i) => (
                <React.Fragment key={step.label + i}>
                    <div className="flex flex-col items-center flex-1">
                        <StepIcon step={step} />
                        <span className={`text-[9px] mt-1 text-center font-medium leading-tight
                            ${step.done   ? 'text-blue-600' : ''}
                            ${step.active ? 'text-blue-500' : ''}
                            ${!step.done && !step.active ? 'text-gray-400' : ''}
                        `}>
                            {step.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-[2px] flex-1 mt-4 mx-0.5 rounded transition-all
                            ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    </>
)

// ─── Status Badge ─────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        'Pending':     'bg-yellow-50 text-yellow-600',
        'In Progress': 'bg-blue-50 text-blue-600',
        'Completed':   'bg-green-50 text-green-600',
        'Cancelled':   'bg-red-50 text-red-500',
    }
    return (
        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    )
}

const Dashboard = () => {
    const [showBooking, setShowBooking] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [orders, setOrders] = useState([])
    const [stats, setStats] = useState({ active: 0, pickupReady: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const user = useUser()

    const fetchData = async () => {
        try {
            setLoading(true)
            const [bookingsRes, statsRes] = await Promise.all([
                bookingApi.getBookings(),
                bookingApi.getBookingStats ? bookingApi.getBookingStats() : Promise.resolve({ success: false }),
            ])
            if (bookingsRes.success) {
                const data = bookingsRes.bookings || bookingsRes.data || []
                setOrders(data)
                // Compute stats from bookings if no stats API
                setStats({
                    active:       data.filter(b => b.status === 'In Progress' || b.status === 'Pending' || b.status === 'Approved').length,
                    pickupReady:  data.filter(b => b.status === 'Completed').length,
                    total:        data.length,
                })
            }
            if (statsRes.success) setStats(statsRes.stats || {})
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

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

                {/* ── Hero Banner ── */}
                <div className="bg-[#0F172A] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl relative overflow-hidden mb-6 sm:mb-8">
                    <div className="absolute -top-3 right-4 opacity-5 sm:opacity-10 text-white pointer-events-none">
                        <GiSewingMachine size={100} />
                    </div>
                    <div className="absolute bottom-2 left-6 opacity-[0.03] sm:opacity-[0.07] text-white -rotate-12 pointer-events-none">
                        <MdInventory size={80} />
                    </div>
                    <div className="absolute top-1/2 right-1/4 -translate-y-1/2 opacity-[0.02] sm:opacity-[0.04] text-white pointer-events-none">
                        <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-[14px] sm:border-[18px] border-current" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <div>
                                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1">
                                    {getGreeting()}, <span className="text-blue-300">{name}</span> 👋
                                </h2>
                                <p className="text-slate-400 text-xs sm:text-sm">Here's what's happening with your orders.</p>
                            </div>
                            <button
                                onClick={() => setShowBooking(true)}
                                className="flex items-center justify-center sm:justify-start gap-2 bg-white text-[#0F172A] hover:bg-blue-50 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer shadow-lg w-full sm:w-fit"
                            >
                                Book Now <MdAdd size={16} />
                            </button>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
                            {[
                                { label: 'My Orders',     value: stats.active || orders.length, sub: 'Active',   icon: MdShoppingBag,  bg: 'bg-blue-400/20',   text: 'text-blue-300'   },
                                { label: 'Pickup Ready',  value: stats.pickupReady || 0,         sub: 'Awaiting', icon: MdCheckCircle,  bg: 'bg-green-400/20',  text: 'text-green-300'  },
                                { label: 'Total Orders',  value: stats.total || 0,               sub: 'Lifetime', icon: MdInventory,    bg: 'bg-orange-400/20', text: 'text-orange-300' },
                            ].map(({ label, value, sub, icon: Icon, bg, text }) => (
                                <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex flex-col items-center sm:items-start gap-1.5 sm:gap-2 hover:bg-white/15 transition-all">
                                    {/* Mobile: icon + label on top */}
                                    <div className="flex items-center gap-1.5 sm:hidden">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${bg}`}>
                                            <Icon size={13} className={text} />
                                        </div>
                                        <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
                                    </div>
                                    <p className="text-white text-xl font-bold leading-tight sm:hidden">{value}</p>
                                    {/* Desktop: original layout */}
                                    <div className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center shrink-0 ${bg}`}>
                                        <Icon size={18} className={text} />
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-slate-400 text-[10px] font-medium">{label}</p>
                                        <p className="text-white text-xl font-bold leading-tight">{value}</p>
                                        <p className="text-slate-500 text-[10px]">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Calendar + Order Tracker ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

                    {/* Calendar */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 sm:mb-4">Calendar</h3>
                            <div className="calendar-wrapper" style={{ padding: 0, boxShadow: 'none', border: 'none' }}>
                                <CalendarComponent
                                    dayCellClassNames={dayCellClassNames}
                                    dayCellContent={dayCellContent}
                                    dateClick={(arg) => setSelectedDate(toKey(arg.date))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Tracker */}
                    <div className="lg:col-span-3 bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Order Tracker</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">
                                    {orders.length} Active
                                </span>
                                <button
                                    onClick={fetchData}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                                    title="Refresh"
                                >
                                    <MdRefresh size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex flex-col gap-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                                        <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
                                        <div className="h-2.5 w-48 bg-gray-100 rounded mb-4" />
                                        <div className="flex gap-3">
                                            {[...Array(5)].map((_, j) => (
                                                <div key={j} className="flex flex-col items-center gap-1.5 flex-1">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                                                    <div className="h-2 w-10 bg-gray-100 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Orders */}
                        {!loading && orders.length > 0 && (
                            <div className="flex flex-col gap-3 sm:gap-4 overflow-y-auto max-h-[500px] pr-1">
                                {orders.map((order) => (
                                    <div key={order._id} className="border border-gray-100 rounded-xl p-3 sm:p-4 hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                                        {/* Order header */}
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                                                {order.service || order.item || order.itemName || order.bookingType || 'Booking'}
                                            </p>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                #{order.orderId || order._id?.slice(-8)}
                                            </span>
                                            {order.assignedTailor && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span className="text-[10px] text-gray-400">{order.assignedTailor}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Progress Steps */}
                                        {order.steps && order.steps.length > 0
                                            ? <ProgressTracker steps={order.steps} />
                                            : (
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                                    No steps available
                                                </div>
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && orders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <GiSewingMachine size={32} className="text-gray-200 mb-3" />
                                <p className="text-gray-400 font-semibold text-sm">No active orders</p>
                                <p className="text-gray-300 text-xs mt-1">Book a service to get started</p>
                                <button
                                    onClick={() => setShowBooking(true)}
                                    className="mt-4 flex items-center gap-1.5 bg-[#0F172A] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                                >
                                    <MdAdd size={14} /> Book Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} />
        </>
    )
}

export default Dashboard