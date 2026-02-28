const Field = ({ label, ...props }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">{label}</label>
        <input
            {...props}
            className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
        />
    </div>
)

const OrgStepContact = ({ contact, setContact }) => {
    const set = (k, v) => setContact((p) => ({ ...p, [k]: v }))

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Contact Information</h2>
                <p className="text-gray-500 mt-2 text-sm">How can we reach you about this order?</p>
            </div>

            <div className="max-w-xl mx-auto flex flex-col gap-5">
                <Field label="Full Name" placeholder="Juan Dela Cruz" value={contact.fullName} onChange={(e) => set('fullName', e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Phone Number" type="tel" placeholder="+63 9XX XXX XXXX" value={contact.phone} onChange={(e) => set('phone', e.target.value)} />
                    <Field label="Email Address" type="email" placeholder="juan@example.com" value={contact.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <Field label="Facebook/Messenger" placeholder="Fb Name/Link" value={contact.facebook} onChange={(e) => set('facebook', e.target.value)} />
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">Full Address</label>
                    <textarea
                        value={contact.address}
                        onChange={(e) => set('address', e.target.value)}
                        placeholder="123 Rizal St, Barangay San Jose, Manila"
                        rows={3}
                        className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200 resize-none"
                    />
                </div>
            </div>
        </section>
    )
}

export default OrgStepContact
