const Field = ({ label, ...props }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">{label}</label>
        <input
            {...props}
            className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
        />
    </div>
)

const StepDetails = ({ details, setDetail }) => (
    <section>
        <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Your Details</h2>
            <p className="text-gray-500 mt-2 text-sm">Where should we pick up and deliver your items?</p>
        </div>

        <div className="max-w-xl mx-auto flex flex-col gap-5">
            <Field label="Full Name" placeholder="Juan Dela Cruz" value={details.name} onChange={(e) => setDetail('name', e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Email Address" type="email" placeholder="juan@example.com" value={details.email} onChange={(e) => setDetail('email', e.target.value)} />
                <Field label="Phone Number" type="tel" placeholder="+63 9XX XXX XXXX" value={details.phone} onChange={(e) => setDetail('phone', e.target.value)} />
            </div>
            <Field label="Street Address" placeholder="123 Rizal St, Barangay San Jose" value={details.address} onChange={(e) => setDetail('address', e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="City" placeholder="Manila" value={details.city} onChange={(e) => setDetail('city', e.target.value)} />
            </div>
        </div>
    </section>
)

export default StepDetails
