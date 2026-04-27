import React, { useState, useEffect } from 'react'
import { MdPictureAsPdf, MdEmail, MdPhone, MdLocationOn, MdReceipt, MdCheckCircle, MdAccessTime } from 'react-icons/md'
import { GiSewingMachine } from 'react-icons/gi'
import { bookingApi } from '../../../services/bookingApi'
import img from '../../assets/img.js'
import { useParams } from 'react-router-dom'
import { getTrackingReferenceId } from '../../utils/trackingReference.js'
import { getTrackingDisplayName } from '../../utils/trackingDisplay.js'
import { exportInvoiceToPDF } from '../../utils/exportUtils.js'

const useUser = () => ({ name: 'Juan' })

const getGreeting = () => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'Good morning'
    if (h >= 12 && h < 18) return 'Good afternoon'
    return 'Good evening'
}

const statusStyle = (status) => {
    const s = status?.toLowerCase()
    if (s === 'paid') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    if (s === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-200'
    if (s === 'overdue') return 'bg-red-50 text-red-700 border border-red-200'
    return 'bg-gray-100 text-gray-600'
}

const statusIcon = (status) => {
    const s = status?.toLowerCase()
    if (s === 'paid') return <MdCheckCircle size={14} className="text-emerald-500" />
    if (s === 'pending') return <MdAccessTime size={14} className="text-amber-500" />
    return null
}

const typeBadge = (type) => {
    const colors = {
        Service: 'bg-blue-50 text-blue-700 border border-blue-200',
        Custom: 'bg-purple-50 text-purple-700 border border-purple-200',
        Repair: 'bg-orange-50 text-orange-700 border border-orange-200',
    }
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
            {type}
        </span>
    )
}

const toNumeric = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

const normalizeInvoiceStatus = (booking) => {
    const invoiceStatus = String(booking?.invoice?.status || '').toLowerCase()
    if (invoiceStatus === 'paid') return 'Paid'
    if (invoiceStatus === 'overdue') return 'Overdue'
    if (invoiceStatus === 'pending') return 'Pending'

    const bookingStatus = String(booking?.status || '').toLowerCase()
    if (booking?.paid || booking?.isPickedUp || bookingStatus === 'released' || bookingStatus.includes('scan')) return 'Paid'
    return 'Pending'
}

const shouldShowInvoice = (booking) => normalizeInvoiceStatus(booking) === 'Paid'

const mapBookingTypeToItemType = (bookingType) => {
    const type = String(bookingType || '').toLowerCase()
    if (type === 'repair') return 'Repair'
    if (type === 'jersey' || type === 'organizational') return 'Custom'
    return 'Service'
}

const toInvoiceItems = (booking) => {
    const invoiceItems = Array.isArray(booking?.invoice?.items) ? booking.invoice.items : []
    const bookingItems = Array.isArray(booking?.items) ? booking.items : []
    const sourceItems = invoiceItems.length > 0 ? invoiceItems : bookingItems

    if (sourceItems.length > 0) {
        return sourceItems.map((item) => ({
            description: item?.description || booking?.service || 'Service',
            type: item?.type || mapBookingTypeToItemType(booking?.bookingType),
            qty: toNumeric(item?.qty) || 1,
            unitPrice: toNumeric(item?.unitPrice),
            addOnPrice: toNumeric(item?.addOnPrice),
            size: item?.size || '',
            addOn: item?.addOn || 'None',
            notes: item?.notes || '',
        }))
    }

    const selectedOptions = Array.isArray(booking?.selectedOptions) ? booking.selectedOptions : []
    if (selectedOptions.length > 0) {
        return selectedOptions.map((option) => ({
            description: `${booking?.service || 'Service'} - ${option?.name || 'Option'}`,
            type: mapBookingTypeToItemType(booking?.bookingType),
            qty: toNumeric(option?.quantity) || 1,
            unitPrice: toNumeric(option?.price),
            addOnPrice: 0,
            size: '',
            addOn: 'None',
            notes: option?.notes || '',
        }))
    }

    return [{
        description: booking?.service || 'Service',
        type: mapBookingTypeToItemType(booking?.bookingType),
        qty: 1,
        unitPrice: toNumeric(booking?.totalPrice ?? booking?.amount),
        addOnPrice: 0,
        size: '',
        addOn: 'None',
        notes: '',
    }]
}

const calculateItemsTotal = (items) =>
    (items || []).reduce((sum, item) => {
        const qty = toNumeric(item?.qty) || 1
        const unitPrice = toNumeric(item?.unitPrice)
        const addOnPrice = toNumeric(item?.addOnPrice)
        return sum + (qty * (unitPrice + addOnPrice))
    }, 0)

const Invoices = () => {
    const { id } = useParams()
    const { name } = useUser()

    const [invoices, setInvoices] = useState([])
    const [selectedIdx, setSelectedIdx] = useState(0)
    const [loading, setLoading] = useState(true)

    // Fetch invoices from API
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoading(true)
                const response = await bookingApi.getBookings()
                if (response.success) {
                    // Transform API bookings to invoice format
                    const bookings = Array.isArray(response.bookings) ? response.bookings : (Array.isArray(response.data) ? response.data : [])
                    const invoiceData = bookings
                        .filter(shouldShowInvoice)
                        .map((booking) => {
                            const items = toInvoiceItems(booking)
                            const amount = calculateItemsTotal(items)
                            const billTo = {
                                name: booking?.invoice?.billTo?.name || booking?.contact?.fullName || 'N/A',
                                address: booking?.invoice?.billTo?.address || booking?.contact?.address || '',
                                city: booking?.invoice?.billTo?.city || booking?.contact?.city || '',
                                phone: booking?.invoice?.billTo?.phone || booking?.contact?.phone || '',
                                email: booking?.invoice?.billTo?.email || booking?.contact?.email || '',
                            }

                            return {
                                id: booking._id,
                                referenceId: getTrackingReferenceId(booking),
                                invoiceNumber: booking?.invoice?.invoiceNumber || `INV-${booking._id.slice(-6).toUpperCase()}`,
                                customerName: billTo.name,
                                itemName: getTrackingDisplayName(booking),
                                orderItem: getTrackingDisplayName(booking),
                                amount,
                                status: normalizeInvoiceStatus(booking),
                                date: booking?.invoice?.date || (booking?.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-PH') : 'N/A'),
                                dueDate: booking?.invoice?.dueDate || booking?.pickupDate || 'N/A',
                                orderId: getTrackingReferenceId(booking),
                                items,
                                billTo,
                                taxRate: toNumeric(booking?.invoice?.taxRate),
                                discount: booking?.invoice?.discount || null,
                            }
                        })
                    setInvoices(invoiceData)
                    setSelectedIdx(0)
                } else {
                    setInvoices([])
                    setSelectedIdx(0)
                }
            } catch (error) {
                console.error('Error fetching bookings:', error)
                setInvoices([])
                setSelectedIdx(0)
            } finally {
                setLoading(false)
            }
        }
        fetchInvoices()
    }, [])

    useEffect(() => {
        if (id && invoices.length > 0) {
            const idx = invoices.findIndex(inv => inv.id === id)
            if (idx !== -1) setSelectedIdx(idx)
        }
    }, [id, invoices])

    const invoice = invoices[selectedIdx]

    const subtotal = invoice ? invoice.items.reduce((sum, item) => {
        return sum + (item.qty * item.unitPrice) + ((item.addOnPrice || 0) * item.qty)
    }, 0) : 0
    const tax = invoice && invoice.taxRate ? subtotal * invoice.taxRate : 0
    const discount = invoice?.discount?.amount || 0
    const total = subtotal + tax - discount

    // Stats
    const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.qty * (item.unitPrice + (item.addOnPrice || 0)), 0), 0)
    const paidCount = invoices.filter(i => i.status === 'Paid').length
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.qty * (item.unitPrice + (item.addOnPrice || 0)), 0), 0)

    return (
        <main className="p-4 sm:p-6 lg:p-8 font-inter">
            {loading ? (
                <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading invoices...</p>
                    </div>
                </div>
            ) : invoices.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                        <MdReceipt size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600">No paid invoices found</p>
                    </div>
                </div>
            ) : (
                <>

                    {/* ── Hero Banner ── */}
                    <div className="bg-[#0F172A] rounded-2xl p-6 shadow-2xl relative overflow-hidden mb-8">
                        {/* Tailoring bg elements */}
                        <div className="absolute -top-3 right-4 opacity-10 text-white pointer-events-none">
                            <GiSewingMachine size={140} />
                        </div>
                        <div className="absolute bottom-2 left-6 opacity-[0.07] text-white -rotate-12 pointer-events-none">
                            <MdReceipt size={110} />
                        </div>
                        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 opacity-[0.04] text-white pointer-events-none">
                            <div className="w-44 h-44 rounded-full border-[18px] border-current" />
                        </div>

                        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            {/* Left */}
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                    Invoices    
                                </h2>
                                <p className="text-slate-400 text-sm">View and manage your receipts & invoices.</p>
                            </div>

                            {/* Right — Stats */}
                            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
                                {[
                                    { label: 'Paid', value: `₱${paidAmount.toLocaleString('en-PH')}`, sub: 'Settled', icon: MdCheckCircle, color: 'bg-emerald-400/20 text-emerald-300' },
                                    { label: 'Invoices', value: paidCount.toLocaleString('en-PH'), sub: 'Paid only', icon: MdReceipt, color: 'bg-amber-400/20 text-amber-300' },
                                    { label: 'Total', value: `₱${totalAmount.toLocaleString('en-PH')}`, sub: `${invoices.length} Invoices`, icon: MdReceipt, color: 'bg-blue-400/20 text-blue-300' },
                                ].map(({ label, value, sub, icon: Icon, color }) => (
                                    <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/15 transition-all">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
                                            <Icon size={20} className={color.split(' ')[1]} />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-[10px] font-medium">{label}</p>
                                            <p className="text-white text-base font-bold leading-tight">{value}</p>
                                            <p className="text-slate-500 text-[10px]">{sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Download Button */}
                    <div className="flex justify-end mb-6">
                        <button 
                            onClick={() => exportInvoiceToPDF(invoice)}
                            className="flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                            <MdPictureAsPdf size={18} /> Download PDF
                        </button>
                    </div>

                    {/* Invoice List + Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Invoice List */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Invoice</h3>
                                <span className="text-[10px] font-bold text-blue-500 uppercase px-2 py-0.5 bg-blue-50 rounded-full">{invoices.length} Total</span>
                            </div>
                            <div className="space-y-3 max-h-[calc(100vh-400px)] lg:max-h-[800px] overflow-y-auto pr-2 scrollbar-hide">
                                {invoices.map((inv, i) => {
                                    const invSubtotal = inv.items.reduce((sum, item) => sum + item.qty * (item.unitPrice + (item.addOnPrice || 0)), 0)
                                    const isActive = i === selectedIdx
                                    return (
                                        <button
                                            key={inv.id}
                                            onClick={() => setSelectedIdx(i)}
                                            className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer
                                        ${isActive
                                                    ? 'border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-500/5'
                                                    : 'border-white bg-white hover:border-gray-100 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{inv.referenceId || 'N/A'}</span>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 uppercase tracking-wider ${statusStyle(inv.status)}`}>
                                                    {statusIcon(inv.status)}
                                                    {inv.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-800 truncate mb-1">{inv.orderItem}</p>
                                            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isActive ? 'border-blue-100' : 'border-gray-50'}`}>
                                                <span className="text-[10px] text-gray-400 font-medium">{inv.date}</span>
                                                <span className={`text-base font-black leading-none ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>₱{invSubtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Invoice Preview */}
                        <div className="lg:col-span-3">
                            {invoice ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500"></div>
                                    <div className="p-4 sm:p-8 lg:p-10">
                                        {/* Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
                                            <div className="flex flex-col xs:flex-row items-center xs:items-start text-center xs:text-left gap-4 sm:gap-6">
                                                <img src={img.jjslogo1} alt="Logo" className="w-16 sm:w-20 shrink-0" />
                                                <div className="min-w-0 text-center xs:text-left">
                                                    <h3 className="text-base sm:text-lg font-bold text-gray-800">JJS Track</h3>
                                                    <p className="text-xs text-gray-400">Jennoel-Jennyl SportsweaR</p>
                                                    <p className="text-xs text-gray-400 flex items-center justify-center xs:justify-start gap-1 mt-1"><MdLocationOn size={12} className="shrink-0" />Purok 3B National Highway, Calapacuan, Subic</p>
                                                    <p className="text-xs text-gray-400 flex items-center justify-center xs:justify-start gap-1"><MdPhone size={12} className="shrink-0" /> 0908 997 2332</p>
                                                    <span className="text-xs text-blue-500 flex items-center justify-center xs:justify-start gap-1 mt-0.5"><MdEmail size={12} className="shrink-0" />jjsportswearph@gmail.com</span>
                                                </div>
                                            </div>
                                            <div className="text-center sm:text-right flex-shrink-0">
                                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 tracking-wide uppercase leading-none">Invoice</h2>
                                                <div className="mt-3 space-y-1 text-[11px] sm:text-sm">
                                                    <div className="flex justify-center sm:justify-end gap-3 leading-tight">
                                                        <span className="text-gray-400 min-w-[70px]">Booking ID:</span>
                                                        <span className="text-gray-700 font-bold font-mono">{invoice.referenceId || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-center sm:justify-end gap-3 leading-tight">
                                                        <span className="text-gray-400 min-w-[70px]">Date:</span>
                                                        <span className="text-gray-700">{invoice.date}</span>
                                                    </div>
                                                    <div className="flex justify-center sm:justify-end gap-3 leading-tight">
                                                        <span className="text-gray-400 min-w-[70px]">Due Date:</span>
                                                        <span className="text-gray-700">{invoice.dueDate}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] px-3 py-1 rounded-full font-bold tracking-tight ${statusStyle(invoice.status)}`}>
                                                        {statusIcon(invoice.status)}
                                                        {invoice.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bill To + QR */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
                                            <div className="bg-gray-50/70 rounded-xl p-4">
                                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Bill To</p>
                                                <p className="text-sm font-semibold text-gray-800">{invoice.billTo.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{invoice.billTo.address}</p>
                                                <p className="text-xs text-gray-500">{invoice.billTo.city}</p>
                                                <p className="text-xs text-gray-500 mt-1.5">{invoice.billTo.phone}</p>
                                                <p className="text-xs text-blue-500">{invoice.billTo.email}</p>
                                            </div>
                                            <div className="bg-gray-50/70 rounded-xl p-4 flex flex-col items-center justify-center">
                                                <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-1">
                                                    <img src={img.qrcode} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                                                </div>
                                                <p className="text-xs font-mono text-gray-500 mt-2">{invoice.referenceId || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Table - Desktop */}
                                        <div className="hidden sm:block overflow-x-auto mb-8">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-[#0F172A] text-white text-xs">
                                                        <th className="py-3 px-4 text-left rounded-l-lg font-medium w-10">#</th>
                                                        <th className="py-3 px-4 text-left font-medium">Service Description</th>
                                                        <th className="py-3 px-4 text-center font-medium">Type</th>
                                                        <th className="py-3 px-4 text-center font-medium">Qty</th>
                                                        <th className="py-3 px-4 text-right font-medium">Unit Price</th>
                                                        <th className="py-3 px-4 text-right rounded-r-lg font-medium">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoice.items.map((item, i) => (
                                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-3.5 px-4 text-gray-400 text-xs">{i + 1}</td>
                                                            <td className="py-3.5 px-4">
                                                                <div className="font-medium text-gray-800">{item.description}</div>
                                                                {item.size && <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Size: {item.size}</div>}
                                                                {item.addOn && item.addOn !== 'None' && (
                                                                    <div className="text-[10px] text-blue-500 font-bold uppercase mt-0.5">{item.addOn}</div>
                                                                )}
                                                                {item.notes && <div className="text-[10px] text-gray-500 mt-1">{item.notes}</div>}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center">{typeBadge(item.type)}</td>
                                                            <td className="py-3.5 px-4 text-center text-gray-600">{item.qty}</td>
                                                            <td className="py-3.5 px-4 text-right text-gray-600">
                                                                <div>₱ {item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                                                                {item.addOnPrice > 0 && <div className="text-[10px] text-gray-400">+₱ {item.addOnPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-right font-semibold text-gray-800">₱ {(item.qty * (item.unitPrice + (item.addOnPrice || 0))).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Items - Mobile */}
                                        <div className="sm:hidden space-y-4 mb-8">
                                            <p className="text-xs text-gray-400 uppercase tracking-[0.1em] font-extrabold mb-4">Invoice Items</p>
                                            {invoice.items.map((item, i) => (
                                                <div key={i} className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5 shadow-sm">
                                                    <div className="flex items-start justify-between gap-3 mb-4">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-base font-bold text-gray-800 leading-tight mb-1">{item.description}</p>
                                                            <div className="flex flex-wrap gap-2 items-center mb-2">
                                                                {typeBadge(item.type)}
                                                                {item.size && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold uppercase">Size: {item.size}</span>}
                                                            </div>
                                                            {item.addOn && item.addOn !== 'None' && (
                                                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-wider">{item.addOn}</p>
                                                            )}
                                                            {item.notes && (
                                                                <p className="text-[10px] text-gray-500 mt-1">{item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-end justify-between pt-3 border-t border-gray-100/50">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Unit Price</span>
                                                            <span className="text-sm font-semibold text-gray-600">
                                                                ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                {item.addOnPrice > 0 && <span className="text-[10px] text-gray-400 block">+₱{item.addOnPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</span>
                                                            <span className="text-lg font-black text-gray-900 leading-none">₱{(item.qty * (item.unitPrice + (item.addOnPrice || 0))).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Totals */}
                                        <div className="flex justify-end mb-6 sm:mb-10 pt-6 border-t border-gray-100 sm:border-0 sm:pt-0">
                                            <div className="w-full sm:w-72 space-y-2.5 text-sm">
                                                {tax > 0 && (
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-gray-400 font-medium">Tax</span>
                                                        <span className="text-gray-700 font-bold">₱{tax.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                {discount > 0 && (
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-gray-400 font-medium">{invoice.discount.label}</span>
                                                        <span className="text-green-600 font-bold">-₱{discount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                <div className="bg-[#0F172A] rounded-2xl p-4 sm:p-5 mt-4 flex justify-between items-center shadow-lg">
                                                    <span className="text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Amount</span>
                                                    <span className="text-xl sm:text-2xl font-black text-white">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-6 border-t border-gray-100">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 mb-1">Thank you for your business!</p>
                                                    <p className="text-[11px] text-gray-400 max-w-sm leading-relaxed">
                                                        Payment is due within 14 days. Late payments are subject to a 1.5% monthly fee. Please include invoice number on your check.
                                                    </p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xs font-semibold text-gray-600">JJS Track</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        <span className="text-blue-500">jjsportswearph@gmail.com</span>
                                                        {' · '}
                                                        <span className="text-gray-500">0908 997 2332</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24 h-96 flex items-center justify-center">
                                    <p className="text-gray-400">Select an invoice to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}

export default Invoices
