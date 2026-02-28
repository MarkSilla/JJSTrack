import React, { useState, useCallback } from 'react'
import CalendarComponent, { toKey, MAX_SLOTS, SLOT_MAP, USER_BOOKINGS } from '../../components/calendar'
import { MdClose, MdCalendarToday, MdAccessTime, MdInfo, MdCheckCircle, MdPending, MdEventAvailable, MdAdd } from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import '../../styles/calendar.css'

const getGreeting = () => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'Good morning'
    if (h >= 12 && h < 18) return 'Good afternoon'
    return 'Good evening'
}

// 👇 Replace with your actual auth context
const useUser = () => ({ name: 'Juan' })

const BookingModal = ({ booking, onClose }) => {
    if (!booking) return null
    const sc = booking.status === 'Approved' ? 'bg-green-100 text-green-700' : booking.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <MdClose size={20} />
                </button>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <MdCalendarToday size={20} />
                    </div>
                </div>
                <div className="space-y-3">
                    {[['Service', booking.service], ['Date', booking.date]].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-gray-100">
                            <span className="text-xs text-gray-500">{label}</span>
                            <span className="text-sm font-medium text-gray-800">{value}</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-gray-100">
                        <span className="text-xs text-gray-500">Status</span>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${sc}`}>{booking.status}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Appointment = () => {
    const [selectedDate, setSelectedDate] = useState(null)
    const [modalBooking, setModalBooking] = useState(null)
    const { name } = useUser()

    const totalBookings = USER_BOOKINGS.length
    const approvedBookings = USER_BOOKINGS.filter(b => b.status === 'Approved').length
    const pendingBookings = USER_BOOKINGS.filter(b => b.status === 'Pending').length
    const completedBookings = USER_BOOKINGS.filter(b => b.status === 'Completed').length

    const handleDateClick = useCallback((info) => {
        const dateStr = info.dateStr
        const d = new Date(dateStr)
        const now = new Date(); now.setHours(0, 0, 0, 0)
        if (d < now) return
        const used = SLOT_MAP[dateStr] || 0
        if (used >= MAX_SLOTS) return
        const ub = USER_BOOKINGS.find((b) => b.date === dateStr)
        if (ub) { setModalBooking(ub); return }
        setSelectedDate(dateStr)
    }, [])

    const dayCellClassNames = useCallback((arg) => {
        const key = toKey(arg.date)
        const now = new Date(); now.setHours(0, 0, 0, 0)
        const classes = []
        if (arg.date < now) return classes
        const used = SLOT_MAP[key] || 0
        if (used >= MAX_SLOTS) classes.push('day-full')
        else if (used >= 7) classes.push('day-near-full')
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

    const selUsed = selectedDate ? (SLOT_MAP[selectedDate] || 0) : 0
    const selRemaining = MAX_SLOTS - selUsed

    return (
        <>
            <main className="p-6 lg:p-8">

                {/* ── Hero Banner ── */}
                <div className="bg-[#0F172A] rounded-2xl p-6 shadow-2xl relative overflow-hidden mb-8">
                    {/* Tailoring bg elements */}
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
                        {/* Left */}
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                My Appointments
                            </h2>
                            <p className="text-slate-400 text-sm">View availability and manage your bookings.</p>
                        </div>

                        {/* Right — Stats inside banner */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                            {[
                                { label: 'Total', value: totalBookings, sub: 'Bookings', icon: MdCalendarToday, color: 'bg-blue-400/20 text-blue-300' },
                                { label: 'Approved', value: approvedBookings, sub: 'Confirmed', icon: MdCheckCircle, color: 'bg-green-400/20 text-green-300' },
                                { label: 'Pending', value: pendingBookings, sub: 'Awaiting', icon: MdPending, color: 'bg-amber-400/20 text-amber-300' },
                                { label: 'Completed', value: completedBookings, sub: 'Done', icon: MdEventAvailable, color: 'bg-indigo-400/20 text-indigo-300' },
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

                {/* Calendar + Side Panel */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <CalendarComponent
                            dateClick={handleDateClick}
                            dayCellClassNames={dayCellClassNames}
                            dayCellContent={dayCellContent}
                        />
                        <div className="flex flex-wrap items-center gap-5 mt-5 px-2">
                            {[
                                { gradient: 'bg-gradient-to-r from-blue-500 to-blue-600', label: 'Selected' },
                                { gradient: 'bg-gradient-to-r from-blue-100 to-blue-200 ring-2 ring-blue-400/30', label: 'Your Booking' },
                                { gradient: 'bg-gradient-to-r from-green-400 to-green-500', label: 'Available' },
                                { gradient: 'bg-gradient-to-r from-amber-300 to-orange-400', label: 'Near Full' },
                                { gradient: 'bg-gradient-to-r from-red-400 to-red-500', label: 'Fully Booked' },
                            ].map(({ gradient, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className={`w-3.5 h-3.5 rounded-md ${gradient}`} />
                                    <span className="text-[11px] text-gray-500 font-semibold tracking-wide">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Selected Date */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600/60 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 inline-block" />
                                Selected Date
                            </h3>
                            {selectedDate ? (
                                <div className="text-center py-3">
                                    <p className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1 font-medium">
                                        {new Date(selectedDate + 'T00:00:00').getFullYear()}
                                    </p>
                                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100">
                                        <MdAccessTime size={14} className="text-green-500" />
                                        <span className="text-xs font-bold text-green-600">Available for booking</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-4 font-medium">{selRemaining} slot(s) remaining out of {MAX_SLOTS}</p>
                                    <div className="mt-3 mx-auto max-w-[200px]">
                                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${selUsed / MAX_SLOTS >= 0.8 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                                                style={{ width: `${(selUsed / MAX_SLOTS) * 100}%` }}
                                            />
                                        </div>
                                    </div>
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

                        {/* Your Bookings */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600/60 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 inline-block" />
                                Your Bookings
                            </h3>
                            <div className="flex flex-col gap-3">
                                {USER_BOOKINGS.map((b) => {
                                    const sc = b.status === 'Approved' ? 'bg-green-50 text-green-600 border border-green-100' : b.status === 'Completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                    return (
                                        <button
                                            key={b.orderId}
                                            onClick={() => setModalBooking(b)}
                                            className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 text-left cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                                <MdCalendarToday size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#0f172a]">{b.service}</p>
                                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">{b.date} · {b.orderId}</p>
                                            </div>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold shrink-0 ${sc}`}>
                                                {b.status}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <MdInfo size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-700 mb-1">Booking Info</p>
                                <p className="text-[11px] text-blue-600/60 leading-relaxed font-medium">
                                    Each day has a maximum of {MAX_SLOTS} slots. Red dates are fully booked.
                                    Click on your bookings (blue highlight) to view details.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <BookingModal booking={modalBooking} onClose={() => setModalBooking(null)} />
        </>
    )
}

export default Appointment