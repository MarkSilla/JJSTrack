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

const StepReview = ({
    service,
    selectedOptions,
    details,
    selectedDate,
    selectedSlot,
    photos,
    quantities,
    repairDescription,
    repairNotes = {},
    teamName,
    players,
    orgName,
    members,
    designFile,
    driveLink,
    contact,
    notes,
    repairOptions = REPAIR_OPTIONS,
}) => {
    const isRepair = service === 'repair'
    const isJersey = service === 'jersey'
    const isOrg = service === 'organizational'

    const chosen = isRepair ? repairOptions.filter((o) => (selectedOptions || []).includes(o.id)) : []
    const total = isRepair ? chosen.reduce((s, o) => s + o.price * (quantities?.[o.id] || 1), 0) : 0
    const slot = isRepair ? TIME_SLOTS.find((s) => s.id === selectedSlot || s.range === selectedSlot) : null

    return (
        <section>
            <div className="text-center mb-10 font-inter">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Review & Confirm</h2>
                <p className="text-gray-500 mt-2 text-sm">Please verify your booking details before submitting</p>
            </div>

            <div className="max-w-xl mx-auto font-inter">
                <ReviewBlock title="Service Type">
                    <p className="text-gray-800 font-semibold">
                        {isRepair ? 'Custom Repair' : isJersey ? 'Team Jersey' : isOrg ? 'Organization' : 'Booking'}
                    </p>
                    {repairDescription && (
                        <p className="text-gray-500 text-sm mt-2 italic">"{repairDescription}"</p>
                    )}
                </ReviewBlock>

                {isJersey && teamName && (
                    <ReviewBlock title="Team Information">
                        <dl className="space-y-2.5 text-sm">
                            <div>
                                <dt className="text-gray-400 font-medium">Team Name</dt>
                                <dd className="text-gray-800 font-semibold">{teamName}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 font-medium">Players</dt>
                                <dd className="text-gray-800">{players?.length || 0} players</dd>
                            </div>
                            {driveLink && (
                                <div>
                                    <dt className="text-gray-400 font-medium">Design Link</dt>
                                    <dd className="text-blue-600 truncate"><a href={driveLink} target="_blank" rel="noopener noreferrer">{driveLink}</a></dd>
                                </div>
                            )}
                        </dl>
                    </ReviewBlock>
                )}

                {isOrg && orgName && (
                    <ReviewBlock title="Organization Information">
                        <dl className="space-y-2.5 text-sm">
                            <div>
                                <dt className="text-gray-400 font-medium">Organization Name</dt>
                                <dd className="text-gray-800 font-semibold">{orgName}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 font-medium">Members</dt>
                                <dd className="text-gray-800">{members?.length || 0} members</dd>
                            </div>
                            {driveLink && (
                                <div>
                                    <dt className="text-gray-400 font-medium">Design Link</dt>
                                    <dd className="text-blue-600 truncate"><a href={driveLink} target="_blank" rel="noopener noreferrer">{driveLink}</a></dd>
                                </div>
                            )}
                        </dl>
                    </ReviewBlock>
                )}

                {isRepair && chosen.length > 0 && (
                    <ReviewBlock title="Selected Options">
                        <div className="divide-y divide-gray-200">
                            {chosen.map((o) => {
                                const qty = quantities[o.id] || 1
                                const optionNotes = repairNotes?.[o.id] || ''
                                return (
                                    <div key={o.id} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                                        <div>
                                            <span className="text-gray-600 text-sm">{o.label} {qty > 1 && <span className="text-gray-400">×{qty}</span>}</span>
                                            {optionNotes && <p className="text-xs text-gray-400 mt-1">{optionNotes}</p>}
                                        </div>
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

                {isRepair && photos.length > 0 && (
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
                            ['Name', contact?.fullName || details?.name],
                            ['Email', contact?.email || details?.email],
                            ['Phone', contact?.phone || details?.phone],
                            ['Address', contact?.address || [details?.address, details?.city, details?.zip].filter(Boolean).join(', ')],
                        ].map(([k, v]) => (
                            <React.Fragment key={k}>
                                <dt className="text-gray-400 font-medium">{k}</dt>
                                <dd className="text-gray-800">{v || '—'}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </ReviewBlock>

                {isRepair && (
                    <ReviewBlock title="Pickup Schedule">
                        <dl className="grid grid-cols-[100px_1fr] gap-y-2.5 text-sm">
                            <dt className="text-gray-400 font-medium">Date</dt>
                            <dd className="text-gray-800">{selectedDate || '—'}</dd>
                            <dt className="text-gray-400 font-medium">Time Range</dt>
                            <dd className="text-gray-800">{slot ? slot.range : '—'}</dd>
                        </dl>
                    </ReviewBlock>
                )}

                {notes && (
                    <ReviewBlock title="Additional Instructions">
                        <p className="text-gray-700 text-sm italic">"{notes}"</p>
                    </ReviewBlock>
                )}

                {!isRepair && (
                    <ReviewBlock title="Approval Status">
                        <p className="text-gray-700 text-sm">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                            Awaiting Admin Review
                        </p>
                        <p className="text-gray-500 text-xs mt-2">Our team will review your {isJersey ? 'team' : 'organization'} booking and contact you with pickup scheduling details.</p>
                    </ReviewBlock>
                )}
            </div>
        </section>
    )
}

export default StepReview
