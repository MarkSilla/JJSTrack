import React from 'react'
import { REPAIR_OPTIONS, TIME_SLOTS } from './constants'

const ReviewBlock = ({ title, children }) => (
    <div className="mb-5">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600/70 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
            {title}
        </h4>
        <div className="bg-[#F8FAFC] rounded-xl border border-gray-200 p-5">{children}</div>
    </div>
)

const StepReview = ({ service, selectedOptions, details, selectedDate, selectedSlot, photos, quantities, repairDescription }) => {
    const chosen = REPAIR_OPTIONS.filter((o) => selectedOptions.includes(o.id))
    const total = chosen.reduce((s, o) => s + o.price * (quantities[o.id] || 1), 0)
    const slot = TIME_SLOTS.find((s) => s.id === selectedSlot)

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Review & Confirm</h2>
                <p className="text-gray-500 mt-2 text-sm">Please verify your booking details before submitting</p>
            </div>

            <div className="max-w-xl mx-auto">
                <ReviewBlock title="Service Type">
                    <p className="text-gray-800 font-semibold">{service === 'repair' ? 'Custom Repair' : 'Team Jersey'}</p>
                    {repairDescription && (
                        <p className="text-gray-500 text-sm mt-2 italic">"{repairDescription}"</p>
                    )}
                </ReviewBlock>

                {chosen.length > 0 && (
                    <ReviewBlock title="Selected Options">
                        <div className="divide-y divide-gray-200">
                            {chosen.map((o) => {
                                const qty = quantities[o.id] || 1
                                return (
                                    <div key={o.id} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                                        <span className="text-gray-600 text-sm">{o.label} {qty > 1 && <span className="text-gray-400">×{qty}</span>}</span>
                                        <span className="text-blue-600 font-bold text-sm tabular-nums">₱{o.price * qty}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                            <span className="text-gray-800 font-bold text-sm">Total</span>
                            <span className="text-blue-600 font-extrabold text-xl tabular-nums">₱{total}</span>
                        </div>
                    </ReviewBlock>
                )}

                {photos.length > 0 && (
                    <ReviewBlock title={`Photos (${photos.length})`}>
                        <div className="flex gap-2 flex-wrap">
                            {photos.map((p, i) => (
                                <img key={i} src={p.preview} alt="" className="w-14 h-14 rounded-lg object-cover ring-1 ring-gray-200" />
                            ))}
                        </div>
                    </ReviewBlock>
                )}

                <ReviewBlock title="Contact Information">
                    <dl className="grid grid-cols-[100px_1fr] gap-y-2.5 text-sm">
                        {[
                            ['Name', details.name],
                            ['Email', details.email],
                            ['Phone', details.phone],
                            ['Address', [details.address, details.city, details.zip].filter(Boolean).join(', ')],
                        ].map(([k, v]) => (
                            <React.Fragment key={k}>
                                <dt className="text-gray-400 font-medium">{k}</dt>
                                <dd className="text-gray-800">{v || '—'}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </ReviewBlock>

                <ReviewBlock title="Pickup Schedule">
                    <dl className="grid grid-cols-[100px_1fr] gap-y-2.5 text-sm">
                        <dt className="text-gray-400 font-medium">Date</dt>
                        <dd className="text-gray-800">{selectedDate || '—'}</dd>
                        <dt className="text-gray-400 font-medium">Time Slot</dt>
                        <dd className="text-gray-800">{slot ? `${slot.label} (${slot.range})` : '—'}</dd>
                    </dl>
                </ReviewBlock>
            </div>
        </section>
    )
}

export default StepReview
