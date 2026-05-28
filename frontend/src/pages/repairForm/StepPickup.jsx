import React, { useState, useEffect } from 'react'
import { MdCalendarToday, MdAccessTime, MdInfo, MdChevronLeft, MdChevronRight, MdClose, MdCheck } from 'react-icons/md'
import { TIME_SLOTS } from './constants'

const pad = (n) => String(n).padStart(2, '0')
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()
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
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false)
    const [now, setNow] = useState(() => new Date())

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

    const handleDateSelection = (dateStr) => {
        setNow(new Date())
        setSelectedDate(dateStr)
        setSelectedSlot('')
        setIsTimeModalOpen(true)
    }

    const renderCalendarCells = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const cells = []

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

            cells.push(
                <div key={d} className="relative">
                    <button
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => handleDateSelection(dateStr)}
                        className={`
                            relative w-full aspect-square flex flex-col items-center justify-center rounded-lg border transition-all duration-300
                            ${isUnavailable ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' :
                                isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg z-10 scale-105 cursor-pointer' :
                                    'bg-white border-gray-100 text-gray-700 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            }
                        `}
                    >
                        <span className="text-[11px] sm:text-xs font-bold">{d}</span>
                    </button>
                </div>
            )
        }
        return cells
    }

    const monthName = currentMonth.toLocaleString('default', { month: 'long' })

    const formattedSelectedDate = selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) : ''

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Schedule Pickup</h2>
                <p className="text-gray-500 mt-2 text-sm">When should we come to collect your items?</p>
            </div>

            <div className="max-w-md mx-auto font-inter">
                <div className="bg-white rounded-[1.5rem] p-4 shadow-xl shadow-blue-900/5 border border-blue-50/50 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                                <MdCalendarToday size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 leading-none">{monthName}</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{currentMonth.getFullYear()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm text-gray-500 transition-all cursor-pointer"
                            >
                                <MdChevronLeft size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm text-gray-500 transition-all cursor-pointer"
                            >
                                <MdChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                            <div key={d} className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {renderCalendarCells()}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-50">
                        {[
                            { color: 'bg-green-500', label: 'Available' },
                            { color: 'bg-gray-300', label: 'Unavailable' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${color}  ring-offset-0 ${color.replace('bg-', 'ring-')}/10`} />
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Time Selection Modal */}
                {isTimeModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div
                            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <MdAccessTime size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Select Time Slot</h3>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{formattedSelectedDate}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsTimeModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <MdClose size={20} />
                                </button>
                            </div>

                            <div className="px-6 pb-8">
                                <div className="grid grid-cols-1 gap-3 mt-4">
                                    {TIME_SLOTS.map((slot) => {
                                        const active = selectedSlot === slot.range
                                        const isPastSlot = isSlotPastForDate(selectedDate, slot, now)
                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                disabled={isPastSlot}
                                                onClick={() => {
                                                    if (isPastSlot) return
                                                    setSelectedSlot(slot.range)
                                                    setIsTimeModalOpen(false)
                                                }}
                                                className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300
                                                    ${isPastSlot
                                                        ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400 opacity-70'
                                                        : active
                                                        ? 'border-blue-600 bg-blue-50 shadow-md ring-4 ring-blue-600/5'
                                                        : 'cursor-pointer border-gray-50 bg-gray-50/50 text-gray-600 hover:border-blue-200 hover:bg-white'
                                                }`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className={`font-bold text-sm ${isPastSlot ? 'text-gray-400' : active ? 'text-blue-600' : 'text-gray-900'}`}>{slot.label}</span>
                                                    <span className={`text-[10px] font-medium ${isPastSlot ? 'text-gray-400' : active ? 'text-blue-400' : 'text-gray-500'}`}>{slot.range}</span>
                                                    {isPastSlot && (
                                                        <span className="mt-1 text-[10px] font-semibold text-gray-400">No longer available today</span>
                                                    )}
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                    ${active ? 'border-blue-600 bg-blue-600 text-white' : isPastSlot ? 'border-gray-200 bg-gray-100' : 'border-gray-200 group-hover:border-blue-300'}`}>
                                                    {active && <MdCheck size={14} />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-center text-[10px] text-gray-400 font-medium mt-6 uppercase tracking-widest opacity-60">
                    <MdInfo size={12} className="inline mr-1 -mt-0.5" />
                    We'll confirm your pickup within 24 hours of submission.
                </p>
            </div>
        </section>
    )
}

export default StepPickup
