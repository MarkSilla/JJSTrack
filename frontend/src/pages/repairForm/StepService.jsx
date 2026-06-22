import { MdContentCut, MdBusiness } from 'react-icons/md'
import { FaTshirt } from 'react-icons/fa'

const SERVICES = [
    { id: 'repair', label: 'Custom Repair', desc: 'Alterations, repairs & fixes for your garments', Icon: MdContentCut },
    { id: 'jersey', label: 'Team Jersey', desc: 'Custom jerseys for your team', Icon: FaTshirt },
    { id: 'organizational', label: 'Organization', desc: 'T-shirts & polo shirts for your organization', Icon: MdBusiness },
]

const getCapacityForService = (id, bookingCapacity) =>
    id === 'repair' ? bookingCapacity?.repair : bookingCapacity?.jerseyOrg

const CAPACITY_WARNING = 'This date has already reached its recommended capacity. Your booking request may be delayed and is subject to approval.'

const formatDate = (dateKey = '') => {
    if (!dateKey) return ''
    const date = new Date(`${dateKey}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateKey
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const StepService = ({ service, setService, bookingCapacity, capacityLoading = false, bookingDate = '' }) => (
    <section className="h-full flex flex-col font-inter">
        <div className="text-center mb-6 shrink-0">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">What brings you in?</h2>
            <p className="text-gray-500 mt-2 text-sm">Select the service you need</p>
            {bookingDate && (
                <div className="mt-3 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                        Booking Date: {formatDate(bookingDate)}
                    </span>
                </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto py-1 font-inter">
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
                            className={`group relative p-6 rounded-2xl text-left transition-all duration-300 overflow-hidden shadow-sm
                    ${isFull
                                        ? selected
                                            ? 'bg-amber-50 border-2 border-amber-400 shadow-lg shadow-amber-100 cursor-pointer'
                                            : 'bg-white border-2 border-amber-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100 cursor-pointer'
                                        : selected
                                            ? 'bg-blue-50 border-2 border-blue-500/70 shadow-xl shadow-blue-100 cursor-pointer hover:shadow-md'
                                            : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100 cursor-pointer'
                                }`}>

                            {selected && <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />}
                            <div
                                className={`relative w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300
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
                                            : `${capacity.available} / ${capacity.max} slots left on this date`
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
        </div>
    </section>
)

export default StepService
