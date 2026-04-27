import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    MdSearch, MdShoppingBag, MdLoop, MdDoneAll, MdPrint,
    MdMoveToInbox, MdDesktopWindows, MdLocalPrintshop, MdLocalShipping,
    MdFilterList, MdClose, MdCheckCircle, MdDateRange, MdPerson,
    MdPhone, MdEmail, MdLocationOn, MdAssignment, MdInfo, MdTag, MdSort,
    MdOutlineIron,
} from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { 
    FileText, QrCode, Package, Zap, Download, AlertCircle, Eye, EyeOff, Copy, Check, MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { orderApi }   from '../../../services/orderApi.js'
import { bookingApi } from '../../../services/bookingApi.js'
import { useNavigate, useParams } from 'react-router-dom'
import OrderTailorChatModal from '../../components/OrderTailorChatModal.jsx'
import useTrackingUpdatesSocket from '../../hooks/useTrackingUpdatesSocket.js'
import {
    getTrackingReferenceCode,
    getTrackingReferenceId,
    getTrackingReferenceLabel,
} from '../../utils/trackingReference.js'
import { getTrackingDisplayName } from '../../utils/trackingDisplay.js'
import { getPickupSlotDisplay } from '../../utils/pickupSlot.js'

const STEP_ICON = {
    'dropped off': MdMoveToInbox,
    'layout':      MdDesktopWindows,
    'printing':    MdLocalPrintshop,
    'pressing':    MdOutlineIron,
    'sewing':      GiSewingMachine,
    'pick-up':     MdLocalShipping,
}

const TRACKING_REFRESH_DEBOUNCE_MS = 250
const FALLBACK_REFRESH_MS = 60000
const SORT_OPTIONS = [
    { value: 'latest', label: 'Latest First' },
    { value: 'service-asc', label: 'Service Type (A-Z)' },
    { value: 'service-desc', label: 'Service Type (Z-A)' },
]
const ORDER_STATUS_FILTERS = ['All Orders', 'In Progress', 'Completed', 'Released', 'Cancelled']
const ACTIVE_TRACKING_STATUSES = new Set(['pending', 'approved', 'in progress', 'in-progress'])
const FULFILLED_TRACKING_STATUSES = new Set(['completed', 'released'])
const CLOSED_TRACKING_STATUSES = new Set(['completed', 'released', 'cancelled'])

const normalizeTrackingStatus = (status = '') => String(status || '').trim().toLowerCase()
const isActiveTrackingStatus = (status = '') => ACTIVE_TRACKING_STATUSES.has(normalizeTrackingStatus(status))
const isFulfilledTrackingStatus = (status = '') => FULFILLED_TRACKING_STATUSES.has(normalizeTrackingStatus(status))
const isClosedTrackingStatus = (status = '') => CLOSED_TRACKING_STATUSES.has(normalizeTrackingStatus(status))
const normalizeStepLabel = (label = '') =>
    String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
const hasReachedDropOffStep = (steps = []) =>
    Array.isArray(steps) &&
    steps.some((step) => {
        const label = normalizeStepLabel(step?.label)
        return ['dropped off', 'drop off'].includes(label) && Boolean(step?.done || step?.active)
    })

const getServiceTypeLabel = (entry = {}) => {
    const serviceType = String(entry.serviceType || '').trim()
    if (serviceType) return serviceType

    const bookingType = String(entry.bookingType || '').trim().toLowerCase()
    if (bookingType === 'repair') return 'Repair'
    if (bookingType === 'jersey') return 'Team Jersey'
    if (bookingType === 'organizational') return 'Custom'
    if (!bookingType) return ''

    return bookingType.charAt(0).toUpperCase() + bookingType.slice(1)
}

const getCreatedAtValue = (entry = {}) => {
    const timestamp = new Date(entry.createdAt || entry.date || 0).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
}

const sortOrders = (items = [], sortBy = 'latest') => {
    const sortedItems = [...items]

    if (sortBy === 'service-asc' || sortBy === 'service-desc') {
        sortedItems.sort((first, second) => {
            const firstType = getServiceTypeLabel(first).toLowerCase()
            const secondType = getServiceTypeLabel(second).toLowerCase()
            const direction = sortBy === 'service-asc' ? 1 : -1
            const typeComparison = firstType.localeCompare(secondType) * direction

            if (typeComparison !== 0) return typeComparison

            return getCreatedAtValue(second) - getCreatedAtValue(first)
        })

        return sortedItems
    }

    sortedItems.sort((first, second) => getCreatedAtValue(second) - getCreatedAtValue(first))
    return sortedItems
}

const matchesActiveFilter = (order, filter) => {
    const status = String(order?.status || '').trim()

    if (filter === 'All Orders') return true
    if (filter === 'In Progress') return status === 'In Progress' || status === 'In-Progress'
    return status === filter
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
        'Released':    'bg-cyan-50 text-cyan-700 border-cyan-200',
        'Cancelled':   'bg-red-50 text-red-500 border-red-200',
    }
    return (
        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {status}
        </span>
    )
}

// ─── Details Modal ────────────────────────────
const DetailsModal = ({ order, onClose, onOpenChat }) => {
    const navigate  = useNavigate()
    const isBooking = !!order.bookingType
    const serviceTypeLabel = getServiceTypeLabel(order)
    const referenceCode = getTrackingReferenceCode(order)
    const referenceId = getTrackingReferenceId(order)
    const referenceLabel = getTrackingReferenceLabel(order)
    const bookingRefId = typeof order.bookingId === 'string'
        ? order.bookingId
        : order.bookingId?._id
    const normalizedStatus = String(order.status || '').toLowerCase()
    const canViewInvoice = !isBooking && (
        order.paid === true ||
        order.isReleased === true ||
        Boolean(order.paidAt || order.releasedAt || order.pickedUpAt) ||
        normalizedStatus === 'completed' ||
        normalizedStatus === 'released'
    )
    const displayName = getTrackingDisplayName(order)
    const canMessageTailor = Boolean(order.assignedTailor) && order.status !== 'Cancelled'

    const [qrCode, setQrCode] = useState(null)
    const [loadingQR, setLoadingQR] = useState(false)
    const [activeTab, setActiveTab] = useState('items')
    const [copied, setCopied] = useState(false)

    // Prevent body scroll when drawer is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    // Load QR code when component mounts or when activeTab changes to 'qr'
    useEffect(() => {
        if (activeTab === 'qr' && !qrCode && !loadingQR) {
            loadQRCode()
        }
    }, [activeTab])

    const loadQRCode = async () => {
        try {
            setLoadingQR(true)
            const response = isBooking 
                ? await bookingApi.getBookingQR(order._id)
                : await orderApi.getOrderQR(order._id)
            setQrCode(response.qrCode)
        } catch (error) {
            console.error('Error fetching QR code:', error)
        } finally {
            setLoadingQR(false)
        }
    }

    const handleCopyQR = () => {
        if (qrCode) {
            navigator.clipboard.writeText(qrCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleDownloadQR = () => {
        if (!qrCode) return
        const link = document.createElement('a')
        link.href = qrCode
        link.download = `${isBooking ? 'booking' : 'order'}-${order._id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const iconMap = {
        'Order ID': MdTag,
        'Booking ID': MdTag,
        'Status': MdCheckCircle,
        'Item/Service': MdShoppingBag,
        'Service Type': MdInfo,
        'Date Placed': MdDateRange,
        'Est. Completion': MdDateRange,
        'Assigned Tailor': MdPerson,
        'Notes': MdAssignment,
        'Full Name': MdPerson,
        'Phone': MdPhone,
        'Email': MdEmail,
        'Pickup Date': MdDateRange,
        'Time Range': MdDateRange,
        'Address': MdLocationOn,
    }

    const fields = [
        { label: referenceLabel, value: referenceId },
        { label: 'Status',       value: order.status },
        { label: 'Item/Service', value: getTrackingDisplayName(order) },
        { label: 'Service Type', value: serviceTypeLabel },
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
            { label: 'Time Range', value: getPickupSlotDisplay(order.pickupSlot) },
            { label: 'Address',     value: order.contact?.address },
        ]),
    ].filter(f => f.value)

    const items = order.items || []
    const hasItems = items.length > 0

    return (
        <>
        {/* Backdrop */}
        <div 
            className="fixed top-0 left-0 w-screen h-screen z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        />
        
        {/* Side Drawer - Mobile rounded-t-3xl, Desktop rounded-2xl */}
        <div
            className="fixed bottom-0 sm:right-0 sm:top-0 h-1/2 sm:h-screen z-50 w-full sm:max-w-md bg-white shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ease-out rounded-t-3xl sm:rounded-none"
        >
            {/* Mobile Handle Bar */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header - Payroll Style */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0 font-inter">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <FileText size={16} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-[15px] font-extrabold text-gray-900 truncate">{displayName}</h2>
                        <p className="text-[10px] text-gray-400 mt-0.5">{referenceCode}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 bg-transparent border-none cursor-pointer transition-colors shrink-0"
                >
                    <MdClose size={18} className="text-gray-400" />
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-0 px-5 pt-3 border-b border-gray-100 shrink-0 bg-white font-inter">
                <button
                    onClick={() => setActiveTab('items')}
                    className={`flex items-center gap-2 px-4 py-3 font-bold text-[12px] uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap
                        ${activeTab === 'items' 
                            ? 'text-blue-600 border-b-blue-600' 
                            : 'text-gray-400 border-b-transparent hover:text-gray-600'
                        }`}
                >
                    <Package size={14} />
                    Ordered Items
                </button>
                {order.status !== 'Cancelled' && (
                    <button
                        onClick={() => setActiveTab('qr')}
                        className={`flex items-center gap-2 px-4 py-3 font-bold text-[12px] uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap
                            ${activeTab === 'qr' 
                                ? 'text-blue-600 border-b-blue-600' 
                                : 'text-gray-400 border-b-transparent hover:text-gray-600'
                            }`}
                    >
                        <QrCode size={14} />
                        QR Code
                    </button>
                )}
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto p-5 flex-1 space-y-5 font-inter">
                {activeTab === 'items' ? (
                    <>
                        {/* Details Section */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Order Details</p>
                            <div className="grid grid-cols-2 gap-3">
                                {fields.map(({ label, value }) => {
                                    const Icon = iconMap[label]
                                    return (
                                        <div key={label} className="bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-xl px-3.5 py-3 flex items-start gap-2.5 border border-gray-100/50 hover:border-blue-200/50 transition-colors">
                                            {Icon && <Icon size={16} className="text-blue-500 shrink-0 mt-0.5" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                                                <p className="text-[11px] font-semibold text-gray-800 break-words">{value}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Items Section */}
                        {hasItems && (
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Items Ordered</p>
                                <div className="space-y-2.5">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-xl p-3.5 border border-gray-100/50 hover:border-blue-200/50 transition-colors">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-gray-800">{item.description}</p>
                                                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">Type: {item.type}</p>
                                                </div>
                                                <span className="bg-blue-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                                                    ×{item.qty}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div className="bg-white rounded-lg p-2 border border-gray-100/50">
                                                    <p className="text-gray-400 font-medium">Unit Price</p>
                                                    <p className="text-gray-800 font-bold mt-0.5">₱{item.unitPrice?.toLocaleString() || '—'}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-2 border border-gray-100/50">
                                                    <p className="text-gray-400 font-medium">Total</p>
                                                    <p className="text-gray-800 font-bold mt-0.5">₱{(item.qty * item.unitPrice)?.toLocaleString() || '—'}</p>
                                                </div>
                                            </div>
                                            {item.size && (
                                                <p className="text-[9px] text-gray-500 mt-2">Size: <span className="font-semibold">{item.size}</span></p>
                                            )}
                                            {item.addOn && (
                                                <p className="text-[9px] text-gray-500">Add-on: <span className="font-semibold">{item.addOn} (₱{item.addOnPrice || '—'})</span></p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // QR Code Tab
                    <div className="space-y-4">
                        {loadingQR ? (
                            <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
                                    <QrCode size={24} className="text-purple-400" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Loading QR Code...</p>
                            </div>
                        ) : qrCode ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-white p-4 rounded-xl border-2 border-purple-200 shadow-sm">
                                    <img 
                                        src={qrCode} 
                                        alt="QR Code"
                                        className="w-48 h-48 object-contain"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-500 text-center leading-relaxed max-w-xs">
                                    Staff scans this code to release your order. Do not share with others.
                                </p>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={handleCopyQR}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-600 text-[11px] font-bold transition-colors cursor-pointer"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={14} /> Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} /> Copy
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleDownloadQR}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-[11px] font-bold transition-colors cursor-pointer shadow-sm"
                                    >
                                        <Download size={14} /> Download
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                                <AlertCircle size={24} className="text-red-400" />
                                <p className="text-sm text-gray-600 font-medium">Failed to load QR code</p>
                                <button
                                    onClick={loadQRCode}
                                    className="text-blue-600 text-[11px] font-bold hover:text-blue-700"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            {(canViewInvoice || canMessageTailor) && (
                <div className="px-5 py-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-blue-50/50 shrink-0 space-y-2">
                    {canMessageTailor && (
                        <button
                            onClick={onOpenChat}
                            className="w-full text-[12px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider cursor-pointer transition-colors py-2.5 flex items-center justify-center gap-1.5 bg-white border border-emerald-200 rounded-xl shadow-sm"
                        >
                            <MessageCircle size={14} /> Message Tailor
                        </button>
                    )}
                    {canViewInvoice && (
                        <button
                            onClick={() => { navigate(bookingRefId ? `/invoices/${bookingRefId}` : '/invoices'); onClose() }}
                            className="w-full text-[12px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer transition-colors py-2.5 flex items-center justify-center gap-1.5"
                        >
                            <FileText size={14} /> View Invoice
                        </button>
                    )}
                </div>
            )}
        </div>
        </>
    )
}

// ─── Order Card ───────────────────────────────
const OrderCard = ({ order, onCancel, onOpenDetails }) => {
    const [showModal, setShowModal] = useState(false)
    const [showChatModal, setShowChatModal] = useState(false)
    const [qrCode, setQrCode] = useState(null)
    const [loadingQR, setLoadingQR] = useState(false)
    const isBooking = !!order.bookingType
    const serviceTypeLabel = getServiceTypeLabel(order)
    const referenceCode = getTrackingReferenceCode(order)
    const displayName = getTrackingDisplayName(order)
    const steps = order.steps || []
    const canMessageTailor = Boolean(order.assignedTailor) && order.status !== 'Cancelled'
    const canCancel = !isClosedTrackingStatus(order.status) && !hasReachedDropOffStep(steps)

    const loadQRCode = async () => {
        if (loadingQR || qrCode) return
        try {
            setLoadingQR(true)
            const response = isBooking 
                ? await bookingApi.getBookingQR(order._id)
                : await orderApi.getOrderQR(order._id)
            setQrCode(response.qrCode)
        } catch (error) {
            console.error('Error fetching QR code:', error)
            toast.error('Failed to load QR code')
        } finally {
            setLoadingQR(false)
        }
    }

    const handleDownloadQR = async () => {
        if (!qrCode) {
            await loadQRCode()
            return
        }
        const link = document.createElement('a')
        link.href = qrCode
        link.download = `${isBooking ? 'booking' : 'order'}-${order._id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

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
                                {serviceTypeLabel || '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-gray-400 font-medium">
                            <span className="truncate max-w-[120px] sm:max-w-none">
                                {referenceCode}
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
                        { label: 'Service',  value: getTrackingDisplayName(order) },
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
                        {order.assignedTailor ? 'Tailor:' : 'Status:'}
                    </span>
                    <span className="text-[11px] font-black text-gray-700 truncate">
                        {order.assignedTailor || 'is not assigned'}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {canMessageTailor && (
                        <button
                            onClick={() => setShowChatModal(true)}
                            className="bg-white border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-2 sm:px-4 rounded-xl hover:bg-emerald-50 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                            <MessageCircle size={12} />
                            <span className="hidden sm:inline">Message Tailor</span>
                            <span className="sm:hidden">Chat</span>
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={() => onCancel(order)}
                            className="bg-white border border-red-200 text-red-500 text-[10px] font-black uppercase tracking-widest px-3 py-2 sm:px-4 rounded-xl hover:bg-red-50 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                            Cancel
                        </button>
                    )}
                    {order.status !== 'Cancelled' && (
                        <button
                            onClick={handleDownloadQR}
                            disabled={loadingQR}
                            className="bg-white border border-purple-200 text-purple-600 text-[10px] font-black uppercase tracking-widest px-3 py-2 sm:px-4 rounded-xl hover:bg-purple-50 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            title={loadingQR ? 'Loading QR...' : 'Download QR Code'}
                        >
                            <Download size={12} />
                            <span className="hidden sm:inline">Download QR</span>
                            <span className="sm:hidden">QR</span>
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (typeof onOpenDetails === 'function') {
                                onOpenDetails(order)
                                return
                            }

                            setShowModal(true)
                        }}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 sm:px-4 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                        <QrCode size={12} />
                        Details
                    </button>
                </div>
            </div>
        </div>

        {/* ── Details Modal ── */}
        {showModal && !onOpenDetails && (
            <DetailsModal
                order={order}
                onClose={() => setShowModal(false)}
                onOpenChat={() => {
                    setShowModal(false)
                    setShowChatModal(true)
                }}
            />
        )}
        {showChatModal && <OrderTailorChatModal order={order} onClose={() => setShowChatModal(false)} />}
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
                    {ORDER_STATUS_FILTERS.map(f => (
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
    const navigate = useNavigate()
    const { orderId: selectedOrderId } = useParams()
    const [searchQuery,  setSearchQuery]  = useState('')
    const [activeFilter, setActiveFilter] = useState('All Orders')
    const [sortBy,       setSortBy]       = useState('latest')
    const [orders,       setOrders]       = useState([])
    const [bookings,     setBookings]     = useState([])
    const [stats,        setStats]        = useState({ total: 0, inProgress: 0, fulfilled: 0 })
    const [loading,      setLoading]      = useState(true)
    const [error,        setError]        = useState(null)
    const [showFilter,   setShowFilter]   = useState(false)
    const [showStickySearch, setShowStickySearch] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [activeChatOrder, setActiveChatOrder] = useState(null)

    const mainRef = useRef(null)
    const searchTimeoutRef = useRef(null)
    const hasInitializedSearchRef = useRef(false)
    const refreshTimeoutRef = useRef(null)
    
    const handleScroll = (e) => {
        setShowStickySearch(e.target.scrollTop > 300)
    }

    const scrollToTop = () => {
        if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const fetchData = useCallback(async (filter = 'All Orders', search = '', { silent = false } = {}) => {
        if (!silent) {
            setLoading(true)
            setError(null)
        }
        try {
            const params = {}
            if (search.trim())           params.search = search.trim()
            const [od, bd] = await Promise.all([
                orderApi.getOrders(params),
                bookingApi.getBookings(params),
            ])
            if (od.success) setOrders(od.orders)
            if (bd.success) setBookings(bd.bookings || bd.data || [])
        } catch {
            if (!silent) {
                setError('Failed to load orders. Please try again.')
            }
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }, [])

    // Re-fetch on filter change
    useEffect(() => { fetchData(activeFilter, searchQuery) }, [activeFilter, fetchData])

    const scheduleSilentRefresh = useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
        }

        refreshTimeoutRef.current = window.setTimeout(() => {
            refreshTimeoutRef.current = null
            fetchData(activeFilter, searchQuery, { silent: true })
        }, TRACKING_REFRESH_DEBOUNCE_MS)
    }, [activeFilter, searchQuery, fetchData])

    useTrackingUpdatesSocket(() => {
        scheduleSilentRefresh()
    })

    // Fallback refresh if socket reconnect is delayed
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState !== 'visible') return
            fetchData(activeFilter, searchQuery, { silent: true })
        }, FALLBACK_REFRESH_MS)
        return () => clearInterval(interval);
    }, [activeFilter, searchQuery, fetchData])

    useEffect(() => {
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
    }, [scheduleSilentRefresh])

    useEffect(() => () => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
        }
    }, [])

    // Debounced search
    useEffect(() => {
        if (!hasInitializedSearchRef.current) {
            hasInitializedSearchRef.current = true
            return
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            fetchData(activeFilter, searchQuery)
        }, 500) // 500ms debounce
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery, fetchData])

    // Stats from API
    useEffect(() => {
        orderApi.getOrderStats()
            .then(d => { if (d.success) setStats({ total: d.stats.total, inProgress: d.stats.inProgress, fulfilled: d.stats.completed }) })
            .catch(console.error)
    }, [])

    // Update stats when data changes
    useEffect(() => {
        const all = [...orders, ...bookings]
        setStats(prev => ({
            ...prev,
            total:      all.length,
            inProgress: all.filter(i => isActiveTrackingStatus(i.status)).length,
            fulfilled:  all.filter(i => isFulfilledTrackingStatus(i.status)).length,
        }))
    }, [orders, bookings])

    useEffect(() => {
        let isActive = true

        if (!selectedOrderId) {
            setSelectedOrder(null)
            return () => {
                isActive = false
            }
        }

        const existingOrder = [...orders, ...bookings].find((item) =>
            String(item?._id || item?.id || '') === String(selectedOrderId)
        )

        if (existingOrder) {
            setSelectedOrder(existingOrder)
            return () => {
                isActive = false
            }
        }

        const loadSelectedOrder = async () => {
            try {
                const [orderResponse, bookingResponse] = await Promise.allSettled([
                    orderApi.getOrderById(selectedOrderId),
                    bookingApi.getBookingById(selectedOrderId),
                ])

                if (!isActive) return

                const nextOrder =
                    orderResponse.status === 'fulfilled'
                        ? orderResponse.value?.order || orderResponse.value?.data || orderResponse.value
                        : null
                const nextBooking =
                    bookingResponse.status === 'fulfilled'
                        ? bookingResponse.value?.booking || bookingResponse.value?.data || bookingResponse.value
                        : null

                setSelectedOrder(nextOrder?._id ? nextOrder : nextBooking?._id ? nextBooking : null)
            } catch {
                if (isActive) {
                    setSelectedOrder(null)
                }
            }
        }

        loadSelectedOrder()

        return () => {
            isActive = false
        }
    }, [selectedOrderId, orders, bookings])

    const handleFilterSelect = (f) => setActiveFilter(f)
    const displayedItems = sortOrders(
        [...orders, ...bookings].filter((item) => matchesActiveFilter(item, activeFilter)),
        sortBy
    )

    const handleCancelOrder = (order) => {
        const orderId = order?._id || order?.id
        const bookingId = order?.bookingType ? orderId : null
        const orderName = getTrackingDisplayName(order)

        if (!orderId) {
            toast.error('Unable to cancel this item right now.')
            return
        }

        if (hasReachedDropOffStep(order?.steps)) {
            toast.error(`This ${bookingId ? 'booking' : 'order'} can no longer be cancelled after it has been dropped off.`)
            return
        }

        const orderLabel = orderName ? `"${orderName}"` : 'this order'
        const confirmationId = `cancel-order-${bookingId || orderId}`

        toast(`Cancel ${orderLabel}?`, {
            id: confirmationId,
            description: 'This action cannot be undone.',
            duration: 12000,
            action: {
                label: 'Yes, cancel',
                onClick: () => {
                    toast.dismiss(confirmationId)
                    toast.promise(
                        (async () => {
                            try {
                                const response = bookingId
                                    ? await bookingApi.cancelBooking(bookingId)
                                    : await orderApi.cancelOrder(orderId)

                                if (!response.success) {
                                    throw new Error(response.message || 'Unknown error')
                                }

                                await fetchData(activeFilter, searchQuery, { silent: true })
                                return response
                            } catch (error) {
                                console.error('Cancel order error:', error)
                                throw error
                            }
                        })(),
                        {
                            loading: `Cancelling ${orderLabel}...`,
                            success: 'Order cancelled successfully',
                            error: (error) => `Failed to cancel order: ${error?.message || 'Unknown error'}`,
                        }
                    )
                },
            },
            cancel: {
                label: 'Keep order',
            },
        })
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
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5">My Orders</h2>
                        <p className="text-slate-400 text-xs sm:text-sm">Track and manage your tailoring orders.</p>
                    </div>
                    {/* Stats — full width grid, no scroll */}
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                        {[
                            { label: 'Total',       value: stats.total,      icon: MdShoppingBag, color: 'bg-blue-400/20 text-blue-300'  },
                            { label: 'In Progress', value: stats.inProgress, icon: MdLoop,        color: 'bg-amber-400/20 text-amber-300' },
                            { label: 'Fulfilled',   value: stats.fulfilled,  icon: MdDoneAll,     color: 'bg-green-400/20 text-green-300' },
                        ].map(({ label, value, icon, color }) => (
                            <div key={label} className="bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5">
                                {/* Mobile: icon + label on top, number below */}
                                <div className="flex items-center gap-1.5 sm:hidden">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                                        {React.createElement(icon, { size: 13, className: color.split(' ')[1] })}
                                    </div>
                                    <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
                                </div>
                                <p className="text-white text-xl sm:text-lg font-bold leading-tight sm:hidden">{value}</p>
                                {/* Desktop: original side-by-side layout */}
                                <div className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                                    {React.createElement(icon, { size: 16, className: color.split(' ')[1] })}
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
            <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder-gray-400 font-medium"
                        />
                    </div>

                    {/* Refresh button - visible on all sizes */}
                    <button
                        onClick={() => fetchData(activeFilter, searchQuery)}
                        className="bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 text-xs font-bold px-3 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="Refresh orders"
                    >
                        <MdLoop size={16} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-none sm:min-w-[210px]">
                        <MdSort size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="w-full appearance-none pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all font-medium text-gray-600"
                        >
                            {SORT_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
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
                        {ORDER_STATUS_FILTERS.map(filter => (
                            <button key={filter} onClick={() => setActiveFilter(filter)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer
                                    ${activeFilter === filter ? 'bg-[#0F172A] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}>
                                {filter}
                            </button>
                        ))}
                    </div>
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
                        <button onClick={() => fetchData(activeFilter, searchQuery)} className="mt-3 text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest">Retry</button>
                    </div>
                )}

                {loading && !error && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

                {!loading && !error && displayedItems.length > 0 &&
                    displayedItems.map((item, idx) => (
                        <OrderCard
                            key={item._id || idx}
                            order={item}
                            onCancel={handleCancelOrder}
                            onOpenDetails={(order) => navigate(`/order/${order?._id || order?.id}`)}
                        />
                    ))
                }

                {!loading && !error && displayedItems.length === 0 && (
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

            {selectedOrder && (
                <DetailsModal
                    order={selectedOrder}
                    onClose={() => navigate('/order')}
                    onOpenChat={() => {
                        setActiveChatOrder(selectedOrder)
                        navigate('/order')
                    }}
                />
            )}
            {activeChatOrder && (
                <OrderTailorChatModal
                    order={activeChatOrder}
                    onClose={() => setActiveChatOrder(null)}
                />
            )}
        </main>
    )
}

export default Order
