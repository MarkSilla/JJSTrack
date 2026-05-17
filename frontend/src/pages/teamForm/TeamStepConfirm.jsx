import React from 'react'
import { MdEdit, MdLink, MdImage } from 'react-icons/md'

const BASE_PRODUCT_TYPES = [
    { id: 'jersey', label: 'Jersey Only', price: 550, needsJerseySize: true, needsShortSize: false },
    { id: 'fullset', label: 'Full Set (Jersey + Shorts)', price: 850, needsJerseySize: true, needsShortSize: true },
    { id: 'short', label: 'Short Only', price: 400, needsJerseySize: false, needsShortSize: true },
]

const OPTIONAL_PRODUCT_TYPES = [
    { id: 'warmer', label: 'Long Sleeve Warmer', price: 750 },
    { id: 'hoodie', label: 'Hoodie T-shirt', price: 700 },
]

const POCKET_PRICE = 100

const getPlayerPrice = (player) => {
    const product = BASE_PRODUCT_TYPES.find((p) => p.id === player.productType)
    if (!product) return 0

    let total = product.price
    if (player.pockets && product.needsShortSize) total += POCKET_PRICE

    if (product.needsJerseySize && player.addOns && Array.isArray(player.addOns)) {
        player.addOns.forEach((addOnId) => {
            const addOn = OPTIONAL_PRODUCT_TYPES.find((p) => p.id === addOnId)
            if (addOn) total += addOn.price
        })
    }

    return total
}

const getAddOnLabels = (player) =>
    OPTIONAL_PRODUCT_TYPES
        .filter((p) => (Array.isArray(player.addOns) ? player.addOns.map(id => String(id).toLowerCase()).includes(p.id.toLowerCase()) : false))
        .map((p) => p.label)

const getPlayerDisplayName = (player, index) => (
    [player.surname || '', player.nickname ? `(${player.nickname})` : ''].filter(Boolean).join(' ') || `Player ${index + 1}`
)

const ReviewBlock = ({ title, onEdit, children }) => (
    <div className="mb-5 font-inter">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600/70 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
                {title}
            </h4>
            {onEdit && (
                <button onClick={onEdit} className="flex items-center gap-1 text-[11px] text-blue-500/70 hover:text-blue-600 font-semibold uppercase tracking-wider transition-colors cursor-pointer">
                    <MdEdit size={12} /> Edit
                </button>
            )}
        </div>
        <div className="bg-[#F8FAFC] rounded-xl border border-gray-200 p-5">{children}</div>
    </div>
)

const TeamStepConfirm = ({ teamName, players, designFile, driveLink, contact, goToStep, contactReadOnly = false }) => {
    const grandTotal = players.reduce((sum, pl) => sum + getPlayerPrice(pl), 0)
    const contactRows = [
        ['Name', contact.fullName],
        ['Phone', contact.phone],
        ['Email', contact.email],
        ...(contact.facebook ? [['FB/Messenger', contact.facebook]] : []),
        ['Address', contact.address],
    ]

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Review & Confirm</h2>
                <p className="text-gray-500 mt-2 text-sm">Please verify your order details before submitting. Booking will wait for admin approval. Admin will schedule pickup date.</p>
            </div>

            <div className="max-w-xl mx-auto">
                <ReviewBlock title="Team & Players" onEdit={() => goToStep(2)}>
                    <p className="text-gray-800 font-semibold mb-3">{teamName || 'No team name'}</p>
                    {players.length > 0 ? (
                        <div className="overflow-x-auto -mx-5 px-5">
                            <table className="w-full min-w-[600px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">No.</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">Full Name</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Number</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Jersey Size</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Short Size</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">Add-ons</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Pockets</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {players.map((pl, i) => {
                                        const price = getPlayerPrice(pl)
                                        const product = BASE_PRODUCT_TYPES.find((p) => p.id === pl.productType)
                                        const jerseySizeText = pl.useManualjerseySize || (pl.jerseyLength && pl.jerseyBody) ? `${pl.jerseyLength || '-'}"×${pl.jerseyBody || '-'}"` : (pl.jerseySize || '-')
                                        const shortSizeText = pl.useManualsShortSize || (pl.shortHips && pl.shortLength) ? `${pl.shortHips || '-'}"×${pl.shortLength || '-'}"` : (pl.shortSize || '-')
                                        const addOnText = getAddOnLabels(pl).join(', ') || 'None'

                                        return (
                                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="py-2.5 text-xs font-medium text-gray-500">{i + 1}.</td>
                                                <td className="py-2.5 text-xs font-semibold text-gray-800 uppercase">{getPlayerDisplayName(pl, i)}</td>
                                                <td className="py-2.5 text-xs font-semibold text-gray-600">{product?.label || '-'}</td>
                                                <td className="py-2.5 text-xs font-bold text-gray-600 text-center">{pl.number || '-'}</td>
                                                <td className="py-2.5 text-xs font-medium text-gray-600 text-center">{jerseySizeText}</td>
                                                <td className="py-2.5 text-xs font-medium text-gray-600 text-center">{shortSizeText}</td>
                                                <td className="py-2.5 text-xs text-gray-500">{addOnText}</td>
                                                <td className="py-2.5 text-xs font-medium text-gray-600 text-center">{pl.pockets ? 'Yes' : 'No'}</td>
                                                <td className="py-2.5 text-xs font-bold text-blue-600 text-right tabular-nums">{'\u20B1'}{price}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No players added</p>
                    )}
                    <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-medium">{players.length} player{players.length !== 1 ? 's' : ''} total</span>
                        <span className="text-blue-600 font-extrabold text-lg tabular-nums">{'\u20B1'}{grandTotal}</span>
                    </div>
                </ReviewBlock>

                <ReviewBlock title="Design Reference" onEdit={() => goToStep(3)}>
                    {designFile ? (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <MdImage size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-gray-800 text-sm font-medium">{designFile.name}</p>
                                <p className="text-gray-400 text-xs">{(designFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                        </div>
                    ) : driveLink ? (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <MdLink size={20} className="text-blue-500" />
                            </div>
                            <a href={driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm font-medium underline underline-offset-2 truncate hover:text-blue-600 transition-colors">
                                {driveLink}
                            </a>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No design uploaded</p>
                    )}
                </ReviewBlock>

                <ReviewBlock title="Contact Information" onEdit={contactReadOnly ? undefined : () => goToStep(4)}>
                    <dl className="grid grid-cols-[100px_1fr] gap-y-2.5 text-sm">
                        {contactRows.map(([k, v]) => (
                            <React.Fragment key={k}>
                                <dt className="text-gray-400 font-medium">{k}</dt>
                                <dd className="text-gray-800">{v || '-'}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                    {contactReadOnly && (
                        <p className="text-xs text-blue-600/80 mt-3">
                            Contact details are pulled from your signup/profile information.
                        </p>
                    )}
                </ReviewBlock>
            </div>
        </section>
    )
}

export default TeamStepConfirm
