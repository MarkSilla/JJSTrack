import React, { useEffect, useState } from 'react'
import { MdPersonAdd, MdEdit, MdDelete, MdCheck, MdClose, MdStraighten, MdFullscreen, MdFullscreenExit } from 'react-icons/md'
import {Minimize2, Maximize2, X} from 'lucide-react'
import { MdBusiness } from 'react-icons/md'
import img from '../../assets/img'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

const PRODUCT_TYPES = [
    { id: 'tshirt', label: 'T-Shirt', price: 500 },
    { id: 'polo', label: 'Polo Shirt', price: 650 },
]

const emptyMember = {
    firstName: '', surname: '', number: '', productType: '', size: '',
    useManualSize: false,
    manualBody: '', manualLength: '', manualSleeveLength: ''
}

const getMemberPrice = (member) => {
    const product = PRODUCT_TYPES.find((p) => p.id === member.productType)
    return product ? product.price : 0
}

const SizeReferencePanel = ({ onClose }) => {
    const [zoomed, setZoomed] = useState(false)

    return (
    <>
        <aside className="bg-white border border-blue-100 rounded-2xl p-4 shadow-lg shadow-blue-100/60 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70">Size Reference</p>
                    <p className="text-xs text-gray-500 mt-1">Use these charts before selecting member sizes.</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setZoomed(true)}
                        className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                        aria-label="Zoom size reference"
                    >
                        <Maximize2 size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        aria-label="Hide size reference"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                <figure>
                    <figcaption className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Men's T-shirt / Polo</figcaption>
                    <img src={img.mtshirt} alt="Men Tshirt Size" className="w-full max-h-[32rem] object-contain rounded-xl border border-gray-100 bg-gray-50" />
                </figure>
                <figure>
                    <figcaption className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Women's T-shirt / Polo</figcaption>
                    <img src={img.wtshirt} alt="Women Tshirt Size" className="w-full max-h-[32rem] object-contain rounded-xl border border-gray-100 bg-gray-50" />
                </figure>
            </div>
        </aside>

        {zoomed && (
            <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto p-4 sm:p-6">
                    <button
                        type="button"
                        onClick={() => setZoomed(false)}
                        className="sticky top-0 ml-auto mb-3 w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
                        aria-label="Exit fullscreen size reference"
                    >
                        <Minimize2 size={20} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <figure>
                            <figcaption className="text-xs font-bold uppercase tracking-wider text-blue-600/70 mb-2">Men's T-shirt / Polo</figcaption>
                            <img src={img.mtshirt} alt="Men Top size chart" className="w-full max-h-[80vh] object-contain rounded-xl border border-gray-200 bg-gray-50" />
                        </figure>
                        <figure>
                            <figcaption className="text-xs font-bold uppercase tracking-wider text-blue-600/70 mb-2">Women's T-shirt / Polo</figcaption>
                            <img src={img.wtshirt} alt="Women Top size chart" className="w-full max-h-[80vh] object-contain rounded-xl border border-gray-200 bg-gray-50" />
                        </figure>
                    </div>
                </div>
            </div>
        )}
    </>
    )
}

const getSizeText = (member) => (
    member.useManualSize
        ? `${member.manualBody || '-'}" x ${member.manualLength || '-'}" x ${member.manualSleeveLength || '-'}"`
        : (member.size || 'N/A')
)

const LineupMembers = ({ orgName, contact, members, onEdit, onRemove }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="text-center text-xl font-extrabold tracking-wide text-gray-900">JJS SPORTSWEAR</h3>
            <p className="text-center text-[11px] text-gray-500 mt-1">CONTACT: 0908 997 2332</p>
            <p className="text-center text-[11px] text-gray-500">Purok 3B National Highway, Calapacuan, Subic, Zambales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                <div className="flex items-end gap-2">
                    <span className="font-bold shrink-0">ORGANIZATION:</span>
                    <span className="border-b border-gray-300 flex-1 px-2 py-0.5 uppercase">{orgName || 'N/A'}</span>
                </div>
                <div className="flex items-end gap-2">
                    <span className="font-bold shrink-0">CONTACT:</span>
                    <span className="border-b border-gray-300 flex-1 px-2 py-0.5">{contact?.phone || contact?.phoneNumber || contact?.fullName || 'N/A'}</span>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[12px] text-gray-900">
                <thead>
                    <tr className="bg-gray-50">
                        {['NO.', 'FULL NAME', 'NUMBER', 'PRODUCT', 'SIZE', ''].map((header) => (
                            <th key={header} className="border border-gray-300 px-2 py-2 text-center font-extrabold">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {members.map((member, i) => {
                        const product = PRODUCT_TYPES.find((p) => p.id === member.productType)
                        return (
                            <tr key={i} className="hover:bg-blue-50/50">
                                <td className="border border-gray-300 px-2 py-2 text-center">{i + 1}.</td>
                                <td className="border border-gray-300 px-2 py-2 font-semibold uppercase">{[member.firstName, member.surname].filter(Boolean).join(' ') || 'N/A'}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{member.number || 'N/A'}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{product?.label || 'N/A'}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{getSizeText(member)}</td>
                                <td className="border border-gray-300 px-2 py-2">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <button onClick={() => onEdit(i)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors cursor-pointer">
                                            <MdEdit size={13} />
                                        </button>
                                        <button onClick={() => onRemove(i)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors cursor-pointer">
                                            <MdDelete size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </div>
)

const OrgStepDetails = ({ orgName, setOrgName, members, setMembers, contact = {}, onSizeGuideChange }) => {
    const [form, setForm] = useState({ ...emptyMember })
    const [editIdx, setEditIdx] = useState(null)
    const [showSizeGuide, setShowSizeGuide] = useState(false)
    const [memberView, setMemberView] = useState('list')

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

    const sizeValid = form.useManualSize ? (form.manualBody && form.manualLength && form.manualSleeveLength) : form.size
    const canAdd = form.firstName && form.surname && form.productType && sizeValid

    const addOrUpdate = () => {
        if (!canAdd) return
        if (editIdx !== null) {
            setMembers((p) => p.map((m, i) => (i === editIdx ? { ...form } : m)))
            setEditIdx(null)
        } else {
            setMembers((p) => [...p, { ...form }])
        }
        setForm({ ...emptyMember })
    }

    const startEdit = (i) => {
        setForm({ ...members[i] })
        setEditIdx(i)
    }

    const cancelEdit = () => {
        setEditIdx(null)
        setForm({ ...emptyMember })
    }

    const remove = (i) => {
        setMembers((p) => p.filter((_, idx) => idx !== i))
        if (editIdx === i) { setEditIdx(null); setForm({ ...emptyMember }) }
    }

    const grandTotal = members.reduce((sum, m) => sum + getMemberPrice(m), 0)
    const contentWidthClass = showSizeGuide ? 'max-w-6xl' : 'max-w-xl'

    useEffect(() => {
        onSizeGuideChange?.(showSizeGuide)
    }, [showSizeGuide, onSizeGuideChange])

    return (
        <section>
            <div className={`${contentWidthClass} mx-auto text-center mb-10 font-inter transition-all duration-300`}>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Organizational Details</h2>
                <p className="text-gray-500 mt-2 text-sm">Set up your organization and add members</p>
            </div>
            <div className={`${contentWidthClass} mx-auto mb-8 transition-all duration-300`}>
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70 mb-2 block">Organization Name</label>
                <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Computer Science Department"
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
                />
            </div>

            {/* Add / Edit Form */}
            <div className={`${showSizeGuide ? 'max-w-6xl' : 'max-w-xl'} mx-auto mb-6`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MdBusiness size={14} className="text-blue-500/70" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {editIdx !== null ? 'Edit Member' : 'Add Member'}
                        </span>
                    </div>
                    {editIdx !== null && (
                        <button onClick={cancelEdit} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                            <MdClose size={14} /> Cancel
                        </button>
                    )}
                </div>

                <div className={`grid gap-5 ${showSizeGuide ? 'lg:grid-cols-[minmax(0,36rem)_minmax(24rem,28rem)]' : 'grid-cols-1'}`}>
                <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-5 space-y-4">
                    {/* Name & Number */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">First Name <span className="text-red-400">*</span></label>
                            <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Juan"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Surname <span className="text-red-400">*</span></label>
                            <input value={form.surname} onChange={(e) => set('surname', e.target.value)} placeholder="Dela Cruz"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Number <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input type="number" value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="—"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                        </div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Product Type */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Product Type <span className="text-red-400">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                            {PRODUCT_TYPES.map((pt) => {
                                const selected = form.productType === pt.id
                                return (
                                    <button
                                        key={pt.id}
                                        type="button"
                                        onClick={() => set('productType', pt.id)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                                            ${selected
                                                ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                                                : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    >
                                        <span className={`text-sm font-medium ${selected ? 'text-gray-800' : 'text-gray-600'}`}>{pt.label}</span>
                                        <span className={`text-sm font-bold tabular-nums ${selected ? 'text-blue-600' : 'text-gray-400'}`}>₱{pt.price}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Size */}
                    <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Size <span className="text-red-400">*</span></label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSizeGuide((value) => !value)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                                >
                                    <MdStraighten size={15} />
                                    {showSizeGuide ? 'Hide sizes' : 'View sizes'}
                                </button>
                                <div className="h-4 w-px bg-gray-200 mx-1" />
                                <button
                                    type="button"
                                    onClick={() => set('useManualSize', false)}
                                    className={`px-2.5 py-1 text-xs rounded font-semibold transition-all ${!form.useManualSize ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Preset
                                </button>
                                <button
                                    type="button"
                                    onClick={() => set('useManualSize', true)}
                                    className={`px-2.5 py-1 text-xs rounded font-semibold transition-all ${form.useManualSize ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Manual (in)
                                </button>
                            </div>
                        </div>
                        {form.useManualSize ? (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Body (inches)</label>
                                    <input type="number" value={form.manualBody} onChange={(e) => set('manualBody', e.target.value)} placeholder="40"
                                        step="0.5"
                                        className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Length (inches)</label>
                                    <input type="number" value={form.manualLength} onChange={(e) => set('manualLength', e.target.value)} placeholder="28"
                                        step="0.5"
                                        className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Sleeve (inches)</label>
                                    <input type="number" value={form.manualSleeveLength} onChange={(e) => set('manualSleeveLength', e.target.value)} placeholder="7"
                                        step="0.5"
                                        className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                                </div>
                            </div>
                        ) : (
                            <select value={form.size} onChange={(e) => set('size', e.target.value)}
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none cursor-pointer w-40">
                                <option value="">Select</option>
                                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Price preview */}
                    {form.productType && (
                        <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-4 py-3 mt-1">
                            <span className="text-xs text-gray-500 font-medium">Individual Price</span>
                            <span className="text-blue-600 font-extrabold text-lg tabular-nums">₱{getMemberPrice(form)}</span>
                        </div>
                    )}

                    {/* Add / Update Button */}
                    <button
                        onClick={addOrUpdate}
                        disabled={!canAdd}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer mt-2
                            ${canAdd
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                        <MdPersonAdd size={18} />
                        {editIdx !== null ? 'Update Member' : 'Add Member'}
                    </button>
                </div>
                {showSizeGuide && <SizeReferencePanel onClose={() => setShowSizeGuide(false)} />}
                </div>
            </div>

            {/* Member List */}
            {members.length > 0 && (
                <div className={`${contentWidthClass} mx-auto mb-6 transition-all duration-300`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Members ({members.length})
                        </span>
                        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                            {[
                                ['list', 'List'],
                                ['lineup', 'Lineup Form'],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setMemberView(value)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${memberView === value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {memberView === 'lineup' ? (
                        <LineupMembers orgName={orgName} contact={contact} members={members} onEdit={startEdit} onRemove={remove} />
                    ) : (
                    <div className="space-y-2">
                        {members.map((m, i) => {
                            const product = PRODUCT_TYPES.find((p) => p.id === m.productType)
                            const price = getMemberPrice(m)
                            return (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {m.number ? (
                                                <span className="w-10 h-10 rounded-lg bg-blue-50 text-black font-extrabold text-sm flex items-center justify-center shrink-0">
                                                    {m.number}
                                                </span>
                                            ) : (
                                                <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 font-extrabold text-sm flex items-center justify-center shrink-0">
                                                    <MdBusiness size={18} />
                                                </span>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-gray-800 font-semibold text-sm truncate">{[m.firstName, m.surname].filter(Boolean).join(' ')}</p>
                                                <p className="text-gray-400 text-xs mt-0.5">
                                                    {product?.label || '—'} · {getSizeText(m)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-blue-600 font-bold text-sm tabular-nums">₱{price}</span>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => startEdit(i)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors cursor-pointer">
                                                    <MdEdit size={14} />
                                                </button>
                                                <button onClick={() => remove(i)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors cursor-pointer">
                                                    <MdDelete size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    )}
                </div>
            )}

            {members.length === 0 && (
                <div className={`${contentWidthClass} mx-auto text-center py-8 transition-all duration-300`}>
                    <MdBusiness size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No members added yet. Add your first member above.</p>
                </div>
            )}

            {/* Order Summary */}
            {members.length > 0 && (
                <div className={`${contentWidthClass} mx-auto transition-all duration-300`}>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600/80 mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
                            Order Summary
                        </h4>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Number of Orders</span>
                                <span className="text-gray-800 font-semibold">{members.length}</span>
                            </div>
                            {PRODUCT_TYPES.map((pt) => {
                                const count = members.filter((m) => m.productType === pt.id).length
                                if (count === 0) return null
                                return (
                                    <div key={pt.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{pt.label} × {count}</span>
                                        <span className="text-gray-700 font-medium tabular-nums">₱{pt.price * count}</span>
                                    </div>
                                )
                            })}
                            <div className="border-t border-blue-200 pt-3 mt-3 flex items-center justify-between">
                                <span className="text-gray-500 text-sm">Subtotal</span>
                                <span className="text-gray-700 font-semibold tabular-nums">₱{grandTotal}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-800 font-bold text-sm">Grand Total</span>
                                <span className="text-blue-600 font-extrabold text-2xl tabular-nums">₱{grandTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default OrgStepDetails
