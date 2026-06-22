import React, { useEffect, useMemo, useState } from 'react'
import { MdCalendarToday, MdChevronLeft, MdChevronRight, MdInfo } from 'react-icons/md'
import { bookingApi } from '../../../services/bookingApi'

const pad = (n) => String(n).padStart(2, '0')
const toMonthKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

const DATE_STATUS_CONFIG = {
    full_slots: { label: 'Full Slots', dot: 'bg-red-500', cell: 'bg-red-50 border-red-200 text-red-700' },
    holiday: { label: 'Holiday', dot: 'bg-violet-500', cell: 'bg-violet-50 border-violet-200 text-violet-700' },
    closed: { label: 'Closed', dot: 'bg-slate-500', cell: 'bg-slate-100 border-slate-300 text-slate-700' },
}

const EMPTY_SLOT_INFO = {
    repairBooked: 0,
    repairAvailable: 7,
    repairMax: 7,
    repairIsFull: false,
    jerseyOrgBooked: 0,
    jerseyOrgAvailable: 3,
    jerseyOrgMax: 3,
    jerseyOrgIsFull: false,
}
const CAPACITY_WARNING = 'This date has already reached its recommended capacity. Your booking request may be delayed and is subject to approval.'

const getCapacity = (summary, bookingType) =>
    bookingType === 'repair'
        ? {
            booked: summary?.repairBooked ?? 0,
            available: summary?.repairAvailable ?? 0,
            max: summary?.repairMax ?? 7,
            isFull: Boolean(summary?.repairIsFull),
        }
        : {
            booked: summary?.jerseyOrgBooked ?? 0,
            available: summary?.jerseyOrgAvailable ?? 0,
            max: summary?.jerseyOrgMax ?? 3,
            isFull: Boolean(summary?.jerseyOrgIsFull),
        }

const StepBookingDate = ({ bookingType = 'jersey', bookingDate, setBookingDate, onAvailabilityChange }) => {
    const initialDate = bookingDate ? new Date(`${bookingDate}T00:00:00`) : new Date()
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
    const [slotSummary, setSlotSummary] = useState({})
    const [loading, setLoading] = useState(false)

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const monthName = currentMonth.toLocaleString('default', { month: 'long' })

    useEffect(() => {
        const from = toMonthKey(year, month, 1)
        const to = toMonthKey(year, month, getDaysInMonth(year, month))

        setLoading(true)
        bookingApi.getSlotSummary(from, to)
            .then((response) => setSlotSummary(response?.slots || {}))
            .catch((err) => {
                console.error('Error checking booking dates:', err)
                setSlotSummary({})
            })
            .finally(() => setLoading(false))
    }, [year, month])

    useEffect(() => {
        if (!bookingDate) return
        const selected = new Date(`${bookingDate}T00:00:00`)
        if (Number.isNaN(selected.getTime())) return
        setCurrentMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    }, [bookingDate])

    const selectedSummary = bookingDate ? (slotSummary[bookingDate] || EMPTY_SLOT_INFO) : null
    const selectedCapacity = selectedSummary ? getCapacity(selectedSummary, bookingType) : null
    const selectedBlocked = Boolean(selectedSummary?.isDateBlocked)
    const selectedBookable = Boolean(bookingDate && selectedSummary && !selectedBlocked)

    useEffect(() => {
        if (typeof onAvailabilityChange !== 'function') return
        onAvailabilityChange(selectedBookable)
    }, [onAvailabilityChange, selectedBookable])

    const handleSelectDate = (dateKey, summary) => {
        if (summary?.isDateBlocked) return
        setBookingDate(dateKey)
    }

    const cells = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const nextCells = []

        for (let i = 0; i < firstDay; i++) {
            nextCells.push(<div key={`pad-${i}`} className="aspect-square" />)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = toMonthKey(year, month, day)
            const summary = slotSummary[dateKey] || EMPTY_SLOT_INFO
            const capacity = getCapacity(summary, bookingType)
            const isBlocked = Boolean(summary?.isDateBlocked)
            const statusConfig = DATE_STATUS_CONFIG[summary?.dateStatus?.status]
            const isSelected = bookingDate === dateKey
            const isUnavailable = isBlocked
            const label = isBlocked
                ? (summary?.dateStatus?.label || statusConfig?.label || 'Blocked')
                : capacity.isFull
                    ? 'Full'
                    : `${capacity.available}/${capacity.max}`

            nextCells.push(
                <button
                    key={dateKey}
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => handleSelectDate(dateKey, summary)}
                    className={`relative aspect-square rounded-xl border px-1 py-2 text-center transition-all ${
                        isSelected
                            ? 'z-10 scale-105 border-blue-600 bg-blue-600 text-white shadow-lg'
                            : isBlocked
                                ? `${statusConfig?.cell || DATE_STATUS_CONFIG.closed.cell} cursor-not-allowed`
                                : capacity.isFull
                                    ? 'cursor-pointer border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:shadow-md'
                                    : 'cursor-pointer border-slate-100 bg-white text-slate-700 hover:border-blue-300 hover:shadow-md'
                    }`}
                >
                    <span className="block text-xs font-black">{day}</span>
                    <span className="mt-1 block text-[8px] font-black uppercase leading-none tracking-wide">
                        {label}
                    </span>
                </button>
            )
        }

        return nextCells
    }, [bookingDate, bookingType, month, slotSummary, year])

    const selectedDateLabel = bookingDate
        ? new Date(`${bookingDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : ''

    return (
        <section>
            <div className="mb-8 text-center font-inter">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-800 md:text-3xl">Select Booking Date</h2>
                <p className="mt-2 text-sm text-gray-500">Choose the date you want this booking to be handled.</p>
            </div>

            <div className="mx-auto max-w-md rounded-3xl border border-blue-50 bg-white p-4 shadow-xl shadow-blue-900/5">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <MdCalendarToday size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black leading-none text-slate-900">{monthName}</h3>
                            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{year}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-slate-50 p-1">
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:shadow-sm"
                        >
                            <MdChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:shadow-sm"
                        >
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div key={day} className="py-1 text-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">{cells}</div>

                {loading && (
                    <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Checking slots...</p>
                )}

                {bookingDate && selectedCapacity && (
                    <div className={`mt-5 rounded-2xl border p-4 ${
                        selectedBlocked ? 'border-red-100 bg-red-50 text-red-700' : selectedCapacity.isFull ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-100 bg-green-50 text-green-700'
                    }`}>
                        <p className="text-sm font-black">{selectedDateLabel}</p>
                        <p className="mt-1 text-xs font-semibold">
                            {selectedBlocked
                                ? selectedSummary?.unavailableReason || 'This date is unavailable.'
                                : selectedCapacity.isFull
                                    ? selectedSummary?.capacityWarning || CAPACITY_WARNING
                                    : `${selectedCapacity.available} of ${selectedCapacity.max} slots available`}
                        </p>
                    </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
                    {[
                        { color: 'bg-green-500', label: 'Available' },
                        { color: 'bg-red-500', label: 'Full Slots' },
                        { color: 'bg-violet-500', label: 'Holiday' },
                        { color: 'bg-slate-500', label: 'Closed' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${color}`} />
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</span>
                        </div>
                    ))}
                </div>

                <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-widest text-gray-400">
                    <MdInfo size={12} className="mr-1 inline -mt-0.5" />
                    Dates follow admin calendar status and slot limits.
                </p>
            </div>
        </section>
    )
}

export default StepBookingDate
