import { MdCalendarToday, MdAccessTime } from 'react-icons/md'
import { TIME_SLOTS, getWeekDays } from './constants'

const StepPickup = ({ selectedDate, setSelectedDate, selectedSlot, setSelectedSlot }) => {
    const weekDays = getWeekDays()

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Schedule Pickup</h2>
                <p className="text-gray-500 mt-2 text-sm">When should we come to collect your items?</p>
            </div>

            <div className="max-w-xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                    <MdCalendarToday size={16} className="text-blue-500/70" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Date</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-10">
                    {weekDays.map((d) => {
                        const active = selectedDate === d.date
                        return (
                            <button
                                key={d.date}
                                onClick={() => setSelectedDate(d.date)}
                                className={`flex flex-col items-center py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${active
                                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:shadow-md'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-blue-500' : 'text-gray-400'}`}>{d.day}</span>
                                <span className={`text-2xl font-extrabold mt-1 ${active ? 'text-gray-800' : 'text-gray-600'}`}>{d.date}</span>
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <MdAccessTime size={16} className="text-blue-500/70" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Time Slot</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    {TIME_SLOTS.map((slot) => {
                        const active = selectedSlot === slot.id
                        return (
                            <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot.id)}
                                className={`flex flex-col items-center py-5 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${active
                                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:shadow-md'
                                    }`}
                            >
                                <span className={`font-bold text-sm ${active ? 'text-blue-600' : 'text-gray-600'}`}>{slot.label}</span>
                                <span className={`text-xs mt-1.5 ${active ? 'text-gray-500' : 'text-gray-400'}`}>{slot.range}</span>
                            </button>
                        )
                    })}
                </div>

                <p className="text-center text-xs text-blue-500/50 font-medium">We'll confirm your pickup within 24 hours</p>
            </div>
        </section>
    )
}

export default StepPickup
