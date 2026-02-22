import React, { useState, useCallback } from 'react'
import BookingModal from './Bookingforms'
import HomeSidebar from '../../components/HomeSidebar'
import HomeNavbar from '../../components/HomeNavbar'
import CalendarComponent, { toKey, MAX_SLOTS, SLOT_MAP, USER_BOOKINGS } from '../../components/calendar'
import { MdAdd, MdShoppingBag, MdCheckCircle, MdInventory, MdDesktopWindows, MdPrint } from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { mockOrders } from '../../data/mockData'
import '../../styles/calendar.css'

const StepIcon = ({ step }) => {
    const done = step.done || step.active
    return (
        <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                ${done ? 'border-2 border-blue-500 text-blue-700' : 'bg-gray-200 text-gray-400'}`}
        >
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
    const [collapsed, setCollapsed] = useState(true)
    const [showBooking, setShowBooking] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)

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
                {ub && !isSelected && (
                    <span className="pickup-badge">Pickup</span>
                )}
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
            <div className="flex min-h-screen bg-[#F8FAFC]">
                <HomeSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
                <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-0 sm:ml-[70px]' : 'ml-0 sm:ml-[240px]'}`}>
                    <HomeNavbar collapsed={collapsed} setCollapsed={setCollapsed} />
                    <main className="p-6 lg:p-8">
                        <div className="flex items-end justify-end mb-8">
                            {/* Dito name to diba */}
                            <button onClick={() => setShowBooking(true)} className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                                Book Now <MdAdd size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-5 flex items-start justify-between shadow-sm border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">My Order</p>
                                    <p className="text-xl font-bold text-gray-800">2</p>
                                    <p className="text-xs text-gray-400 mt-1">Active orders</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                                    <MdShoppingBag size={20} />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-5 flex items-start justify-between shadow-sm border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Pickup Ready</p>
                                    <p className="text-xl font-bold text-gray-800">1</p>
                                    <p className="text-xs text-gray-400 mt-1">Awaiting pickup</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                                    <MdCheckCircle size={20} />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-5 flex items-start justify-between shadow-sm border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Total Order</p>
                                    <p className="text-xl font-bold text-gray-800">8</p>
                                    <p className="text-xs text-gray-400 mt-1">Lifetime orders</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600">
                                    <MdInventory size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Calendar</h3>
                                    <div className="calendar-wrapper" style={{ padding: '0', boxShadow: 'none', border: 'none' }}>
                                        <CalendarComponent
                                            dayCellClassNames={dayCellClassNames}
                                            dayCellContent={dayCellContent}
                                            dateClick={(arg) => setSelectedDate(toKey(arg.date))}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/*    traxck */}
                            <div className="lg:col-span-3 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-sm font-semibold text-gray-800">Order Tracker</h3>
                                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium">
                                        {mockOrders.length} Active Orders
                                    </span>
                                </div>
                                <div className="flex flex-col gap-6">
                                    {mockOrders.map((order) => (
                                        <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-semibold text-gray-800">{order.item}</p>
                                                <span className="text-[11px] text-gray-400 font-mono">{order.id}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">{order.customer} · Placed {order.date}</p>
                                            <ProgressTracker steps={order.steps} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </main>
                </div>
            </div>

            <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} />
        </>
    )
}

export default Dashboard
