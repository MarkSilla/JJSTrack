import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BookingModal from './Bookingforms'
import CalendarComponent, { toKey, MAX_SLOTS } from '../../components/calendar'
import { appointmentApi } from '../../../services/appointmentApi'
import { bookingApi } from '../../../services/bookingApi'
import { orderApi } from '../../../services/orderApi'
import { getTrackingReferenceCode } from '../../utils/trackingReference.js'
import { getTrackingDisplayName } from '../../utils/trackingDisplay.js'
import { getPickupSlotDisplay } from '../../utils/pickupSlot.js'
import { MdClose, MdCalendarToday, MdAccessTime, MdInfo, MdCheckCircle, MdPending, MdEventAvailable, MdExpandMore } from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { AppointmentListSkeleton } from '../../components/SkeletonLoaders.jsx'
import '../../styles/calendar.css'

const formatDateForUi = (dateKey) => {
    if (!dateKey) return 'N/A'
    const d = new Date(`${dateKey}T00:00:00`)
    if (Number.isNaN(d.getTime())) return dateKey
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const normalizeDateKey = (value) => {
    if (!value) return null
    if (typeof value === 'string') {
        const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (ymd) return value
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : toKey(parsed)
}

const getPickupDateKey = (entry) => normalizeDateKey(entry?.pickupDate || entry?.estimatedCompletion)

const getResponseList = (response, key) => {
    if (Array.isArray(response)) return response
    if (Array.isArray(response?.[key])) return response[key]
    if (Array.isArray(response?.data)) return response.data
    return []
}

const getDocumentId = (entry) => String(entry?._id || entry?.id || '')

const getLinkedOrderId = (booking) => {
    const linkedOrder = booking?.orderId
    if (!linkedOrder) return ''
    if (typeof linkedOrder === 'object') {
        return String(linkedOrder?._id || linkedOrder?.id || '')
    }
    return String(linkedOrder)
}

const getLinkedBookingId = (order) => {
    const linkedBooking = order?.bookingId
    if (!linkedBooking) return ''
    if (typeof linkedBooking === 'object') {
        return String(linkedBooking?._id || linkedBooking?.id || '')
    }
    return String(linkedBooking)
}

const isConvertedBooking = (booking, orderIds, orderBookingIds) => {
    const linkedOrderId = getLinkedOrderId(booking)
    const bookingId = getDocumentId(booking)
    return Boolean(
        (linkedOrderId && orderIds.has(linkedOrderId)) ||
        (bookingId && orderBookingIds.has(bookingId))
    )
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

const getRepairDisplayLabel = (booking = {}) =>
    booking.selectedOptions?.[0]?.name || booking.service || booking.repairDescription || 'Repair'

const getAppointmentDisplayName = (entry = {}, fallback = 'Booking') => {
    const displayName = getTrackingDisplayName(entry)
    return displayName && displayName !== 'Booking' ? displayName : fallback
}

const LIVE_REFRESH_MS = 5000
const CAPACITY_WARNING = 'This date has already reached its recommended capacity. Your booking request may be delayed and is subject to approval.'


const Appointment = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate || null)
    const [appointments, setAppointments] = useState([])
    const [bookings, setBookings] = useState([])
    const [slotSummaryByDate, setSlotSummaryByDate] = useState({})
    const [calendarRange, setCalendarRange] = useState(() => getDefaultCalendarRange())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showAll, setShowAll] = useState(true)
    const [showInfo, setShowInfo] = useState(false)
    const [showViewDropdown, setShowViewDropdown] = useState(false)
    const [showBooking, setShowBooking] = useState(false)
    const infoTimerRef = React.useRef(null)

    const fetchAppointmentsAndBookings = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true)
                setError(null)
            }

            const [appointmentsRes, bookingsRes, ordersRes] = await Promise.allSettled([
                appointmentApi.getAppointments(),
                bookingApi.getBookings(),
                orderApi.getOrders(),
            ])

            const appointmentsList =
                appointmentsRes.status === 'fulfilled'
                    ? (Array.isArray(appointmentsRes.value)
                        ? appointmentsRes.value
                        : appointmentsRes.value?.appointments || [])
                    : []

            const bookingsList =
                bookingsRes.status === 'fulfilled'
                    ? getResponseList(bookingsRes.value, 'bookings')
                    : []

            const ordersList =
                ordersRes.status === 'fulfilled'
                    ? getResponseList(ordersRes.value, 'orders')
                    : []

            const orderIds = new Set(ordersList.map(getDocumentId).filter(Boolean))
            const orderBookingIds = new Set(ordersList.map(getLinkedBookingId).filter(Boolean))

            const normalizedOrders = ordersList
                .map((order) => {
                    const dateKey = getPickupDateKey(order)
                    return {
                        ...order,
                        dateKey,
                        date: dateKey ? formatDateForUi(dateKey) : 'N/A',
                        time: getPickupSlotDisplay(order.pickupSlot, 'Not specified'),
                        service: getAppointmentDisplayName(order),
                        status: order.status || 'Pending',
                        source: 'order',
                    }
                })

            const normalizedBookings = bookingsList
                .filter((booking) => !isConvertedBooking(booking, orderIds, orderBookingIds))
                .map((booking) => {
                    const dateKey = getPickupDateKey(booking)
                    return {
                        ...booking,
                        dateKey,
                        date: dateKey ? formatDateForUi(dateKey) : 'N/A',
                        time: getPickupSlotDisplay(booking.pickupSlot, 'Not specified'),
                        service: getAppointmentDisplayName(
                            booking,
                            booking.bookingType === 'repair'
                                ? getRepairDisplayLabel(booking)
                                : booking.service || booking.bookingType || 'Booking'
                        ),
                        status: booking.status || 'Pending',
                        source: 'booking',
                    }
                })

            const normalizedRecords = [...normalizedOrders, ...normalizedBookings]
                .sort((a, b) => {
                    const at = new Date(a.createdAt || 0).getTime()
                    const bt = new Date(b.createdAt || 0).getTime()
                    return bt - at
                })

            setAppointments(appointmentsList)
            setBookings(normalizedRecords)

            if (!silent && appointmentsRes.status === 'rejected' && bookingsRes.status === 'rejected' && ordersRes.status === 'rejected') {
                setError('Failed to load appointments and bookings.')
            } else if (!silent && appointmentsRes.status === 'rejected') {
                setError('Some data failed to load (appointments).')
            } else if (!silent && bookingsRes.status === 'rejected' && ordersRes.status === 'rejected') {
                setError('Some data failed to load (bookings and orders).')
            }
        } catch (err) {
            console.error('Failed to fetch appointments/bookings:', err)
            if (!silent) {
                setError('Failed to load appointments')
                setAppointments([])
                setBookings([])
            }
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])

    const fetchSlotSummary = useCallback(async (range = calendarRange, silent = true) => {
        try {
            const response = await bookingApi.getSlotSummary(range.from, range.to)
            setSlotSummaryByDate(response?.slots || {})
        } catch (err) {
            console.error('Failed to fetch slot summary:', err)
            setSlotSummaryByDate({})
            if (!silent) {
                setError((prev) => prev || 'Some data failed to load (availability).')
            }
        }
    }, [calendarRange])

    useEffect(() => {
        fetchAppointmentsAndBookings(false)

        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return
            fetchAppointmentsAndBookings(true)
        }, LIVE_REFRESH_MS)

        return () => window.clearInterval(intervalId)
    }, [fetchAppointmentsAndBookings])

    useEffect(() => {
        fetchSlotSummary(calendarRange, false)
    }, [calendarRange, fetchSlotSummary])


    const appointmentsByDate = useMemo(() => {
        const map = {}
        appointments.forEach((apt) => {
            const dateKey = normalizeDateKey(apt.date)
            if (!dateKey || map[dateKey]) return
            map[dateKey] = {
                ...apt,
                date: formatDateForUi(dateKey),
                time: apt.time || 'Not specified',
                source: 'appointment',
            }
        })
        return map
    }, [appointments])

    const slotInfoByDate = useMemo(() => slotSummaryByDate || {}, [slotSummaryByDate])

    const bookingsByDate = useMemo(() => {
        const map = {}
        bookings.forEach((booking) => {
            if (!booking.dateKey) return
            if (!map[booking.dateKey]) map[booking.dateKey] = []
            map[booking.dateKey].push(booking)
        })
        return map
    }, [bookings])

    const highlightedDateSet = useMemo(() => {
        return new Set([...Object.keys(appointmentsByDate), ...Object.keys(bookingsByDate)])
    }, [appointmentsByDate, bookingsByDate])
    useEffect(() => {
        if (location.state?.selectedDate && highlightedDateSet.has(location.state.selectedDate)) {
            const entries = bookingsByDate[location.state.selectedDate] || []
            const entry = entries[0] || appointmentsByDate[location.state.selectedDate]
            if (entry) {
                navigate(location.pathname, { replace: true, state: {} })
            }
        }
    }, [location.state?.selectedDate, location.pathname, highlightedDateSet, navigate])

    const listRecords = useMemo(() => {
        const records = bookings.length > 0
            ? bookings
            : appointments.map((apt) => {
                const dateKey = normalizeDateKey(apt.date)
                return {
                    ...apt,
                    dateKey,
                    date: dateKey ? formatDateForUi(dateKey) : apt.date || 'N/A',
                    service: getAppointmentDisplayName(apt, apt.service || 'Appointment'),
                    time: apt.time || 'Not specified',
                    status: apt.status || 'Pending',
                }
            })

        if (!showAll && selectedDate) {
            return records.filter(b => b.dateKey === selectedDate)
        }
        return records
    }, [bookings, appointments, showAll, selectedDate])

    const totalBookings = listRecords.length
    const approvedBookings = listRecords.filter((b) => {
        const status = String(b.status || '').toLowerCase()
        return status === 'approved' || status === 'confirmed'
    }).length
    const pendingBookings = listRecords.filter((b) => {
        const status = String(b.status || '').toLowerCase()
        return status === 'pending'
    }).length
    const completedBookings = listRecords.filter((b) => {
        const status = String(b.status || '').toLowerCase()
        return status === 'completed' || status === 'released'
    }).length

    const handleDateClick = useCallback(
        (info) => {
            const dateStr = info.dateStr
            const slotInfo = slotInfoByDate[dateStr] || EMPTY_SLOT_INFO
            setSelectedDate(dateStr)
            setShowAll(false)
        },
        [setShowAll, slotInfoByDate]
    )

    const handleDatesSet = useCallback((viewInfo) => {
        const nextRange = buildCalendarRangeFromView(viewInfo)
        setCalendarRange((prev) => (isSameCalendarRange(prev, nextRange) ? prev : nextRange))
    }, [])

    const dayCellClassNames = useCallback(
        (arg) => {
            const key = toKey(arg.date)
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            const classes = []

            if (arg.date < now) classes.push('day-past')

            const slotInfo = slotInfoByDate[key]
            const dateStatusClass = getDateStatusClass(slotInfo?.dateStatus?.status)
            if (dateStatusClass) classes.push(dateStatusClass)
            const isNearFull = Boolean(
                slotInfo && !slotInfo.isFull && slotInfo.used >= Math.ceil(slotInfo.max * 0.7)
            )
            if (slotInfo?.isFull) classes.push('day-full')
            else if (isNearFull) classes.push('day-near-full')
            else if (slotInfo) classes.push('day-available')

            if (highlightedDateSet.has(key)) classes.push('day-user-booking')
            if (selectedDate === key) classes.push('day-selected')
            return classes
        },
        [slotInfoByDate, selectedDate, highlightedDateSet]
    )

    const dayCellContent = useCallback(
        (arg) => {
            const key = toKey(arg.date)

            const slotInfo = slotInfoByDate[key]
            const hasSlotInfo = Boolean(slotInfo)
            const used = slotInfo?.used ?? 0
            const max = slotInfo?.max ?? MAX_SLOTS
            const isFull = slotInfo?.isFull ?? false
            const dateStatus = slotInfo?.dateStatus
            const ratio = max > 0 ? used / max : 0

            const userOrders = bookingsByDate[key] || []
            const userAppointment = appointmentsByDate[key]
            const userEntryCount = userOrders.length + (userAppointment ? 1 : 0)
            const isSelected = selectedDate === key

            let fillColor = 'green'
            if (ratio >= 1) fillColor = 'red'
            else if (ratio >= 0.7) fillColor = 'orange'
            else if (ratio >= 0.5) fillColor = 'yellow'

            return (
                <div className="day-cell-inner">
                    <span className="fc-daygrid-day-number">{arg.dayNumberText}</span>
                    <div className="day-cell-spacer" />
                    {userEntryCount > 0 && !isSelected && (
                        <span className="pickup-badge">
                            {userEntryCount > 1 ? `${userEntryCount} Pickups` : 'Pickup'}
                        </span>
                    )}
                    {dateStatus && dateStatus.status && <span className={`date-status-badge ${dateStatus.status}`}>{dateStatus.label}</span>}
                    {hasSlotInfo && isFull && <span className="full-badge">Full</span>}
                    {hasSlotInfo && !isFull && used > 0 && (
                        <div className="slot-badge">
                            <div className="slot-bar">
                                <div className={`slot-bar-fill ${fillColor}`} style={{ width: `${ratio * 100}%` }} />
                            </div>
                            <span className="slot-text">{used}/{max}</span>
                        </div>
                    )}
                </div>
            )
        },
        [slotInfoByDate, selectedDate, appointmentsByDate, bookingsByDate]
    )

    const selectedSlotInfo = selectedDate ? (slotInfoByDate[selectedDate] || EMPTY_SLOT_INFO) : null
    const selUsed = selectedSlotInfo?.used ?? 0
    const selMax = selectedSlotInfo?.max ?? MAX_SLOTS
    const selRemaining = selectedSlotInfo?.remaining ?? Math.max(0, selMax - selUsed)
    const selRatio = selMax > 0 ? selUsed / selMax : 0
    const selectedDateBlocked = Boolean(selectedSlotInfo?.isDateBlocked)
    const selectedDateFull = Boolean(selectedSlotInfo?.isFull)
    const selectedDateBookable = Boolean(selectedDate && !selectedDateBlocked)
    const selectedPickupRecords = selectedDate ? (bookingsByDate[selectedDate] || []) : []

    return (
        <>
            <style>{`
                .appointment-interactive-past .calendar-wrapper .fc .fc-day-past .fc-daygrid-day-frame {
                    background-color: #f8fafc !important;
                    cursor: pointer !important;
                }
                .appointment-interactive-past .calendar-wrapper .fc .fc-day-past .fc-daygrid-day-number {
                    color: #94a3b8 !important;
                    opacity: 0.6;
                }
                .appointment-interactive-past .calendar-wrapper .fc .fc-daygrid-day-frame {
                    cursor: pointer;
                }
                .appointment-interactive-past .calendar-wrapper .fc .fc-day-past .fc-daygrid-day-frame:hover {
                    background: #f3f4f6 !important;
                    transform: none !important;
                    box-shadow: none !important;
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-available:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #ecfdf5, #dcfce7);
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-available:not(.day-selected) .fc-daygrid-day-frame:hover {
                    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-user-booking.day-available:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #ecfdf5, #dcfce7);
                    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-user-booking.day-near-full:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-user-booking.day-full:not(.day-selected) .fc-daygrid-day-frame {
                    background: linear-gradient(135deg, #fef2f2, #fee2e2);
                    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-selected .fc-daygrid-day-number,
                .appointment-interactive-past .calendar-wrapper .fc .day-selected .fc-daygrid-day-number:hover {
                    color: #ffffff !important;
                    background: transparent !important;
                    opacity: 1 !important;
                }
                .appointment-interactive-past .calendar-wrapper .fc .fc-day-past.day-selected .fc-daygrid-day-number,
                .appointment-interactive-past .calendar-wrapper .fc .fc-day-past.day-selected .fc-daygrid-day-number:hover {
                    color: #ffffff !important;
                    background: transparent !important;
                    opacity: 1 !important;
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-selected .slot-text {
                    color: #e2e8f0;
                }
                .appointment-interactive-past .calendar-wrapper .fc .day-selected .slot-bar {
                    background: rgba(255, 255, 255, 0.35);
                }
            `}</style>
            <main className={`appointment-interactive-past p-6 lg:p-8 ${selectedDate && selectedDateBookable ? 'pb-24 xl:pb-8' : ''}`}>
                <div className="hero-banner mb-8">
                    <div className="absolute -top-3 right-4 opacity-10 text-white pointer-events-none">
                        <GiSewingMachine size={140} />
                    </div>
                    <div className="absolute bottom-2 left-6 opacity-[0.07] text-white -rotate-12 pointer-events-none">
                        <MdCalendarToday size={110} />
                    </div>
                    <div className="absolute top-1/2 right-1/4 -translate-y-1/2 opacity-[0.04] text-white pointer-events-none">
                        <div className="w-44 h-44 rounded-full border-[18px] border-current" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">My Appointments</h2>
                            <p className="text-slate-300 text-sm font-medium">View availability and manage your bookings.</p>
                        </div>

                        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[390px] lg:w-auto">
                            {[
                                { label: 'Approved', value: approvedBookings, icon: MdCheckCircle, color: 'bg-emerald-400/20 text-emerald-300' },
                                { label: 'Pending', value: pendingBookings, icon: MdPending, color: 'bg-amber-400/20 text-amber-300' },
                                { label: 'Completed', value: completedBookings, icon: MdEventAvailable, color: 'bg-indigo-400/20 text-indigo-300' },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="hero-stat-card">
                                    <div className={`hero-stat-icon ${color.split(' ')[0]}`}>
                                        <Icon size={18} className={color.split(' ')[1]} />
                                    </div>
                                    <div>
                                        <p className="hero-stat-label">{label}</p>
                                        <p className="hero-stat-value">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 reveal-item stagger-1">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Calendar</h3>
                            <div className="calendar-wrapper" style={{ padding: 0, boxShadow: 'none', border: 'none' }}>
                                <CalendarComponent
                                    dateClick={handleDateClick}
                                    dayCellClassNames={dayCellClassNames}
                                    dayCellContent={dayCellContent}
                                    datesSet={handleDatesSet}
                                />
                            </div>
                            {/* Legend */}
                            <div className="mt-8 pt-5 border-t border-gray-100">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                                    {[
                                        { color: 'bg-[#3b82f6]', label: 'Selected Date' },
                                        { color: 'bg-[#dbeafe]', label: 'Pickup Date' },
                                        { color: 'bg-[#22c55e]', label: 'Available' },
                                        { color: 'bg-[#f59e0b]', label: 'Near Full' },
                                        { color: 'bg-[#ef4444]', label: 'Fully Booked' },
                                        { color: 'bg-violet-500', label: 'Holiday' },
                                        { color: 'bg-slate-500', label: 'Closed' },
                                    ].map(({ color, label }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            <span className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
                                            <span className="text-[13px] text-gray-600 font-medium tracking-tight">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 reveal-item stagger-2">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600/60 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 inline-block" />
                                Selected Date
                            </h3>
                            {selectedDate ? (
                                <div className="text-center py-3">
                                    <p className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
                                        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1 font-medium">
                                        {new Date(`${selectedDate}T00:00:00`).getFullYear()}
                                    </p>

                                    <div className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${selectedDateBlocked
                                        ? 'bg-red-50 border-red-100'
                                        : selectedDateFull
                                            ? 'bg-amber-50 border-amber-100'
                                            : 'bg-green-50 border-green-100'
                                        }`}>
                                        <MdAccessTime
                                            size={14}
                                            className={selectedDateBlocked ? 'text-red-500' : selectedDateFull ? 'text-amber-600' : 'text-green-500'}
                                        />
                                        <span className={`text-xs font-bold ${selectedDateBlocked ? 'text-red-600' : selectedDateFull ? 'text-amber-700' : 'text-green-600'}`}>
                                            {selectedDateBlocked ? 'Date unavailable' : selectedDateFull ? 'Recommended capacity reached' : `${selRemaining} slot(s) available`}
                                        </span>
                                    </div>

                                    <p className={`text-[11px] mt-4 font-medium ${selectedDateFull && !selectedDateBlocked ? 'text-amber-700' : 'text-gray-400'}`}>
                                        {selectedDateBlocked
                                            ? selectedSlotInfo?.unavailableReason || 'This date is not available.'
                                            : selectedDateFull
                                                ? selectedSlotInfo?.capacityWarning || CAPACITY_WARNING
                                                : `${selRemaining} slot(s) remaining out of ${selMax}`}
                                    </p>
                                    <div className="mt-3 mx-auto max-w-[200px]">
                                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${selRatio >= 0.8
                                                    ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                                                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
                                                    }`}
                                                style={{ width: `${Math.min(100, Math.max(0, selRatio * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                    {selectedSlotInfo && (
                                        <div className="mt-5 grid grid-cols-1 gap-2 text-left">
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Repair</p>
                                                <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                                                    {selectedSlotInfo.repairBooked}/{selectedSlotInfo.repairMax} booked
                                                </p>
                                                <p className={`text-[10px] font-semibold mt-0.5 ${selectedSlotInfo.repairIsFull ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {selectedSlotInfo.repairAvailable} slot(s) available
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Team Jersey + Organization</p>
                                                <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                                                    {selectedSlotInfo.jerseyOrgBooked}/{selectedSlotInfo.jerseyOrgMax} booked
                                                </p>
                                                <p className={`text-[10px] font-semibold mt-0.5 ${selectedSlotInfo.jerseyOrgIsFull ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {selectedSlotInfo.jerseyOrgAvailable} slot(s) available
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedPickupRecords.length > 0 && (
                                        <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                                                {selectedPickupRecords.length > 1 ? 'Pickups' : 'Pickup'}
                                            </p>
                                            {selectedPickupRecords.map((record) => (
                                                <button
                                                    key={record._id || record.orderId || record.bookingId}
                                                    type="button"
                                                    onClick={() => navigate(`/order/${record._id}`)}
                                                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-xs font-extrabold text-slate-800">
                                                            {getAppointmentDisplayName(record, record.service || 'Booking')}
                                                        </span>
                                                        <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">
                                                            {getTrackingReferenceCode(record, { includeHash: false })}
                                                        </span>
                                                        <span className="mt-0.5 block truncate text-[10px] font-semibold text-blue-500">
                                                            Pickup: {formatDateForUi(selectedDate)}{record.time ? ` | ${record.time}` : ''}
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 rounded-lg border border-blue-100 bg-white px-2.5 py-1 text-[10px] font-bold text-blue-600">
                                                        {record.status || 'Pending'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        disabled={!selectedDateBookable}
                                        onClick={() => setShowBooking(true)}
                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <MdCalendarToday size={24} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">Select a date on the calendar</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600/60 flex items-center gap-2">
                                    <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 inline-block" />
                                    {showAll ? 'Your Bookings' : 'Bookings on Selected Date'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowViewDropdown(!showViewDropdown)}
                                            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                                        >
                                            {showAll ? 'Show All' : 'Current Date'}
                                            <MdExpandMore size={14} className={`transition-transform duration-200 ${showViewDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showViewDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowViewDropdown(false)} />
                                                <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1 animate-in fade-in zoom-in-95 duration-150">
                                                    <button
                                                        onClick={() => {
                                                            setShowAll(true)
                                                            setSelectedDate(null)
                                                            setShowViewDropdown(false)
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-blue-50 transition-colors ${showAll ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600'}`}
                                                    >
                                                        Show All
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowAll(false)
                                                            if (!selectedDate) {
                                                                const today = new Date()
                                                                setSelectedDate(toKey(today))
                                                            }
                                                            setShowViewDropdown(false)
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-blue-50 transition-colors ${!showAll ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600'} cursor-pointer`}
                                                    >
                                                        Current Date
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <button
                                            onMouseEnter={() => {
                                                if (window.innerWidth > 768) setShowInfo(true)
                                            }}
                                            onMouseLeave={() => {
                                                if (window.innerWidth > 768) setShowInfo(false)
                                            }}
                                            onClick={() => {
                                                setShowInfo(!showInfo)
                                                if (infoTimerRef.current) clearTimeout(infoTimerRef.current)
                                                if (!showInfo) {
                                                    infoTimerRef.current = setTimeout(() => setShowInfo(false), 4000)
                                                }
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showInfo ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                        >
                                            <MdInfo size={18} />
                                        </button>
                                        {showInfo && (
                                            <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-white rounded-xl border border-blue-100 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                                        <MdInfo size={14} className="text-blue-500" />
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                                        Calendar slots reflect all users who booked on that date.
                                                        Highlighted cells show your pickup dates.
                                                    </p>
                                                </div>
                                                <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-t border-l border-blue-100 rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                                {loading ? (
                                    <AppointmentListSkeleton />
                                ) : error ? (
                                    <div className="text-center py-10 text-red-500 text-sm">
                                        <MdInfo size={32} className="mx-auto mb-2 opacity-20" />
                                        {error}
                                    </div>
                                ) : listRecords.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                                            <MdCalendarToday size={32} className="text-slate-200" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">No appointments yet</p>
                                        <p className="text-[11px] text-slate-300 mt-1 max-w-[180px] font-medium">
                                            {showAll ? "You haven't made any bookings." : "No bookings found for the selected date."}
                                        </p>
                                    </div>
                                ) : (
                                    listRecords.map((b) => {
                                        const statusText = String(b.status || 'Pending')
                                        const statusLower = statusText.toLowerCase()
                                        const sc =
                                            statusLower === 'approved' || statusLower === 'confirmed'
                                                ? 'bg-green-50 text-green-600 border border-green-100'
                                                : statusLower === 'completed' || statusLower === 'released'
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'

                                        return (
                                            <button
                                                key={b._id}
                                                onClick={() => navigate(`/order/${b._id}`)}
                                                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 text-left cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                                    <MdCalendarToday size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[#0f172a]">{getAppointmentDisplayName(b, b.service || 'Booking')}</p>
                                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                                        Pickup: {b.date || formatDateForUi(b.dateKey)}
                                                        {b.time ? ` | ${b.time}` : ''}
                                                        {' | '}
                                                        {getTrackingReferenceCode(b, { includeHash: false })}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold shrink-0 ${sc}`}>
                                                    {statusText}
                                                </span>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Redundant Booking Info box removed as it's now in the header */}
                    </div>
                </div>
            </main>

            {/* Sticky Mobile Bottom Booking Bar */}
            {selectedDate && selectedDateBookable && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 flex items-center justify-between shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-6 xl:hidden animate-modal-enter">
                    <div className="min-w-0 flex-1 pr-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Selected Booking Date</p>
                        <p className="text-sm font-extrabold text-slate-800 leading-tight mt-0.5">
                            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                            {selectedDateFull ? 'Recommended capacity reached' : 'Slot available'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowBooking(true)}
                        className="shrink-0 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-all duration-150"
                    >
                        Book Now
                    </button>
                </div>
            )}

            <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} initialBookingDate={selectedDate || ''} />
        </>
    )
}

export default Appointment

