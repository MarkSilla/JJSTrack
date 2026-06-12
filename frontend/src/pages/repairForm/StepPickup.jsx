import React, { useState, useEffect } from 'react'
import { MdCalendarToday, MdAccessTime, MdInfo, MdChevronLeft, MdChevronRight, MdClose, MdCheck } from 'react-icons/md'
import { TIME_SLOTS } from './constants'
import { bookingApi } from '../../../services/bookingApi'

const pad = (n) => String(n).padStart(2, '0')
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()
const DATE_STATUS_STYLES = {
    full_slots: 'bg-red-50 border-red-200 text-red-700',
    holiday: 'bg-violet-50 border-violet-200 text-violet-700',
    closed: 'bg-slate-100 border-slate-300 text-slate-700',
}

const StepPickup = ({ selectedDate, setSelectedDate, selectedSlot, setSelectedSlot, bookingType = 'repair' }) => {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false)
    const [slotSummary, setSlotSummary] = useState({})
    const [summaryLoading, setSummaryLoading] = useState(false)

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

    useEffect(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const from = toKey(year, month, 1)
        const to = toKey(year, month, getDaysInMonth(year, month))

        setSummaryLoading(true)
        bookingApi.getSlotSummary(from, to)
            .then((response) => setSlotSummary(response?.slots || {}))
            .catch((err) => {
                console.error('Error loading slot summary:', err)
                setSlotSummary({})
            })
            .finally(() => setSummaryLoading(false))
    }, [currentMonth])

    const handleDateSelection = (dateStr) => {
        const daySummary = slotSummary[dateStr]
        const isRepairFull = Boolean(daySummary?.repairIsFull)
        const isJerseyOrgFull = Boolean(daySummary?.jerseyOrgIsFull)
        const isCapacityFull = bookingType === 'repair' ? isRepairFull : isJerseyOrgFull
        const isDateBlocked = Boolean(daySummary?.isDateBlocked)
        if (isCapacityFull || isDateBlocked) return

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
            const daySummary = slotSummary[dateStr]
            const isRepairFull = Boolean(daySummary?.repairIsFull)
            const isJerseyOrgFull = Boolean(daySummary?.jerseyOrgIsFull)
            const isCapacityFull = bookingType === 'repair' ? isRepairFull : isJerseyOrgFull
            const isDateBlocked = Boolean(daySummary?.isDateBlocked)
            const isUnavailable = isCapacityFull || isDateBlocked
            const isSelected = selectedDate === dateStr
            const unavailableLabel = isDateBlocked
                ? (daySummary?.dateStatus?.label || 'Unavailable')
                : isCapacityFull
                    ? 'Full'
                    : ''
            const statusStyle = DATE_STATUS_STYLES[daySummary?.dateStatus?.status]

            cells.push(
                <div key={d} className="relative">
                    <button
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => handleDateSelection(dateStr)}
                        className={`
                            relative w-full aspect-square flex flex-col items-center justify-center rounded-lg border transition-all duration-300
                            ${isDateBlocked ? `${statusStyle || 'bg-gray-100 border-gray-200 text-gray-500'} cursor-not-allowed` :
                                isCapacityFull ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed' :
                                isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg z-10 scale-105 cursor-pointer' :
                                    'bg-white border-gray-100 text-gray-700 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            }
                        `}
                    >
                        <span className="text-[11px] sm:text-xs font-bold">{d}</span>
                        {unavailableLabel && (
                            <span className="mt-0.5 text-[8px] font-black uppercase tracking-wide leading-none">{unavailableLabel}</span>
                        )}
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
                    {summaryLoading && (
                        <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">Checking availability...</p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-50">
                        {[
                            { color: 'bg-green-500', label: 'Available' },
                            { color: 'bg-red-500', label: 'Full Slots' },
                            { color: 'bg-violet-500', label: 'Holiday' },
                            { color: 'bg-slate-500', label: 'Closed' },
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
                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedSlot(slot.range)
                                                    setIsTimeModalOpen(false)
                                                }}
                                                className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300
                                                    ${active
                                                        ? 'border-blue-600 bg-blue-50 shadow-md ring-4 ring-blue-600/5'
                                                        : 'cursor-pointer border-gray-50 bg-gray-50/50 text-gray-600 hover:border-blue-200 hover:bg-white'
                                                }`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className={`font-bold text-sm ${active ? 'text-blue-600' : 'text-gray-900'}`}>{slot.label}</span>
                                                    <span className={`text-[10px] font-medium ${active ? 'text-blue-400' : 'text-gray-500'}`}>{slot.range}</span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                    ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 group-hover:border-blue-300'}`}>
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
