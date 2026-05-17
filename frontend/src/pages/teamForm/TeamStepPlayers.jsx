import React, { useEffect, useState } from 'react'
import { MdPersonAdd, MdEdit, MdDelete, MdCheck, MdClose, MdStraighten, MdFullscreen, MdFullscreenExit } from 'react-icons/md'
import {Minimize2, Maximize2, X} from 'lucide-react'
import { FaTshirt } from 'react-icons/fa'
import img from '../../assets/img'

const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const SHORT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

const BASE_PRODUCT_TYPES = [
    { id: 'jersey', label: 'Jersey Only', price: 550, needsShortSize: false },
    { id: 'fullset', label: 'Full Set (Jersey + Shorts)', price: 850, needsShortSize: true },
]

const OPTIONAL_PRODUCT_TYPES = [
    { id: 'warmer', label: 'Long Sleeve Warmer', price: 750 },
    { id: 'hoodie', label: 'Hoodie T-shirt', price: 700 },
]

const POCKET_PRICE = 100

const emptyPlayer = { surname: '', nickname: '', number: '', productType: '', jerseySize: '', shortSize: '', pockets: false, addOns: [],
    // Manual sizing fields
    useManualjerseySize: false, useManualsShortSize: false,
    jerseyLength: '', jerseyBody: '', shortHips: '', shortLength: ''
}

const getPlayerPrice = (player) => {
    const product = BASE_PRODUCT_TYPES.find((p) => p.id === player.productType)
    if (!product) return 0

    let total = product.price
    if (player.pockets && product.needsShortSize) total += POCKET_PRICE
    
    // Add optional add-ons pricing
    if (player.addOns && Array.isArray(player.addOns)) {
        player.addOns.forEach(addOnId => {
            const addOn = OPTIONAL_PRODUCT_TYPES.find((p) => p.id === addOnId)
            if (addOn) total += addOn.price
        })
    }
    
    return total
}

const getAddOnLabels = (player) =>
    OPTIONAL_PRODUCT_TYPES
        .filter((p) => (Array.isArray(player.addOns) ? player.addOns.includes(p.id) : false))
        .map((p) => p.label)

const SizeReferencePanel = ({ onClose }) => {
    const [zoomed, setZoomed] = useState(false)
    const charts = [
        { label: 'Jersey / Top', src: img.sctop1, alt: 'Jersey and top size chart' },
        { label: 'Shorts / Bottom', src: img.scbot, alt: 'Shorts and bottom size chart' },
    ]

    return (
    <>
        <aside className="bg-white border border-blue-100 rounded-2xl p-4 shadow-lg shadow-blue-100/60 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70">Size Reference</p>
                    <p className="text-xs text-gray-500 mt-1">Use these charts before selecting sizes.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {charts.map((chart) => (
                    <figure key={chart.label}>
                        <figcaption className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{chart.label}</figcaption>
                        <img src={chart.src} alt={chart.alt} className="w-full max-h-72 object-contain rounded-xl border border-gray-100 bg-gray-50" />
                    </figure>
                ))}
            </div>
        </aside>

        {zoomed && (
            <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-y-auto p-4 sm:p-6">
                    <button
                        type="button"
                        onClick={() => setZoomed(false)}
                        className="sticky top-0 ml-auto mb-3 w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
                        aria-label="Exit fullscreen size reference"
                    >
                        <Minimize2 size={20} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {charts.map((chart) => (
                            <figure key={chart.label}>
                                <figcaption className="text-xs font-bold uppercase tracking-wider text-blue-600/70 mb-2">{chart.label}</figcaption>
                                <img src={chart.src} alt={chart.alt} className="w-full max-h-[78vh] object-contain rounded-xl border border-gray-200 bg-gray-50" />
                            </figure>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </>
    )
}

const getSizeText = (player, type) => {
    if (type === 'jersey') {
        return player.useManualjerseySize
            ? `${player.jerseyLength || '-'}" x ${player.jerseyBody || '-'}"`
            : (player.jerseySize || 'N/A')
    }

    return player.useManualsShortSize
        ? `${player.shortHips || '-'}" x ${player.shortLength || '-'}"`
        : (player.shortSize || 'N/A')
}

const getPlayerDisplayName = (player, index) => (
    [player.surname || '', player.nickname ? `(${player.nickname})` : ''].filter(Boolean).join(' ') || `Player ${index + 1}`
)

const LineupRoster = ({ teamName, contact, players, onEdit, onRemove }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="text-center text-xl font-extrabold tracking-wide text-gray-900">JJS SPORTSWEAR</h3>
            <p className="text-center text-[11px] text-gray-500 mt-1">CONTACT: 0908 997 2332</p>
            <p className="text-center text-[11px] text-gray-500">Purok 3B National Highway, Calapacuan, Subic, Zambales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                <div className="flex items-end gap-2">
                    <span className="font-bold shrink-0">TEAM NAME:</span>
                    <span className="border-b border-gray-300 flex-1 px-2 py-0.5 uppercase">{teamName || 'N/A'}</span>
                </div>
                <div className="flex items-end gap-2">
                    <span className="font-bold shrink-0">CONTACT:</span>
                    <span className="border-b border-gray-300 flex-1 px-2 py-0.5">{contact?.phone || contact?.phoneNumber || contact?.fullName || 'N/A'}</span>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[12px] text-gray-900">
                <thead>
                    <tr className="bg-gray-50">
                        {['NO.', 'FULL NAME', 'NUMBER', 'JERSEY SIZE', 'SHORT SIZE', 'ADD-ONS', 'POCKETS', ''].map((header) => (
                            <th key={header} className="border border-gray-300 px-2 py-2 text-center font-extrabold">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {players.map((pl, i) => {
                        const addOnLabels = getAddOnLabels(pl)
                        return (
                            <tr key={i} className="hover:bg-blue-50/50">
                                <td className="border border-gray-300 px-2 py-2 text-center">{i + 1}.</td>
                                <td className="border border-gray-300 px-2 py-2 font-semibold uppercase">{getPlayerDisplayName(pl, i)}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{pl.number || 'N/A'}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{getSizeText(pl, 'jersey')}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{getSizeText(pl, 'short')}</td>
                                <td className="border border-gray-300 px-2 py-2">{addOnLabels.length > 0 ? addOnLabels.join(', ') : 'None'}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{pl.pockets ? 'YES' : 'NO'}</td>
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

const TeamStepPlayers = ({ teamName, setTeamName, players, setPlayers, contact = {}, onSizeGuideChange }) => {
    const [form, setForm] = useState({ ...emptyPlayer })
    const [editIdx, setEditIdx] = useState(null)
    const [showSizeGuide, setShowSizeGuide] = useState(false)
    const [rosterView, setRosterView] = useState('list')

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
    
    const toggleAddOn = (addOnId) => {
        setForm((p) => {
            const currentAddOns = p.addOns || []
            return {
                ...p,
                addOns: currentAddOns.includes(addOnId)
                    ? currentAddOns.filter((id) => id !== addOnId)
                    : [...currentAddOns, addOnId]
            }
        })
    }

    const selectedProduct = BASE_PRODUCT_TYPES.find((p) => p.id === form.productType)
    const needsShortSize = selectedProduct?.needsShortSize || false

    // Check if jersey size is valid (either preset or manual)
    const jerseyValid = form.useManualjerseySize ? (form.jerseyLength && form.jerseyBody) : form.jerseySize
    // Check if short size is valid (either preset or manual, if needed)
    const shortValid = !needsShortSize ? true : (form.useManualsShortSize ? (form.shortHips && form.shortLength) : form.shortSize)

    const canAdd = form.surname && form.number && form.productType && jerseyValid && shortValid

    const addOrUpdate = () => {
        if (!canAdd) return

        const nextPlayer = {
            ...form,
            addOns: Array.isArray(form.addOns) ? form.addOns : [],
            shortSize: needsShortSize ? form.shortSize : '',
            pockets: needsShortSize ? form.pockets : false,
        }

        if (editIdx !== null) {
            setPlayers((p) => p.map((pl, i) => (i === editIdx ? nextPlayer : pl)))
            setEditIdx(null)
        } else {
            setPlayers((p) => [...p, nextPlayer])
        }
        setForm({ ...emptyPlayer })
    }

    const startEdit = (i) => {
        setForm({
            ...emptyPlayer,
            ...players[i],
            addOns: Array.isArray(players[i]?.addOns) ? players[i].addOns : [],
        })
        setEditIdx(i)
    }

    const cancelEdit = () => {
        setEditIdx(null)
        setForm({ ...emptyPlayer })
    }

    const remove = (i) => {
        setPlayers((p) => p.filter((_, idx) => idx !== i))
        if (editIdx === i) {
            setEditIdx(null)
            setForm({ ...emptyPlayer })
        }
    }

    const grandTotal = players.reduce((sum, pl) => sum + getPlayerPrice(pl), 0)
    const contentWidthClass = showSizeGuide ? 'max-w-7xl' : 'max-w-xl'

    useEffect(() => {
        onSizeGuideChange?.(showSizeGuide)
    }, [showSizeGuide, onSizeGuideChange])

    return (
        <section>
            <div className={`${contentWidthClass} mx-auto text-center mb-10 font-inter transition-all duration-300`}>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Team & Players</h2>
                <p className="text-gray-500 mt-2 text-sm">Set up your team and add players</p>
            </div>

            <div className={`${contentWidthClass} mx-auto mb-8 transition-all duration-300`}>
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70 mb-2 block">Team Name</label>
                <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Team One"
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
                />
            </div>

            <div className={`${showSizeGuide ? 'max-w-7xl' : 'max-w-xl'} mx-auto mb-6`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FaTshirt size={14} className="text-blue-500/70" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {editIdx !== null ? 'Edit Player' : 'Add Player'}
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
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Surname <span className="text-red-400">*</span></label>
                            <input value={form.surname} onChange={(e) => set('surname', e.target.value)} placeholder="Surname"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Nickname <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <input value={form.nickname} onChange={(e) => set('nickname', e.target.value)} placeholder="Nickname"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all " />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Number <span className="text-red-400">*</span></label>
                            <input type="number" value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="7"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all " />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60 mb-2 block">Product Type <span className="text-red-400">*</span></label>
                            <p className="text-xs text-gray-500 mb-2">Choose one main package:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {BASE_PRODUCT_TYPES.map((pt) => {
                                    const selected = form.productType === pt.id
                                    return (
                                        <button
                                            key={pt.id}
                                            type="button"
                                            onClick={() => {
                                                set('productType', pt.id)
                                                if (!pt.needsShortSize) {
                                                    set('shortSize', '')
                                                    set('pockets', false)
                                                }
                                            }}
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

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Optional add-ons</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {OPTIONAL_PRODUCT_TYPES.map((pt) => {
                                    const selected = form.addOns && form.addOns.includes(pt.id)
                                    return (
                                        <button
                                            key={pt.id}
                                            type="button"
                                            onClick={() => toggleAddOn(pt.id)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                                                ${selected
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-all
                                                    ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                    {selected && <MdCheck size={12} className="text-white" />}
                                                </span>
                                                <span className={`text-sm font-medium ${selected ? 'text-gray-800' : 'text-gray-600'}`}>{pt.label}</span>
                                            </div>
                                            <span className={`text-sm font-bold tabular-nums ${selected ? 'text-blue-600' : 'text-gray-400'}`}>₱{pt.price}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">You can select none, one, or both add-ons.</p>
                        </div>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => setShowSizeGuide((value) => !value)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                            <MdStraighten size={15} />
                            {showSizeGuide ? 'Hide sizes' : 'View sizes'}
                        </button>
                    </div>

                    {/* Jersey Size Options */}
                    <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Jersey Size <span className="text-red-400">*</span></label>
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    type="button"
                                    onClick={() => set('useManualjerseySize', false)}
                                    className={`px-2.5 py-1 text-xs rounded font-semibold transition-all ${!form.useManualjerseySize ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Preset
                                </button>
                                <button
                                    type="button"
                                    onClick={() => set('useManualjerseySize', true)}
                                    className={`px-2.5 py-1 text-xs rounded font-semibold transition-all ${form.useManualjerseySize ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Manual (in)
                                </button>
                            </div>
                        </div>
                        {form.useManualjerseySize ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Length (inches)</label>
                                    <input type="number" value={form.jerseyLength} onChange={(e) => set('jerseyLength', e.target.value)} placeholder="28"
                                        step="0.5"
                                        className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Body/Chest (inches)</label>
                                    <input type="number" value={form.jerseyBody} onChange={(e) => set('jerseyBody', e.target.value)} placeholder="40"
                                        step="0.5"
                                        className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                                </div>
                            </div>
                        ) : (
                            <select
                                value={form.jerseySize}
                                onChange={(e) => set('jerseySize', e.target.value)}
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Select</option>
                                {JERSEY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Short Size Options */}
                    {needsShortSize && (
                        <div className="flex flex-col gap-3 pt-1">
                            <div className="flex items-center gap-3">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Short Size <span className="text-red-400">*</span></label>
                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => set('useManualsShortSize', false)}
                                        className={`px-2.5 py-1 text-xs rounded font-semibold transition-all ${!form.useManualsShortSize ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Preset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => set('useManualsShortSize', true)}
                                        className={`px-2.5 py-1 text-xs rounded font-semibold transition-all ${form.useManualsShortSize ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Manual (in)
                                    </button>
                                </div>
                            </div>
                            {form.useManualsShortSize ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Hips (inches)</label>
                                        <input type="number" value={form.shortHips} onChange={(e) => set('shortHips', e.target.value)} placeholder="36"
                                            step="0.5"
                                            className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Length (inches)</label>
                                        <input type="number" value={form.shortLength} onChange={(e) => set('shortLength', e.target.value)} placeholder="20"
                                            step="0.5"
                                            className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                                    </div>
                                </div>
                            ) : (
                                <select
                                    value={form.shortSize}
                                    onChange={(e) => set('shortSize', e.target.value)}
                                    className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select</option>
                                    {SHORT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                        </div>
                    )}

                    {needsShortSize && (
                        <label className="flex items-center gap-2.5 cursor-pointer group pt-1">
                            <span className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center transition-all duration-200
                                ${form.pockets ? 'bg-blue-600 shadow-sm shadow-blue-600/40' : 'border-2 border-gray-300 group-hover:border-gray-400'}`}>
                                {form.pockets && <MdCheck size={13} className="text-white" />}
                            </span>
                            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                                Shorts with Pockets <span className="text-blue-500 font-semibold">(+₱{POCKET_PRICE})</span>
                            </span>
                            <input type="checkbox" className="hidden" checked={form.pockets} onChange={(e) => set('pockets', e.target.checked)} />
                        </label>
                    )}

                    {form.productType && (
                        <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-4 py-3 mt-1">
                            <span className="text-xs text-gray-500 font-medium">Player Price</span>
                            <span className="text-blue-600 font-extrabold text-lg tabular-nums">₱{getPlayerPrice(form)}</span>
                        </div>
                    )}

                    <button
                        onClick={addOrUpdate}
                        disabled={!canAdd}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer mt-2
                            ${canAdd
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                        <MdPersonAdd size={18} />
                        {editIdx !== null ? 'Update Player' : 'Add Player'}
                    </button>
                </div>
                {showSizeGuide && <SizeReferencePanel onClose={() => setShowSizeGuide(false)} />}
                </div>
            </div>

            {players.length > 0 && (
                <div className={`${contentWidthClass} mx-auto mb-6 transition-all duration-300`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Roster ({players.length} player{players.length > 1 ? 's' : ''})
                        </span>
                        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                            {[
                                ['list', 'List'],
                                ['lineup', 'Lineup Form'],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRosterView(value)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${rosterView === value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {rosterView === 'lineup' ? (
                        <LineupRoster teamName={teamName} contact={contact} players={players} onEdit={startEdit} onRemove={remove} />
                    ) : (
                    <div className="space-y-2">
                        {players.map((pl, i) => {
                            const product = BASE_PRODUCT_TYPES.find((p) => p.id === pl.productType)
                            const addOnLabels = getAddOnLabels(pl)
                            const price = getPlayerPrice(pl)
                            return (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <span className="w-10 h-10 rounded-lg bg-blue-50 text-black font-extrabold text-sm flex items-center justify-center shrink-0">
                                                {pl.number}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-gray-800 font-semibold text-sm truncate">
                                                    {getPlayerDisplayName(pl, i)}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-0.5">
                                                    {product?.label || '—'} · Jersey: {pl.useManualjerseySize ? `${pl.jerseyLength}"×${pl.jerseyBody}"` : (pl.jerseySize || '—')}
                                                    {product?.needsShortSize && ` · Short: ${pl.useManualsShortSize ? `${pl.shortHips}"×${pl.shortLength}"` : (pl.shortSize || '—')}`}
                                                    {addOnLabels.length > 0 && ` · ${addOnLabels.join(', ')}`}
                                                    {pl.pockets && ' · Pockets'}
                                                    {pl.addOns && pl.addOns.length > 0 && ` · ${pl.addOns.map(id => {
                                                        const addon = OPTIONAL_PRODUCT_TYPES.find(p => p.id === id)
                                                        return addon?.label
                                                    }).join(', ')}`}
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

            {players.length === 0 && (
                <div className={`${contentWidthClass} mx-auto text-center py-8 transition-all duration-300`}>
                    <FaTshirt size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No players added yet. Add your first player above.</p>
                </div>
            )}

            {players.length > 0 && (
                <div className={`${contentWidthClass} mx-auto transition-all duration-300`}>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600/80 mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
                            Order Summary
                        </h4>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Number of Players</span>
                                <span className="text-gray-800 font-semibold">{players.length}</span>
                            </div>
                            {BASE_PRODUCT_TYPES.map((pt) => {
                                const count = players.filter((p) => p.productType === pt.id).length
                                if (count === 0) return null
                                return (
                                    <div key={pt.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{pt.label} × {count}</span>
                                        <span className="text-gray-700 font-medium tabular-nums">₱{pt.price * count}</span>
                                    </div>
                                )
                            })}
                            {OPTIONAL_PRODUCT_TYPES.map((pt) => {
                                const count = players.filter((p) => Array.isArray(p.addOns) && p.addOns.includes(pt.id)).length
                                if (count === 0) return null
                                return (
                                    <div key={pt.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{pt.label} × {count}</span>
                                        <span className="text-gray-700 font-medium tabular-nums">₱{pt.price * count}</span>
                                    </div>
                                )
                            })}
                            {players.some((p) => p.pockets) && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Pockets Add-on × {players.filter((p) => p.pockets).length}</span>
                                    <span className="text-gray-700 font-medium tabular-nums">₱{POCKET_PRICE * players.filter((p) => p.pockets).length}</span>
                                </div>
                            )}
                            {OPTIONAL_PRODUCT_TYPES.map((pt) => {
                                const count = players.reduce((sum, p) => sum + (p.addOns && p.addOns.includes(pt.id) ? 1 : 0), 0)
                                if (count === 0) return null
                                return (
                                    <div key={pt.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{pt.label} × {count}</span>
                                        <span className="text-gray-700 font-medium tabular-nums">₱{pt.price * count}</span>
                                    </div>
                                )
                            })}
                            <div className="border-t border-blue-200 pt-3 mt-3 flex items-center justify-between">
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

export default TeamStepPlayers
