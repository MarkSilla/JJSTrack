import { Scissors, Shirt, Building2 } from 'lucide-react'

const SERVICES = [
    { id: 'repair', label: 'Custom Repair', desc: 'Alterations, repairs & fixes for your garments', Icon: Scissors },
    { id: 'jersey', label: 'Team Jersey', desc: 'Custom jerseys for your team', Icon: Shirt },
    { id: 'organizational', label: 'Organization', desc: 'T-shirts & polo shirts for your organization', Icon: Building2 },
]

const getCapacityForService = (id, bookingCapacity) =>
    id === 'repair' ? bookingCapacity?.repair : bookingCapacity?.jerseyOrg

const CAPACITY_WARNING = 'This date has already reached its recommended capacity. Your booking request may be delayed and is subject to approval.'

const StepService = ({ service, setService, bookingCapacity, capacityLoading = false }) => (
    <section>
        <div className="text-center mb-5 font-inter">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">What brings you in?</h2>
            <p className="text-gray-500 mt-2 text-sm">Select the service you need</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
            {SERVICES.map(({ id, label, desc, Icon }) => {
                const selected = service === id
                const capacity = getCapacityForService(id, bookingCapacity)
                const isFull = Boolean(capacity?.isFull)
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setService(id)}
                        className={`group relative p-7 rounded-2xl text-left transition-all duration-300 overflow-hidden
                ${isFull
                                ? selected
                                    ? 'bg-amber-50 border-2 border-amber-400 shadow-lg shadow-amber-100 cursor-pointer'
                                    : 'bg-white border border-amber-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100 cursor-pointer'
                                : selected
                                    ? 'bg-blue-50 border-2 border-blue-500/70 shadow-xl shadow-blue-100 cursor-pointer'
                                    : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100 cursor-pointer'
                            }`}
                    >
                        {selected && <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />}
                        <div
                            className={`relative w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300
                  ${selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}`}
                        >
                            <Icon size={26} />
                        </div>
                        <h3 className={`relative text-lg font-bold mb-1 transition-colors ${selected ? 'text-blue-600' : 'text-gray-800'}`}>
                            {label}
                        </h3>
                        <p className="relative text-sm text-gray-500 leading-relaxed">{desc}</p>
                        <p className={`relative mt-4 text-[10px] font-black uppercase tracking-widest ${isFull ? 'text-red-500' : 'text-blue-500/70'}`}>
                            {capacityLoading && !capacity
                                ? 'Checking slots...'
                                : capacity
                                    ? isFull
                                        ? 'Recommended capacity reached'
                                        : `${capacity.available} / ${capacity.max} slots left today`
                                    : 'Slots checked on submit'}
                        </p>
                        {isFull && (
                            <p className="relative mt-2 text-[11px] font-semibold leading-snug text-amber-700">
                                {CAPACITY_WARNING}
                            </p>
                        )}
                    </button>
                )
            })}
        </div>
    </section>
)

export default StepService
