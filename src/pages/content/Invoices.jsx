import React, { useState } from 'react'
import HomeSidebar from '../../components/HomeSidebar'
import HomeNavbar from '../../components/HomeNavbar'
import { MdPictureAsPdf, MdEmail, MdPhone, MdLocationOn, MdReceipt, MdCheckCircle, MdAccessTime } from 'react-icons/md'
import { mockOrders } from '../../data/mockData'
import qrcode from '../../assets/qrcode.png'
import logo from '../../assets/jjslogo1.png'
import { useParams } from 'react-router-dom'

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

const Invoices = () => {
    const { id } = useParams()
    const [collapsed, setCollapsed] = useState(true)

    const invoices = mockOrders.map((order) => ({
        ...order.invoice,
        orderId: order.id,
        orderItem: order.item,
        players: order.players,
    }))

    const [selectedIdx, setSelectedIdx] = useState(0)

    // Sync selectedIdx if ID param is present
    React.useEffect(() => {
        if (id) {
            const idx = invoices.findIndex(inv => inv.id === id)
            if (idx !== -1) {
                setSelectedIdx(idx)
            }
        }
    }, [id, invoices])

    const invoice = invoices[selectedIdx]

    const subtotal = invoice.items.reduce((sum, item) => {
        const itemBaseTotal = item.qty * item.unitPrice
        const addOnTotal = (item.addOnPrice || 0) * item.qty
        return sum + itemBaseTotal + addOnTotal
    }, 0)
    const tax = invoice.taxRate ? subtotal * invoice.taxRate : 0
    const discount = invoice.discount?.amount || 0
    const total = subtotal + tax - discount

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <HomeSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-0 sm:ml-[70px]' : 'ml-0 sm:ml-[240px]'}`}>
                <HomeNavbar collapsed={collapsed} setCollapsed={setCollapsed} />
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div>
                            <h2 className="text-2xl sm:text-2xl font-bold text-gray-800">Receipts & Invoices</h2>
                            <p className="text-sm text-gray-400 mt-0.5 font-medium">View and print official documents</p>
                        </div>
                        <button className="flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full sm:w-auto">
                            <MdPictureAsPdf size={18} /> Download PDF
                        </button>
                    </div>
                    {/* Stat Summary */}
                    {/* dito pre mainam kung kada change ng invoice card mag uupdate din yung total balance paid amount at overdue amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-5 flex items-start justify-between shadow-sm border border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Paid Amount</p>
                                <p className="text-2xl font-black text-emerald-600">₱{invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.qty * (item.unitPrice + (item.addOnPrice || 0)), 0), 0).toLocaleString('en-PH')}</p>
                                <p className="text-[10px] text-emerald-500 mt-1 font-bold uppercase tracking-wider">Settled</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                <MdCheckCircle size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 flex items-start justify-between shadow-sm border border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Balance</p>
                                <p className="text-2xl font-black text-amber-500">₱{invoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.qty * (item.unitPrice + (item.addOnPrice || 0)), 0), 0).toLocaleString('en-PH')}</p>
                                <p className="text-[10px] text-amber-500 mt-1 font-bold uppercase tracking-wider">Outstanding</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100/50">
                                <MdAccessTime size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 flex items-start justify-between shadow-sm border border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
                                <p className="text-2xl font-black text-gray-800">₱{invoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.qty * (item.unitPrice + (item.addOnPrice || 0)), 0), 0).toLocaleString('en-PH')}</p>
                                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">{invoices.length} Invoices</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100/50">
                                <MdReceipt size={24} />
                            </div>
                        </div>
                    </div>

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
                                            className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer group
                                                ${isActive
                                                    ? 'border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-500/5'
                                                    : 'border-white bg-white hover:border-gray-100 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{inv.id}</span>
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500"></div>

                                <div className="p-4 sm:p-8 lg:p-10">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
                                        <div className="flex flex-col xs:flex-row items-center xs:items-start text-center xs:text-left gap-4 sm:gap-6">
                                            <img src={logo} alt="Logo" className="w-16 sm:w-20 shrink-0" />
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
                                                    <span className="text-gray-400 min-w-[70px]">Invoice #:</span>
                                                    <span className="text-gray-700 font-bold font-mono">{invoice.id}</span>
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

                                    {/* Payment Info */}
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
                                                <img src={qrcode} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                                            </div>
                                            <p className="text-xs font-mono text-gray-500 mt-2">{invoice.id}</p>
                                        </div>
                                    </div>
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
                                    <div className="sm:hidden space-y-4 mb-8">
                                        <p className="text-xs text-gray-400 uppercase tracking-[0.1em] font-extrabold mb-4">Invoice Items</p>
                                        {invoice.items.map((item, i) => (
                                            <div key={i} className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5 shadow-sm shadow-gray-200/20">
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
                                                    </div>
                                                </div>
                                                <div className="flex items-end justify-between pt-3 border-t border-gray-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Unit Price</span>
                                                        <span className="text-sm font-semibold text-gray-600">
                                                            ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                            {item.addOnPrice > 0 && <span className="text-[10px] text-gray-400 block ml-0">+₱{item.addOnPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>}
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
                                            <div className="bg-[#0F172A] rounded-2xl p-4 sm:p-5 mt-4 flex justify-between items-center shadow-lg shadow-blue-900/10">
                                                <span className="text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Amount</span>
                                                <span className="text-xl sm:text-2xl font-black text-white">
                                                    ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
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
                        </div>
                    </div>
                </main>
            </div >
        </div >
    )
}

export default Invoices
