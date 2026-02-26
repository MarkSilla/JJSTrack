import React, { useState, useEffect, useRef } from 'react'
import {
    MdSearch, MdShoppingBag, MdLoop, MdDoneAll, MdPrint,
    MdMoveToInbox, MdDesktopWindows, MdLocalPrintshop, MdLocalShipping,
    MdFilterList, MdClose,
} from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { orderApi }   from '../../../services/orderApi.js'
import { bookingApi } from '../../../services/bookingApi.js'
import { useNavigate } from 'react-router-dom'

const STEP_ICON = {
    'dropped off': MdMoveToInbox,
    'layout':      MdDesktopWindows,
    'printing':    MdLocalPrintshop,
    'sewing':      GiSewingMachine,
    'pick-up':     MdLocalShipping,
}

// ─── Step Icon ───────────────────────────────
const StepIcon = ({ step, size = 'md' }) => {
    const label    = step.label?.toLowerCase().trim() ?? ''
    const isDone   = step.done
    const isActive = !step.done && step.active
    const Icon     = STEP_ICON[label]
    const sz       = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
    const iconSz   = size === 'sm' ? 14 : 17

    return (
        <div className={`
            ${sz} rounded-full flex items-center justify-center shrink-0 transition-all
            ${isDone   ? 'bg-blue-500 text-white border-2 border-blue-500'                 : ''}
            ${isActive ? 'bg-white text-blue-500 border-2 border-blue-500 shadow-md'      : ''}
            ${!isDone && !isActive ? 'bg-gray-100 text-gray-300 border-2 border-gray-200' : ''}
        `}>
            {Icon && <Icon size={iconSz} />}
        </div>
    )
}

const StepLabel = ({ step, size = 'md' }) => {
    const isDone   = step.done
    const isActive = !step.done && step.active
    const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]'
    return (
        <span className={`${textSize} mt-1 whitespace-nowrap font-medium
            ${isDone   ? 'text-blue-600' : ''}
            ${isActive ? 'text-blue-500' : ''}
            ${!isDone && !isActive ? 'text-gray-400' : ''}
        `}>
            {step.label}
        </span>
    )
}

// ─── Progress Tracker ────────────────────────
const OrderProgressTracker = ({ steps }) => {
    if (!steps || steps.length === 0) return null
    return (
        <>
            {/* Desktop & Tablet — horizontal */}
            <div className="hidden sm:flex items-center w-full mt-2 overflow-x-auto pb-1 gap-0">
                {steps.map((step, i) => (
                    <React.Fragment key={step.label + i}>
                        <div className="flex flex-col items-center min-w-[72px]">
                            <StepIcon step={step} />
                            <StepLabel step={step} />
                            {step.active
                                ? <span className="text-[9px] text-blue-400 font-semibold mt-0.5">Active</span>
                                : <span className="text-[9px] text-gray-300 mt-0.5">
                                    {step.date || '—'}
                                  </span>
                            }
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-[2px] flex-1 min-w-[16px] -mt-9 mx-1 rounded transition-all
                                ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Mobile — no scroll, fits full width evenly */}
            <div className="sm:hidden flex items-start w-full mt-3">
                {steps.map((step, i) => (
                    <React.Fragment key={step.label + i}>
                        <div className="flex flex-col items-center flex-1">
                            <StepIcon step={step} size="sm" />
                            <StepLabel step={step} size="sm" />
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-[2px] flex-1 mt-3 mx-0.5 rounded transition-all
                                ${steps[i + 1].done || steps[i + 1].active ? 'bg-blue-500' : 'bg-gray-200'}`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </>
    )
}

// ─── Status Badge ─────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        'Pending':     'bg-yellow-50 text-yellow-600 border-yellow-200',
        'Approved':    'bg-blue-50 text-blue-600 border-blue-200',
        'In Progress': 'bg-orange-50 text-orange-600 border-orange-200',
        'Completed':   'bg-green-50 text-green-600 border-green-200',
        'Cancelled':   'bg-red-50 text-red-500 border-red-200',
    }
    return (
        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {status}
        </span>
    )
}

// ─── Details Modal ────────────────────────────
const DetailsModal = ({ order, onClose }) => {
    const navigate  = useNavigate()
    const isBooking = !!order.bookingType
    const displayName = isBooking
        ? `${order.bookingType.charAt(0).toUpperCase() + order.bookingType.slice(1)} Request`
        : order.item

    const fields = [
        { label: 'Order ID',     value: order.orderId || order._id },
        { label: 'Status',       value: order.status },
        { label: 'Item/Service', value: order.item || order.service },
        { label: 'Service Type', value: order.serviceType },
        { label: 'Date Placed',  value: order.date || new Date(order.createdAt).toLocaleDateString() },
        { label: 'Est. Completion', value: order.estimatedCompletion },
        ...(!isBooking ? [
            { label: 'Assigned Tailor', value: order.assignedTailor },
            { label: 'Notes',           value: order.notes },
        ] : [
            { label: 'Full Name',   value: order.contact?.fullName },
            { label: 'Phone',       value: order.contact?.phone },
            { label: 'Email',       value: order.contact?.email },
            { label: 'Pickup Date', value: order.pickupDate },
            { label: 'Pickup Slot', value: order.pickupSlot },
            { label: 'Address',     value: order.contact?.address },
        ]),
    ].filter(f => f.value)

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-sm font-black text-gray-800">{displayName}</h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                            #{order.orderId || order._id?.slice(-8)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                {/* Modal Body — scrollable */}
                <div className="overflow-y-auto p-5 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                        {fields.map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                <p className="text-[11px] font-semibold text-gray-800 break-words">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
                    {!isBooking && order.status === 'Completed' && (
                        <button
                            onClick={() => { navigate('/invoices'); onClose() }}
                            className="text-[11px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-wider cursor-pointer transition-colors"
                        >
                            View Invoice
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto bg-[#0F172A] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Order Card ───────────────────────────────
const OrderCard = ({ order, onCancel }) => {
    const [showModal, setShowModal] = useState(false)
    const isBooking = !!order.bookingType
    const displayName = isBooking
        ? `${order.bookingType.charAt(0).toUpperCase() + order.bookingType.slice(1)} Request`
        : order.item
    const steps = order.steps || []

    return (
        <>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">

            {/* ── Header ── */}
            <div className="p-4 sm:p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base sm:text-lg font-black text-gray-800 tracking-tight leading-tight truncate">
                                {displayName}
                            </h3>
                            <span className="bg-gray-100 text-gray-500 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-widest whitespace-nowrap shrink-0">
                                {isBooking ? order.bookingType : (order.serviceType || '—')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-gray-400 font-medium">
                            <span className="truncate max-w-[120px] sm:max-w-none">
                                #{order.orderId || order._id?.slice(-8)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                            <span>{order.date || new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <StatusBadge status={order.status} />
                        {!isBooking && order.estimatedCompletion && (
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                Due {order.estimatedCompletion}
                            </p>
                        )}
                        {isBooking && order.pickupDate && (
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                Pickup {order.pickupDate}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Booking quick info ── */}
            {isBooking && (
                <div className="px-4 sm:px-5 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[
                        { label: 'Customer', value: order.contact?.fullName },
                        { label: 'Service',  value: order.service },
                        { label: 'Contact',  value: order.contact?.phone || order.contact?.email },
                        { label: 'Pickup',   value: order.pickupDate },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-[11px] font-bold text-gray-800 truncate">{value || '—'}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Progress Steps ── */}
            {steps.length > 0 && (
                <div className="px-4 sm:px-5 pb-3">
                    <OrderProgressTracker steps={steps} />
                </div>
            )}

            {/* ── Footer ── */}
            <div className="px-4 sm:px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                        {isBooking ? 'By:' : 'Tailor:'}
                    </span>
                    <span className="text-[11px] font-black text-gray-700 truncate">
                        {isBooking ? (order.contact?.fullName || '—') : (order.assignedTailor || '—')}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <button
                            onClick={() => onCancel(order._id, displayName, order.bookingId)}
                            className="bg-white border border-red-200 text-red-500 text-[10px] font-black uppercase tracking-widest px-3 py-2 sm:px-4 rounded-xl hover:bg-red-50 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-white border border-gray-200 text-[#2563EB] text-[10px] font-black uppercase tracking-widest px-3 py-2 sm:px-4 rounded-xl hover:bg-blue-50 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                        Details
                    </button>
                </div>
            </div>
        </div>

        {/* ── Details Modal ── */}
        {showModal && <DetailsModal order={order} onClose={() => setShowModal(false)} />}
        </>
    )
}

// ─── Skeleton ─────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div className="p-4 sm:p-5">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 bg-gray-200 rounded-lg" />
                    <div className="h-3 w-48 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="flex gap-2 mt-5 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gray-200" />
                        <div className="h-2 w-10 bg-gray-100 rounded" />
                    </div>
                ))}
            </div>
        </div>
        <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
            <div className="h-3 w-28 bg-gray-200 rounded" />
            <div className="h-7 w-20 bg-gray-200 rounded-xl" />
        </div>
    </div>
)

// ─── Mobile Filter Sheet ──────────────────────
const FilterSheet = ({ active, onSelect, onClose }) => {
    const filters = ['All Orders', 'In Progress', 'Completed', 'Cancelled']
    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-t-3xl p-5 pb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Filter Orders</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <MdClose size={18} />
                    </button>
                </div>
                <div className="space-y-2">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => { onSelect(f); onClose() }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all
                                ${active === f ? 'bg-[#0F172A] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────
const Order = () => {
    const [searchQuery,  setSearchQuery]  = useState('')
    const [activeFilter, setActiveFilter] = useState('All Orders')
    const [orders,       setOrders]       = useState([])
    const [bookings,     setBookings]     = useState([])
    const [stats,        setStats]        = useState({ total: 0, inProgress: 0, completed: 0 })
    const [loading,      setLoading]      = useState(true)
    const [error,        setError]        = useState(null)
    const [showFilter,   setShowFilter]   = useState(false)
    const [showStickySearch, setShowStickySearch] = useState(false)

    const mainRef = useRef(null)

    const handleScroll = (e) => {
        setShowStickySearch(e.target.scrollTop > 300)
    }

    const scrollToTop = () => {
        if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const fetchData = async (filter = activeFilter, search = searchQuery) => {
        setLoading(true); setError(null)
        try {
            const params = {}
            if (filter !== 'All Orders') params.status = filter
            if (search.trim())           params.search = search.trim()
            const [od, bd] = await Promise.all([
                orderApi.getOrders(params),
                bookingApi.getBookings(params),
            ])
            if (od.success) setOrders(od.orders)
            if (bd.success) setBookings(bd.bookings || bd.data || [])
        } catch (err) {
            setError('Failed to load orders. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Initial load
    useEffect(() => { fetchData() }, [])

    // Re-fetch on filter change
    useEffect(() => { fetchData(activeFilter) }, [activeFilter])

    // Stats from API
    useEffect(() => {
        orderApi.getOrderStats()
            .then(d => { if (d.success) setStats({ total: d.stats.total, inProgress: d.stats.inProgress, completed: d.stats.completed }) })
            .catch(console.error)
    }, [])

    // Update stats when data changes
    useEffect(() => {
        const all = [...orders, ...bookings]
        setStats(prev => ({
            ...prev,
            total:      all.length,
            inProgress: all.filter(i => i.status === 'In Progress' || i.status === 'Pending').length,
            completed:  all.filter(i => i.status === 'Completed').length,
        }))
    }, [orders, bookings])

    const handleFilterSelect = (f) => setActiveFilter(f)

    const handleCancelOrder = async (orderId, orderName, bookingId) => {
        if (!window.confirm(`Are you sure you want to cancel "${orderName}"? This action cannot be undone.`)) {
            return
        }

        try {
            let response;
            
            // If bookingId exists, cancel the booking (which will also cancel the order)
            if (bookingId) {
                response = await bookingApi.cancelBooking(bookingId)
            } else {
                // Fallback to order cancellation if no bookingId
                response = await orderApi.cancelOrder(orderId)
            }
            
            if (response.success) {
                alert('Order cancelled successfully')
                // Refresh the orders list
                fetchData(activeFilter)
            } else {
                alert('Failed to cancel order: ' + (response.message || 'Unknown error'))
            }
        } catch (error) {
            alert('Error cancelling order: ' + error.message)
            console.error('Cancel order error:', error)
        }
    }

    return (
        <main ref={mainRef} className="p-3 sm:p-5 lg:p-8 w-full overflow-y-auto max-h-screen" onScroll={handleScroll}>

            {/* ── Hero Banner ── */}
            <div className="bg-[#0F172A] rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden mb-5 sm:mb-7">
                <div className="absolute -top-4 right-3 opacity-10 text-white pointer-events-none">
                    <GiSewingMachine size={120} />
                </div>
                <div className="absolute bottom-2 left-5 opacity-[0.07] text-white -rotate-12 pointer-events-none">
                    <MdPrint size={90} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-0.5">My Orders</h2>
                        <p className="text-slate-400 text-xs sm:text-sm">Track and manage your tailoring orders.</p>
                    </div>
                    {/* Stats — full width grid, no scroll */}
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                        {[
                            { label: 'Total',       value: stats.total,      icon: MdShoppingBag, color: 'bg-blue-400/20 text-blue-300'  },
                            { label: 'In Progress', value: stats.inProgress, icon: MdLoop,        color: 'bg-amber-400/20 text-amber-300' },
                            { label: 'Completed',   value: stats.completed,  icon: MdDoneAll,     color: 'bg-green-400/20 text-green-300' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5">
                                {/* Mobile: icon + label on top, number below */}
                                <div className="flex items-center gap-1.5 sm:hidden">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                                        <Icon size={13} className={color.split(' ')[1]} />
                                    </div>
                                    <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
                                </div>
                                <p className="text-white text-xl sm:text-lg font-bold leading-tight sm:hidden">{value}</p>
                                {/* Desktop: original side-by-side layout */}
                                <div className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                                    <Icon size={16} className={color.split(' ')[1]} />
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-slate-400 text-[9px] font-medium">{label}</p>
                                    <p className="text-white text-lg font-bold leading-tight">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Controls ── */}
            <div className="flex items-center gap-2 mb-5">
                {/* Search */}
                <div className="relative flex-1">
                    <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchData(activeFilter, searchQuery)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder-gray-400 font-medium"
                    />
                </div>

                {/* Mobile filter button */}
                <button
                    onClick={() => setShowFilter(true)}
                    className="sm:hidden flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 shadow-sm shrink-0"
                >
                    <MdFilterList size={16} />
                    <span className="hidden xs:inline">{activeFilter === 'All Orders' ? 'Filter' : activeFilter}</span>
                </button>

                {/* Desktop filter tabs */}
                <div className="hidden sm:flex items-center gap-1.5">
                    {['All Orders', 'In Progress', 'Completed', 'Cancelled'].map(filter => (
                        <button key={filter} onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer
                                ${activeFilter === filter ? 'bg-[#0F172A] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}>
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active filter pill on mobile */}
            {activeFilter !== 'All Orders' && (
                <div className="sm:hidden flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500">Filtering by:</span>
                    <span className="flex items-center gap-1 bg-[#0F172A] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        {activeFilter}
                        <button onClick={() => setActiveFilter('All Orders')} className="ml-1 opacity-70 hover:opacity-100">
                            <MdClose size={12} />
                        </button>
                    </span>
                </div>
            )}

            {/* ── Orders List ── */}
            <div className="space-y-3 sm:space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                        <p className="text-red-500 font-semibold text-sm">{error}</p>
                        <button onClick={() => fetchData()} className="mt-3 text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest">Retry</button>
                    </div>
                )}

                {loading && !error && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

                {!loading && !error && (orders.length > 0 || bookings.length > 0) &&
                    [...orders, ...bookings].map((item, idx) => (
                        <OrderCard key={item._id || idx} order={item} onCancel={handleCancelOrder} />
                    ))
                }

                {!loading && !error && orders.length === 0 && bookings.length === 0 && (
                    <div className="bg-white rounded-3xl p-12 sm:p-20 text-center border-2 border-dashed border-gray-100">
                        <GiSewingMachine size={32} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs sm:text-sm">No orders found</p>
                        {activeFilter !== 'All Orders' && (
                            <button onClick={() => setActiveFilter('All Orders')} className="mt-3 text-xs text-blue-400 font-bold">
                                Clear filter
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Filter Sheet */}
            {showFilter && (
                <FilterSheet
                    active={activeFilter}
                    onSelect={handleFilterSelect}
                    onClose={() => setShowFilter(false)}
                />
            )}

            {/* ── Sticky Floating Search Bar (appears on scroll) ── */}
            {showStickySearch && (
                <div className="fixed top-20 sm:top-22 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 flex items-center gap-2">
                    <div className="relative flex-1">
                        <MdSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchData(activeFilter, searchQuery)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder-gray-400 font-medium"
                        />
                    </div>
                    <div className="relative group shrink-0">
                        <button
                            onClick={scrollToTop}
                            className="bg-[#0F172A] hover:bg-slate-700 text-white text-xs font-bold w-10 h-10 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center"
                        >
                            ↑
                        </button>
                        {/* Tooltip — shows below button */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                            Back to top
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Order