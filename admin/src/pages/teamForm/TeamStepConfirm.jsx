import React from 'react'
import { Edit2, Link as LinkIcon, Image as ImageIcon, AlertTriangle } from 'lucide-react'

const PRODUCT_TYPES = [
    { id: 'jersey', label: 'Jersey Only', price: 550, needsShortSize: true },
    { id: 'fullset', label: 'Full Set (Jersey + Shorts)', price: 850, needsShortSize: true },
    { id: 'warmer', label: 'Long Sleeve Warmer', price: 750, needsShortSize: false },
    { id: 'hoodie', label: 'Hoodie T-shirt', price: 700, needsShortSize: false },
]

const BASE_PRODUCT_TYPES = [
    { id: 'jersey', label: 'Jersey Only', price: 550, needsShortSize: true },
    { id: 'fullset', label: 'Full Set (Jersey + Shorts)', price: 850, needsShortSize: true },
]

const OPTIONAL_PRODUCT_TYPES = [
    { id: 'warmer', label: 'Long Sleeve Warmer', price: 750, needsShortSize: false },
    { id: 'hoodie', label: 'Hoodie T-shirt', price: 700, needsShortSize: false },
]

const POCKET_PRICE = 100

const getPlayerPrice = (player) => {
    const product = PRODUCT_TYPES.find((p) => p.id === player.productType)
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

const ReviewBlock = ({ title, onEdit, children }) => (
    <div className="mb-5 font-inter">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600/70 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
                {title}
            </h4>
            {onEdit && (
                <button onClick={onEdit} className="flex items-center gap-1 text-[11px] text-blue-500/70 hover:text-blue-600 font-semibold uppercase tracking-wider transition-colors cursor-pointer">
                    <Edit2 size={12} /> Edit
                </button>
            )}
        </div>
        <div className="bg-[#F8FAFC] rounded-xl border border-gray-200 p-5">{children}</div>
    </div>
)

const TeamStepConfirm = ({ teamName, players, designFile, driveLink, contact, goToStep }) => {
    const grandTotal = players.reduce((sum, pl) => sum + getPlayerPrice(pl), 0)

    return (
        <section className="min-h-[400px] flex flex-col justify-center">
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Review & Confirm</h2>
                <p className="text-gray-500 mt-2 text-sm">Please verify your order details before submitting</p>
            </div>

            {players.length === 0 ? (
                <div className="max-w-xl mx-auto text-center py-12">
                    <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} className="text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Incomplete Order</h3>
                    <p className="text-gray-500 mb-6">No players added. Please go back and add team members.</p>
                    <button
                        onClick={() => goToStep(1)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
                    >
                        Add Players
                    </button>
                </div>
            ) : (
                <div className="max-w-xl mx-auto">

                    {/* Team & Players */}
                    <ReviewBlock title="Team & Players" onEdit={() => goToStep(2)}>
                        <p className="text-gray-800 font-semibold mb-3">{teamName || 'No team name'}</p>
                        {players.length > 0 ? (
                            <div className="space-y-2">
                                {players.map((pl, i) => {
                                    const product = PRODUCT_TYPES.find((p) => p.id === pl.productType)
                                    const price = getPlayerPrice(pl)
                                    return (
                                        <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-200 last:border-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-black font-bold text-xs flex items-center justify-center shrink-0">
                                                    {pl.number}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-gray-800 text-sm font-medium truncate">
                                                        {[pl.firstName, pl.surname].filter(Boolean).join(' ')}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">
                                                        {product?.label || '—'} · {pl.jerseySize || '—'}
                                                        {product?.needsShortSize && ` / ${pl.shortSize || '—'}`}
                                                        {pl.pockets && ' · Pockets'}
                                                        {pl.addOns && pl.addOns.length > 0 && ` · ${pl.addOns.map(id => {
                                                            const addon = OPTIONAL_PRODUCT_TYPES.find(p => p.id === id)
                                                            return addon?.label
                                                        }).join(', ')}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-blue-600 font-bold text-sm tabular-nums shrink-0">₱{price}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No players added</p>
                        )}
                        <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
                            <span className="text-gray-500 text-xs font-medium">{players.length} player{players.length !== 1 ? 's' : ''} total</span>
                            <span className="text-blue-600 font-extrabold text-lg tabular-nums">₱{grandTotal}</span>
                        </div>
                    </ReviewBlock>

                    {/* Design */}
                    <ReviewBlock title="Design Reference" onEdit={() => goToStep(3)}>
                        {designFile ? (
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <ImageIcon size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-gray-800 text-sm font-medium">{designFile.name}</p>
                                    <p className="text-gray-400 text-xs">{(designFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                            </div>
                        ) : driveLink ? (
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <LinkIcon size={20} className="text-blue-500" />
                                </div>
                                <a href={driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm font-medium underline underline-offset-2 truncate hover:text-blue-600 transition-colors">
                                    {driveLink}
                                </a>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No design uploaded</p>
                        )}
                    </ReviewBlock>

                    {/* Contact Info */}
                    <ReviewBlock title="Contact Information" onEdit={() => goToStep(4)}>
                        <dl className="grid grid-cols-[100px_1fr] gap-y-2.5 text-sm">
                            {[
                                ['Name', contact.fullName],
                                ['Phone', contact.phone],
                                ['Email', contact.email],
                                ['FB/Messenger', contact.facebook],
                                ['Address', contact.address],
                            ].map(([k, v]) => (
                                <React.Fragment key={k}>
                                    <dt className="text-gray-400 font-medium">{k}</dt>
                                    <dd className="text-gray-800">{v || '—'}</dd>
                                </React.Fragment>
                            ))}
                        </dl>
                    </ReviewBlock>

                    {/* Admin Approval Note */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-800 font-medium">
                            <strong>Pickup Schedule:</strong> Awaiting admin approval. Admin will contact you to schedule pickup date.
                        </p>
                    </div>

                </div>
            )}
        </section>
    )
}

export default TeamStepConfirm