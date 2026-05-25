import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { TIME_SLOTS } from './constants'
import { bookingApi } from '../../services/bookingApi'

const pad = (n) => String(n).padStart(2, '0')
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()
const MAX_SLOTS = 10
const toDateKey = (date = new Date()) => toKey(date.getFullYear(), date.getMonth(), date.getDate())
const getCurrentMinutes = (date = new Date()) => date.getHours() * 60 + date.getMinutes()
const parseSlotStartMinutes = (range = '') => {
    const start = String(range).split('-')[0]?.trim() || ''
    const match = start.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return null

    const [, hourText, minuteText, periodText] = match
    const period = periodText.toUpperCase()
    let hour = Number(hourText)
    const minute = Number(minuteText)

    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0

    return hour * 60 + minute
}
const isSlotPastForDate = (dateKey, slot, now = new Date()) => {
    if (!dateKey || dateKey !== toDateKey(now)) return false

    const slotStartMinutes = parseSlotStartMinutes(slot?.range)
    if (slotStartMinutes === null) return false

    return getCurrentMinutes(now) >= slotStartMinutes
}
const hasSelectableSlotForDate = (dateKey, now = new Date()) =>
    TIME_SLOTS.some((slot) => !isSlotPastForDate(dateKey, slot, now))

const StepPickup = ({ selectedDate, setSelectedDate, selectedSlot, setSelectedSlot }) => {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
    const [slotSummaryByDate, setSlotSummaryByDate] = useState({})
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [hoveredDate, setHoveredDate] = useState(null)
    const [now, setNow] = useState(() => new Date())

    const fetchSlotSummary = useCallback(async (year, month) => {
        try {
            setLoadingSlots(true)
            const from = toKey(year, month, 1)
            const to = toKey(year, month, getDaysInMonth(year, month))
            const response = await bookingApi.getSlotSummary(from, to)
            setSlotSummaryByDate(response?.slots || {})
        } catch (err) {
            console.error('Failed to fetch slots:', err)
        } finally {
            setLoadingSlots(false)
        }
    }, [])

    useEffect(() => {
        fetchSlotSummary(currentMonth.getFullYear(), currentMonth.getMonth())
    }, [currentMonth, fetchSlotSummary])

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!selectedDate || !selectedSlot) return

        const activeSlot = TIME_SLOTS.find((slot) => slot.range === selectedSlot)
        if (activeSlot && isSlotPastForDate(selectedDate, activeSlot, now)) {
            setSelectedSlot('')
        }
    }, [now, selectedDate, selectedSlot, setSelectedSlot])

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

    const renderCalendarCells = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const cells = []

        // Empty cells for padding
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`pad-${i}`} className="aspect-square" />)
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = toKey(year, month, d)
            const dateObj = new Date(year, month, d)
            const isPastDate = dateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const hasSelectableSlot = hasSelectableSlotForDate(dateStr, now)
            const isUnavailable = isPastDate || !hasSelectableSlot
            const isSelected = selectedDate === dateStr
            
            const slotInfo = slotSummaryByDate[dateStr]
            const used = slotInfo?.used ?? 0
            const max = slotInfo?.max ?? MAX_SLOTS
            const ratio = max > 0 ? used / max : 0
            const isFull = slotInfo?.isFull || ratio >= 1

            cells.push(
                <div key={d} className="relative">
                    <button
                        disabled={isUnavailable}
                        onClick={() => {
                            setNow(new Date())
                            setSelectedDate(dateStr)
                            setSelectedSlot('')
                        }}
                        onMouseEnter={() => !isUnavailable && setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`
                            relative w-full aspect-square flex flex-col items-center justify-center rounded-lg border transition-all duration-200
                            ${isUnavailable ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 
                              isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md z-10 scale-105 cursor-pointer' :
                              isFull ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 cursor-pointer' :
                              ratio >= 0.7 ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 cursor-pointer' :
                              'bg-white border-gray-100 text-gray-700 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                            }
                        `}
                    >
                        <span className="text-[11px] sm:text-xs font-bold">{d}</span>
                        {!isUnavailable && !isSelected && used > 0 && (
                            <div className="absolute bottom-1 w-full px-1.5">
                                <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${ratio >= 1 ? 'bg-red-500' : ratio >= 0.7 ? 'bg-orange-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {isFull && !isSelected && !isUnavailable && (
                            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full translate-x-1/3 -translate-y-1/3 border border-white" />
                        )}
                    </button>

                    {/* Hover Tooltip */}
                    {hoveredDate === dateStr && slotInfo && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[70] w-36 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-[#0F172A] text-white p-2.5 rounded-xl shadow-xl text-[9px] border border-white/10 backdrop-blur-md">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1">
                                        <span className="font-bold text-blue-300 uppercase tracking-widest">Available Slots</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Repair:</span>
                                        <span className={`font-bold ${slotInfo.repairIsFull ? 'text-red-400' : 'text-green-400'}`}>
                                            {slotInfo.repairAvailable} / {slotInfo.repairMax}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Team/Org:</span>
                                        <span className={`font-bold ${slotInfo.jerseyOrgIsFull ? 'text-red-400' : 'text-green-400'}`}>
                                            {slotInfo.jerseyOrgAvailable} / {slotInfo.jerseyOrgMax}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0F172A]" />
                            </div>
                        </div>
                    )}
                </div>
            )
        }
        return cells
    }

    const monthName = currentMonth.toLocaleString('default', { month: 'long' })
    const selectedDayInfo = selectedDate ? slotSummaryByDate[selectedDate] : null
    const isDateFull = selectedDayInfo?.isFull || false

    return (
        <section>
            <div className="text-center mb-10 font-inter">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Schedule Pickup</h2>
                <p className="text-gray-500 mt-2 text-sm">When should we come to collect your items?</p>
            </div>

            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" />
                            <span className="text-sm font-bold text-gray-700">{monthName} {currentMonth.getFullYear()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <ChevronLeft size={16} className="text-gray-500" />
                            </button>
                            <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <ChevronRight size={16} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                            <div key={d} className="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {renderCalendarCells()}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-50">
                        {[
                            { color: 'bg-green-500', label: 'Available' },
                            { color: 'bg-orange-500', label: 'Near Full' },
                            { color: 'bg-red-500', label: 'Full' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedDate && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select Time Range</span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>

                        {isDateFull ? (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                                <Info size={32} className="text-red-400 mx-auto mb-3" />
                                <p className="text-sm font-bold text-red-600">This date is fully booked</p>
                                <p className="text-xs text-red-400 mt-1">Please select another date on the calendar.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                {TIME_SLOTS.map((slot) => {
                                    const active = selectedSlot === slot.range
                                    const isPastSlot = isSlotPastForDate(selectedDate, slot, now)
                                    return (
                                        <button
                                            key={slot.id}
                                            disabled={isPastSlot}
                                            onClick={() => {
                                                if (isPastSlot) return
                                                setSelectedSlot(slot.range)
                                            }}
                                            className={`flex flex-col items-center py-4 rounded-xl border-2 transition-all duration-300
                                                ${isPastSlot
                                                    ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400 opacity-70'
                                                    : active
                                                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100/50 -translate-y-0.5'
                                                    : 'cursor-pointer border-gray-100 bg-white text-gray-500 hover:border-blue-200 hover:bg-blue-50/10'
                                                }`}
                                        >
                                            <span className={`font-bold text-sm ${isPastSlot ? 'text-gray-400' : active ? 'text-blue-600' : 'text-gray-700'}`}>{slot.label}</span>
                                            <span className={`mt-0.5 text-[10px] ${isPastSlot ? 'text-gray-400' : active ? 'text-blue-400' : 'text-gray-400'}`}>{slot.range}</span>
                                            {isPastSlot && (
                                                <span className="mt-1 text-[10px] font-semibold text-gray-400">No longer available today</span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                <p className="text-center text-[10px] text-gray-400 font-medium mt-6">
                    <Info size={12} className="inline mr-1 -mt-0.5" />
                    System will confirm pickup window within 24 hours.
                </p>
            </div>
        </section>
    )
}

export default StepPickup
