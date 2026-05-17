import PhilippinesAddressFields from '../../components/PhilippinesAddressFields'

const inputClassName = 'border rounded-xl px-4 py-3.5 text-sm transition-all duration-200'

const Field = ({ label, readOnly = false, ...props }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">{label}</label>
        <input
            {...props}
            readOnly={readOnly}
            aria-readonly={readOnly}
            className={`${inputClassName} ${
                readOnly
                    ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed focus:outline-none'
                    : 'bg-[#F8FAFC] border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15'
            }`}
        />
    </div>
)

const TeamStepContact = ({ contact, setContact, readOnly = false }) => {
    const set = (k, v) => setContact((p) => ({ ...p, [k]: v }))

    return (
        <section>
            <div className="text-center mb-10 font-inter">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Contact Information</h2>
                <p className="text-gray-500 mt-2 text-sm">How can we reach you about this order?</p>
                {readOnly && (
                    <p className="text-xs text-blue-600/80 mt-3">
                        These details come from your signup/profile information and cannot be edited here.
                        Update them in your Profile page if needed.
                    </p>
                )}
            </div>

            <div className="max-w-xl mx-auto flex flex-col gap-5">
                <Field label="Full Name" placeholder="Juan Dela Cruz" value={contact.fullName} onChange={(e) => set('fullName', e.target.value)} readOnly={readOnly} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Phone Number" type="tel" placeholder="+63 9XX XXX XXXX" value={contact.phone} onChange={(e) => set('phone', e.target.value)} readOnly={readOnly} />
                    <Field label="Email Address" type="email" placeholder="juan@example.com" value={contact.email} onChange={(e) => set('email', e.target.value)} readOnly={readOnly} />
                </div>
                {!readOnly && (
                    <Field label="Facebook/Messenger" placeholder="Fb Name/Link" value={contact.facebook} onChange={(e) => set('facebook', e.target.value)} />
                )}
                <PhilippinesAddressFields value={contact} onChange={(nextContact) => setContact((prev) => ({ ...prev, ...nextContact }))} readOnly={readOnly} />
            </div>
        </section>
    )
}

export default TeamStepContact
