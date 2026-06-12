import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingModal from './Bookingforms'
import CalendarComponent, { toKey, MAX_SLOTS } from '../../components/calendar'
import {
    MdAdd, MdShoppingBag, MdCheckCircle, MdInventory,
    MdRefresh, MdOutlineIron, MdFilterList
} from 'react-icons/md'
import {
    Inbox, Monitor, Printer, Scissors, Truck, Shirt
} from 'lucide-react'
import { bookingApi } from '../../../services/bookingApi'
import useTrackingUpdatesSocket from '../../hooks/useTrackingUpdatesSocket.js'
import { getTrackingReferenceCode } from '../../utils/trackingReference.js'
import { getTrackingDisplayName } from '../../utils/trackingDisplay.js'
import { SkeletonBlock } from '../../components/SkeletonLoaders.jsx'
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

const normalizeDateKey = (value) => {
    if (!value) return null
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : toKey(parsed)
}

const EMPTY_SLOT_INFO = {
    used: 0,
    remaining: MAX_SLOTS,
    max: MAX_SLOTS,
    isFull: false,
    repairBooked: 0,
    repairAvailable: 7,
    repairMax: 7,
    repairIsFull: false,
    jerseyOrgBooked: 0,
    jerseyOrgAvailable: 3,
    jerseyOrgMax: 3,
    jerseyOrgIsFull: false,
}

const getDateStatusClass = (status) => {
    if (status === 'full_slots') return 'day-status-full-slots'
    if (status === 'holiday') return 'day-status-holiday'
    if (status === 'closed') return 'day-status-closed'
    return ''
}

const getDefaultCalendarRange = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: toKey(start), to: toKey(end) }
}

const buildCalendarRangeFromView = (viewInfo) => {
    if (!viewInfo?.start || !viewInfo?.end) {
        return getDefaultCalendarRange()
    }

    const inclusiveEnd = new Date(viewInfo.end)
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1)

    return {
        from: toKey(viewInfo.start),
        to: toKey(inclusiveEnd),
    }
}

const isSameCalendarRange = (left, right) =>
    left?.from === right?.from && left?.to === right?.to

const TRACKING_REFRESH_DEBOUNCE_MS = 250
const ACTIVE_TRACKING_STATUSES = new Set(['pending', 'approved', 'in progress', 'in-progress'])

const normalizeTrackingStatus = (status = '') => String(status || '').trim().toLowerCase()
const isActiveTrackingStatus = (status = '') => ACTIVE_TRACKING_STATUSES.has(normalizeTrackingStatus(status))
const isPickupReadyTrackingStatus = (status = '') => normalizeTrackingStatus(status) === 'completed'
const normalizeStepLabel = (label = '') =>
    String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')

// ─── Step icons — lowercase keys to match .toLowerCase() ───
const STEP_ICON = {
    'dropped off': Inbox,
    'drop off': Inbox,
    'layout': Monitor,
    'printing': Printer,
    'pressing': MdOutlineIron,
    'cutting': Scissors,
    'sewing': Scissors,
    'pick-up': Truck,
    'pick up': Truck,
}

const StepIcon = ({ step }) => {
    const label = normalizeStepLabel(step.label)
    const isDone = step.done
    const isActive = !step.done && step.active
    const Icon = STEP_ICON[label]

    return (
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
            ${isDone ? 'bg-blue-500 text-white border-2 border-blue-500' : ''}
            ${isActive ? 'bg-white text-blue-500 border-2 border-blue-500 shadow-sm' : ''}
            ${!isDone && !isActive ? 'bg-gray-100 text-gray-300 border-2 border-gray-200' : ''}
        `}>
            {Icon && <Icon size={15} />}
        </div>
    )
}

const ProgressTracker = ({ steps }) => (
    <>
        {/* Desktop */}
        <div className="hidden md:flex items-center w-full mt-3 font-inter">
            {steps.map((step, i) => (
                <React.Fragment key={step.label + i}>
                    <div className="flex flex-col items-center min-w-[60px]">
                        <StepIcon step={step} />
                        <span className={`text-[10px] mt-1 whitespace-nowrap font-medium
                            ${step.done ? 'text-blue-600' : ''}
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
        <div className="md:hidden flex items-start w-full mt-3">
            {steps.map((step, i) => (
                <React.Fragment key={step.label + i}>
                    <div className="flex flex-col items-center flex-1">
                        <StepIcon step={step} />
                        <span className={`text-[9px] mt-1 text-center font-medium leading-tight
                            ${step.done ? 'text-blue-600' : ''}
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
        'Pending': 'bg-yellow-50 text-yellow-600',
        'Approved': 'bg-blue-50 text-blue-600',
        'In Progress': 'bg-blue-50 text-blue-600',
        'Completed': 'bg-green-50 text-green-600',
        'Released': 'bg-cyan-50 text-cyan-700',
        'Cancelled': 'bg-red-50 text-red-500',
    }
    return (
        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    )
}

export default function Dashboard() {
    const user = useUser()
    const navigate = useNavigate()
    const [showBooking, setShowBooking] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [orders, setOrders] = useState([])
    const [slotSummaryByDate, setSlotSummaryByDate] = useState({})
    const [calendarRange, setCalendarRange] = useState(() => getDefaultCalendarRange())
    const [stats, setStats] = useState({ active: 0, pickupReady: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const refreshTimeoutRef = useRef(null)
    const [activeFilter, setActiveFilter] = useState('All')
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)

    const isOverdue = (order) => {
        if (['Released', 'Cancelled'].includes(order.status)) return false
        if (!order.estimatedCompletion) return false
        const est = new Date(order.estimatedCompletion)
        if (isNaN(est.getTime())) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return est < today
    }

    const filteredOrders = useMemo(() => {
        let list = [...orders]
        if (activeFilter === 'Overdue') {
            return list.filter(isOverdue)
        }
        if (activeFilter !== 'All') {
            return list.filter(o => {
                const status = o.status?.toLowerCase().replace(/[-_]/g, ' ')
                const filter = activeFilter.toLowerCase()
                return status === filter
            })
        }
        return list
    }, [orders, activeFilter])


    const fetchData = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) {
                setLoading(true)
            }

            const [bookingsRes, statsRes, slotSummaryRes] = await Promise.allSettled([
                bookingApi.getBookings(),
                bookingApi.getBookingStats ? bookingApi.getBookingStats() : Promise.resolve({ success: false }),
                bookingApi.getSlotSummary(calendarRange.from, calendarRange.to),
            ])

            if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.success) {
                const data = bookingsRes.value.bookings || bookingsRes.value.data || []
                setOrders(data)
                // Compute stats from bookings if no stats API
                setStats({
                    active: data.filter(b => isActiveTrackingStatus(b.status)).length,
                    pickupReady: data.filter(b => isPickupReadyTrackingStatus(b.status)).length,
                    total: data.length,
                })
            }

            if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
                setStats(statsRes.value.stats || {})
            }

            if (slotSummaryRes.status === 'fulfilled' && slotSummaryRes.value?.success) {
                setSlotSummaryByDate(slotSummaryRes.value.slots || {})
            } else if (slotSummaryRes.status === 'rejected') {
                console.error('Error fetching slot summary:', slotSummaryRes.reason)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }, [calendarRange])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const scheduleSilentRefresh = useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
        }

        refreshTimeoutRef.current = window.setTimeout(() => {
            refreshTimeoutRef.current = null
            fetchData({ silent: true })
        }, TRACKING_REFRESH_DEBOUNCE_MS)
    }, [fetchData])

    useTrackingUpdatesSocket(() => {
        scheduleSilentRefresh()
    }, { enabled: Boolean(user) })

    useEffect(() => {
        if (!user) return undefined

        const handleWindowFocus = () => {
            scheduleSilentRefresh()
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                scheduleSilentRefresh()
            }
        }

        window.addEventListener('focus', handleWindowFocus)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('focus', handleWindowFocus)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [user, scheduleSilentRefresh])

    useEffect(() => () => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
        }
    }, [])

    const handleDateClick = useCallback((arg) => {
        const dateKey = arg?.dateStr || toKey(arg.date)
        const slotInfo = slotSummaryByDate[dateKey] || EMPTY_SLOT_INFO
        setSelectedDate(dateKey)
        if (!slotInfo?.isDateBlocked && !slotInfo?.isFull) {
            setShowBooking(true)
        }
    }, [slotSummaryByDate])

    const handleDatesSet = useCallback((viewInfo) => {
        const nextRange = buildCalendarRangeFromView(viewInfo)
        setCalendarRange((prev) => (isSameCalendarRange(prev, nextRange) ? prev : nextRange))
    }, [])

    const userBookingDateSet = useMemo(() => {
        return new Set(
            orders
                .map((order) => normalizeDateKey(order.bookingDateKey || order.pickupDate || order.createdAt || order.orderDate || order.date))
                .filter(Boolean)
        )
    }, [orders])

    const name = user?.fullName || 'Guest'

    const dayCellClassNames = useCallback((arg) => {
        const key = toKey(arg.date)
        const classes = []
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        if (arg.date < now) classes.push('day-past')

        const slotInfo = slotSummaryByDate[key]
        const ratio = slotInfo?.max > 0 ? slotInfo.used / slotInfo.max : 0
        const dateStatusClass = getDateStatusClass(slotInfo?.dateStatus?.status)
        if (dateStatusClass) classes.push(dateStatusClass)
        if (slotInfo?.isFull) classes.push('day-full')
        else if (slotInfo && ratio >= 0.7) classes.push('day-near-full')
        else if (slotInfo) classes.push('day-available')

        if (userBookingDateSet.has(key)) classes.push('day-user-booking')
        if (selectedDate === key) classes.push('day-selected')
        return classes
    }, [slotSummaryByDate, selectedDate, userBookingDateSet])

    const dayCellContent = useCallback((arg) => {
        const key = toKey(arg.date)

        const slotInfo = slotSummaryByDate[key] || EMPTY_SLOT_INFO
        const hasSlotInfo = Boolean(slotInfo)
        const used = slotInfo?.used ?? 0
        const max = slotInfo?.max ?? MAX_SLOTS
        const isFull = slotInfo?.isFull ?? false
        const dateStatus = slotInfo?.dateStatus
        const ratio = max > 0 ? used / max : 0

        const hasUserBooking = userBookingDateSet.has(key)
        const isSelected = selectedDate === key
        let fillColor = 'green'
        if (ratio >= 1) fillColor = 'red'
        else if (ratio >= 0.7) fillColor = 'orange'
        else if (ratio >= 0.5) fillColor = 'yellow'
        return (
            <div className="day-cell-inner">
                <span className="fc-daygrid-day-number">{arg.dayNumberText}</span>
                <div className="day-cell-spacer" />
                {hasUserBooking && !isSelected && <span className="pickup-badge">Order</span>}
                {dateStatus && dateStatus.status && <span className={`date-status-badge ${dateStatus.status}`}>{dateStatus.label}</span>}
                {hasSlotInfo && isFull && <span className="full-badge">Full</span>}
                {hasSlotInfo && !isFull && used > 0 && !isSelected && (
                    <div className="slot-badge">
                        <div className="slot-bar">
                            <div className={`slot-bar-fill ${fillColor}`} style={{ width: `${ratio * 100}%` }} />
                        </div>
                        <span className="slot-text">{used}/{max}</span>
                    </div>
                )}
            </div>
        )
    }, [slotSummaryByDate, selectedDate, userBookingDateSet])

    const selectedSlotInfo = selectedDate ? (slotSummaryByDate[selectedDate] || EMPTY_SLOT_INFO) : null
    const selectedDateBlocked = Boolean(selectedSlotInfo?.isDateBlocked)
    const selectedDateFull = Boolean(selectedSlotInfo?.isFull)
    const selectedDateBookable = Boolean(selectedDate && !selectedDateBlocked && !selectedDateFull)
    const selectedDateLabel = selectedDate
        ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : ''

    return (
        <>
            <style>{`
                .dashboard-interactive-past .calendar-wrapper .fc .fc-day-past .fc-daygrid-day-frame {
                    background-color: #f8fafc !important;
                    cursor: pointer !important;
                }
                .dashboard-interactive-past .calendar-wrapper .fc .fc-day-past .fc-daygrid-day-number {
                    color: #94a3b8 !important;
                    opacity: 0.6;
                }
                .dashboard-interactive-past .calendar-wrapper .fc .fc-daygrid-day-frame {
                    cursor: pointer;
                }
                .dashboard-interactive-past .calendar-wrapper .fc .fc-day-past .fc-daygrid-day-frame:hover {
                    background: #f3f4f6 !important;
                    transform: none !important;
                    box-shadow: none !important;
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-available:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #ecfdf5, #dcfce7);
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-available:not(.day-selected) .fc-daygrid-day-frame:hover {
                    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-user-booking.day-available:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #ecfdf5, #dcfce7);
                    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-user-booking.day-near-full:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-user-booking.day-full:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #fef2f2, #fee2e2);
                    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-selected .fc-daygrid-day-number,
                .dashboard-interactive-past .calendar-wrapper .fc .day-selected .fc-daygrid-day-number:hover {
                    color: #ffffff !important;
                    background: transparent !important;
                    opacity: 1 !important;
                }
                .dashboard-interactive-past .calendar-wrapper .fc .fc-day-past.day-selected .fc-daygrid-day-number,
                .dashboard-interactive-past .calendar-wrapper .fc .fc-day-past.day-selected .fc-daygrid-day-number:hover {
                    color: #ffffff !important;
                    background: transparent !important;
                    opacity: 1 !important;
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-selected .slot-text {
                    color: #e2e8f0;
                }
                .dashboard-interactive-past .calendar-wrapper .fc .day-selected .slot-bar {
                    background: rgba(255, 255, 255, 0.35);
                }
            `}</style>
            <main className="dashboard-interactive-past p-3 sm:p-4 md:p-6 lg:p-8">

                {/* ── Hero Banner ── */}
                <div className="bg-[#0F172A] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl relative overflow-hidden mb-6 sm:mb-8">
                    <div className="absolute -top-3 right-4 opacity-5 sm:opacity-10 text-white pointer-events-none">
                        <Shirt size={100} />
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
                                    {getGreeting()}, <span className="text-blue-300">{name}</span>
                                </h2>
                                <p className="text-slate-400 text-xs sm:text-sm">Here's what's happening with your orders.</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 bg-white/5 text-white/90 font-semibold py-2 sm:py-2.5 sm:px-5 rounded-lg text-xs sm:text-sm w-[350px] sm:w-[300px]">
                                Ready to Order? Book Now
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
                            {[
                                { label: 'My Orders', value: stats.active, sub: 'Active', icon: MdShoppingBag, bg: 'bg-blue-400/20', text: 'text-blue-300' },
                                { label: 'Pickup Ready', value: stats.pickupReady || 0, sub: 'Awaiting', icon: MdCheckCircle, bg: 'bg-green-400/20', text: 'text-green-300' },
                                { label: 'Total Orders', value: stats.total || 0, sub: 'Lifetime', icon: MdInventory, bg: 'bg-orange-400/20', text: 'text-orange-300' },
                            ].map(({ label, value, sub, icon: Icon, bg, text }) => (
                                <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex flex-col items-center sm:items-start gap-1.5 sm:gap-2 hover:bg-white/15 transition-all">
                                    {/* Mobile: icon + label on top */}
                                    <div className="flex items-center gap-1.5 sm:hidden">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${bg}`}>
                                            <Icon size={13} className={text} />
                                        </div>
                                    <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
                                    </div>
                                    {loading ? (
                                        <SkeletonBlock className="h-6 w-10 bg-white/15 sm:hidden" />
                                    ) : (
                                        <p className="text-white text-xl font-bold leading-tight sm:hidden">{value}</p>
                                    )}
                                    <div className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center shrink-0 ${bg}`}>
                                        <Icon size={18} className={text} />
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-slate-400 text-[10px] font-medium">{label}</p>
                                        {loading ? (
                                            <>
                                                <SkeletonBlock className="my-1 h-5 w-12 bg-white/15" />
                                                <SkeletonBlock className="h-2.5 w-14 bg-white/10" />
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-white text-xl font-bold leading-tight">{value}</p>
                                                <p className="text-slate-500 text-[10px]">{sub}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Calendar + Order Tracker ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 items-start">

                    {/* Calendar */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 sm:mb-4">Calendar</h3>
                            <div className="calendar-wrapper" style={{ padding: 0, boxShadow: 'none', border: 'none' }}>
                                <CalendarComponent
                                    dayCellClassNames={dayCellClassNames}
                                    dayCellContent={dayCellContent}
                                    dateClick={handleDateClick}
                                    datesSet={handleDatesSet}
                                />
                            </div>
                            {/* Legend */}
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                    {[
                                        { color: 'bg-gradient-to-r from-blue-500 to-blue-600', label: 'Selected Date' },
                                        { color: 'bg-gradient-to-r from-blue-100 to-blue-200 ring-1 ring-blue-300/40', label: 'Your Booking' },
                                        { color: 'bg-gradient-to-r from-green-400 to-green-500', label: 'Available' },
                                        { color: 'bg-gradient-to-r from-amber-300 to-orange-400', label: 'Near Full' },
                                        { color: 'bg-gradient-to-r from-red-400 to-red-500', label: 'Fully Booked' },
                                        { color: 'bg-violet-500', label: 'Holiday' },
                                        { color: 'bg-slate-500', label: 'Closed' },
                                    ].map(({ color, label }) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                                            <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedDate && (
                                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Date</p>
                                            <p className="mt-0.5 text-sm font-extrabold text-slate-800">{selectedDateLabel}</p>
                                            <p className={`mt-1 text-[11px] font-semibold ${selectedDateBookable ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {selectedDateBookable
                                                    ? `${selectedSlotInfo?.remaining ?? 0} slot(s) available`
                                                    : selectedSlotInfo?.unavailableReason || 'This date is not available.'}
                                            </p>
                                        </div>
                                        <div className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold ${selectedDateBookable ? 'text-emerald-600' : 'text-red-600'}`}>
                                            Book Now & Secure Your Slot
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Tracker */}
                    <div className="lg:col-span-3 bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Order Tracker</h3>
                            <div className="flex items-center gap-2 relative">
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-[11px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">
                                        {stats.active} Active
                                    </span>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${showFilterDropdown ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
                                        title="Filter"
                                    >
                                        <MdFilterList size={15} />
                                    </button>

                                    {showFilterDropdown && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-30"
                                                onClick={() => setShowFilterDropdown(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-40 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <p className="px-3 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Filter Status</p>
                                                {['All', 'In Progress', 'Completed', 'Released', 'Cancelled', 'Overdue'].map((f) => (
                                                    <button
                                                        key={f}
                                                        onClick={() => {
                                                            setActiveFilter(f)
                                                            setShowFilterDropdown(false)
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors flex items-center justify-between
                                                            ${activeFilter === f ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        {f}
                                                        {activeFilter === f && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
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
                        {!loading && filteredOrders.length > 0 && (
                            <div className="flex flex-col gap-3 sm:gap-4 overflow-y-auto max-h-[780px] pr-1">
                                {filteredOrders.slice(0, 5).map((order) => (
                                    <div
                                        key={order._id}
                                        onClick={() => navigate(`/order/${order._id}`)}
                                        className="border border-gray-100 rounded-xl p-3 sm:p-4 hover:border-blue-100 hover:bg-blue-50/20 transition-all cursor-pointer group"
                                    >
                                        {/* Order header */}
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                                                {getTrackingDisplayName(order)}
                                            </p>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {getTrackingReferenceCode(order)}
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
                                <Shirt size={32} className="text-gray-200 mb-3" />
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

            <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} initialBookingDate={selectedDate || ''} />
        </>
    )
}


