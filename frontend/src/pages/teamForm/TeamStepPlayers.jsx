import React, { useState } from 'react'
import { MdPersonAdd, MdEdit, MdDelete, MdCheck, MdClose } from 'react-icons/md'
import { FaTshirt } from 'react-icons/fa'

const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const SHORT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

const PRODUCT_TYPES = [
    { id: 'jersey', label: 'Jersey', price: 500, needsShortSize: false },
    { id: 'shorts', label: 'Shorts', price: 500, needsShortSize: true },
    { id: 'fullset', label: 'Full Set (Jersey + Shorts)', price: 850, needsShortSize: true },
    { id: 'warmer', label: 'Long Sleeve Warmer', price: 750, needsShortSize: false },
    { id: 'hoodie', label: 'Hoodie T-shirt', price: 700, needsShortSize: false },
]

const POCKET_PRICE = 100

const emptyPlayer = { surname: '', number: '', productType: '', jerseySize: '', shortSize: '', pockets: false }

const getPlayerPrice = (player) => {
    const product = PRODUCT_TYPES.find((p) => p.id === player.productType)
    if (!product) return 0
    let total = product.price
    if (player.pockets && product.needsShortSize) total += POCKET_PRICE
    return total
}

const TeamStepPlayers = ({ teamName, setTeamName, players, setPlayers }) => {
    const [form, setForm] = useState({ ...emptyPlayer })
    const [editIdx, setEditIdx] = useState(null)

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

    const selectedProduct = PRODUCT_TYPES.find((p) => p.id === form.productType)
    const needsShortSize = selectedProduct?.needsShortSize || false

    const canAdd = form.surname && form.number && form.productType && form.jerseySize && (!needsShortSize || form.shortSize)

    const addOrUpdate = () => {
        if (!canAdd) return
        if (editIdx !== null) {
            setPlayers((p) => p.map((pl, i) => (i === editIdx ? { ...form } : pl)))
            setEditIdx(null)
        } else {
            setPlayers((p) => [...p, { ...form }])
        }
        setForm({ ...emptyPlayer })
    }

    const startEdit = (i) => {
        setForm({ ...players[i] })
        setEditIdx(i)
    }

    const cancelEdit = () => {
        setEditIdx(null)
        setForm({ ...emptyPlayer })
    }

    const remove = (i) => {
        setPlayers((p) => p.filter((_, idx) => idx !== i))
        if (editIdx === i) { setEditIdx(null); setForm({ ...emptyPlayer }) }
    }

    const grandTotal = players.reduce((sum, pl) => sum + getPlayerPrice(pl), 0)

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Team & Players</h2>
                <p className="text-gray-500 mt-2 text-sm">Set up your team and add players</p>
            </div>

            {/* Team Name */}
            <div className="max-w-xl mx-auto mb-8">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70 mb-2 block">Team Name</label>
                <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Team One"
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
                />
            </div>

            {/* AddEdit Player Form */}
            <div className="max-w-xl mx-auto mb-6">
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

                <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-5 space-y-4">
                    {/* Name & Number */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Surname <span className="text-red-400">*</span></label>
                            <input value={form.surname} onChange={(e) => set('surname', e.target.value)} placeholder="Dela Cruz"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Jersey Number <span className="text-red-400">*</span></label>
                            <input type="number" value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="7"
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all " />
                        </div>
                    </div>


                    {/* Product Type */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Product Type <span className="text-red-400">*</span></label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PRODUCT_TYPES.map((pt) => {
                                const selected = form.productType === pt.id
                                return (
                                    <button
                                        key={pt.id}
                                        type="button"
                                        onClick={() => {
                                            set('productType', pt.id)
                                            if (!pt.needsShortSize) set('shortSize', '')
                                            if (!pt.needsShortSize) set('pockets', false)
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

                    {/* Sizes */}
                    <div className={`grid gap-4 ${needsShortSize ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Jersey Size <span className="text-red-400">*</span></label>
                            <select value={form.jerseySize} onChange={(e) => set('jerseySize', e.target.value)}
                                className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none cursor-pointer">
                                <option value="">Select</option>
                                {JERSEY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {needsShortSize && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60">Short Size <span className="text-red-400">*</span></label>
                                <select value={form.shortSize} onChange={(e) => set('shortSize', e.target.value)}
                                    className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                    {SHORT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Pockets toggle */}
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

                    {/* Price preview */}
                    {form.productType && (
                        <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-4 py-3 mt-1">
                            <span className="text-xs text-gray-500 font-medium">Player Price</span>
                            <span className="text-blue-600 font-extrabold text-lg tabular-nums">₱{getPlayerPrice(form)}</span>
                        </div>
                    )}

                    {/* AddUpdate Button */}
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
            </div>

            {/* Player List */}
            {players.length > 0 && (
                <div className="max-w-xl mx-auto mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Roster ({players.length} player{players.length > 1 ? 's' : ''})
                        </span>
                    </div>

                    <div className="space-y-2">
                        {players.map((pl, i) => {
                            const product = PRODUCT_TYPES.find((p) => p.id === pl.productType)
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
                                                    {[pl.firstName, pl.surname].filter(Boolean).join(' ')}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-0.5">
                                                    {product?.label || '—'} · Jersey: {pl.jerseySize || '—'}
                                                    {product?.needsShortSize && ` · Short: ${pl.shortSize || '—'}`}
                                                    {pl.pockets && ' · Pockets'}
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
                </div>
            )}

            {players.length === 0 && (
                <div className="max-w-xl mx-auto text-center py-8">
                    <FaTshirt size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No players added yet. Add your first player above.</p>
                </div>
            )}

            {/* Order Summary */}
            {players.length > 0 && (
                <div className="max-w-xl mx-auto">
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
                            {PRODUCT_TYPES.map((pt) => {
                                const count = players.filter((p) => p.productType === pt.id).length
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
