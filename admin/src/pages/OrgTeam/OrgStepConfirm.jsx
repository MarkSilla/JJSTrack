import React from 'react'
import { Edit2, Building2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

const PRODUCT_TYPES = [
    { id: 'tshirt', label: 'T-Shirt', price: 500 },
    { id: 'polo', label: 'Polo Shirt', price: 650 },
]

const getMemberPrice = (member) => {
    const product = PRODUCT_TYPES.find((p) => p.id === member.productType)
    return product ? product.price : 0
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

const OrgStepConfirm = ({ orgName, members, designFile, driveLink, contact, goToStep }) => {
    const grandTotal = members.reduce((sum, m) => sum + getMemberPrice(m), 0)

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Review & Confirm</h2>
                <p className="text-gray-500 mt-2 text-sm">Please verify your order details before submitting</p>
            </div>

            <div className="max-w-xl mx-auto">
                {/* Organization & Members */}
                <ReviewBlock title="Organization & Members" onEdit={() => goToStep(2)}>
                    <p className="text-gray-800 font-semibold mb-3">{orgName || 'No organization name'}</p>
                    {members.length > 0 ? (
                        <div className="overflow-x-auto -mx-5 px-5">
                            <table className="w-full min-w-[500px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">No.</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">Full Name</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Number</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Product</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Size</th>
                                        <th className="py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {members.map((m, i) => {
                                        const product = PRODUCT_TYPES.find((p) => p.id === m.productType)
                                        const price = getMemberPrice(m)
                                        const sizeText = m.useManualSize || (m.manualBody && m.manualLength && m.manualSleeveLength) 
                                            ? `${m.manualBody || '-'}"×${m.manualLength || '-'}"×${m.manualSleeveLength || '-'}"` 
                                            : (m.size || '—')
                                            
                                        return (
                                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="py-2.5 text-xs font-medium text-gray-500">{i + 1}.</td>
                                                <td className="py-2.5 text-xs font-semibold text-gray-800 uppercase">{[m.firstName, m.surname].filter(Boolean).join(' ') || m.name || `Member ${i + 1}`}</td>
                                                <td className="py-2.5 text-xs font-bold text-gray-600 text-center">{m.number || '—'}</td>
                                                <td className="py-2.5 text-xs font-medium text-gray-600 text-center">{product?.label || '—'}</td>
                                                <td className="py-2.5 text-xs font-medium text-gray-600 text-center">{sizeText}</td>
                                                <td className="py-2.5 text-xs font-bold text-blue-600 text-right tabular-nums">₱{price}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No members added</p>
                    )}
                    <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-medium">{members.length} order{members.length !== 1 ? 's' : ''} total</span>
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
        </section>
    )
}

export default OrgStepConfirm
