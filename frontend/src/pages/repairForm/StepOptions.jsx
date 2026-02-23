import { MdCheck, MdAdd, MdRemove, MdInfo } from 'react-icons/md'
import { REPAIR_OPTIONS } from './constants'

const StepOptions = ({ selectedOptions, toggleOption, quantities, setQuantity, repairDescription, setRepairDescription }) => {
    const total = REPAIR_OPTIONS
        .filter((o) => selectedOptions.includes(o.id))
        .reduce((s, o) => s + o.price * (quantities[o.id] || 1), 0)

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Select Options</h2>
                <p className="text-gray-500 mt-2 text-sm">Choose all that apply and set how many items per repair</p>
            </div>

            <div className="flex flex-col gap-2.5 max-w-xl mx-auto">
                {REPAIR_OPTIONS.map((opt) => {
                    const checked = selectedOptions.includes(opt.id)
                    const qty = quantities[opt.id] || 1
                    return (
                        <div key={opt.id} className={`rounded-xl border transition-all duration-200 ${checked ? 'bg-blue-50 border-blue-500/50' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                            <label className="group flex items-center justify-between px-5 py-4 cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center transition-all duration-200
                        ${checked ? 'bg-blue-600 shadow-sm shadow-blue-600/40' : 'border-2 border-gray-300 group-hover:border-gray-400'}`}
                                    >
                                        {checked && <MdCheck size={13} className="text-white" />}
                                    </span>
                                    <span className={`font-medium transition-colors ${checked ? 'text-gray-800' : 'text-gray-600'}`}>{opt.label}</span>
                                </div>
                                {opt.price !== '' && <span className={`font-bold tabular-nums ${checked ? 'text-blue-600' : 'text-gray-400'}`}>₱{opt.price}</span>}
                                <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleOption(opt.id)} />
                            </label>
                            {checked && opt.id === 'others' && (
                                <div className="px-5 pb-4 pt-0 flex flex-col gap-3">
                                    <input
                                        type="text"
                                        value={repairDescription}
                                        onChange={(e) => setRepairDescription(e.target.value)}
                                        placeholder="Please specify what repair you need..."
                                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">How many repairs?</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setQuantity(opt.id, Math.max(1, qty - 1))}
                                                className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                            >
                                                <MdRemove size={14} />
                                            </button>
                                            <span className="text-gray-800 font-bold text-sm w-6 text-center tabular-nums">{qty}</span>
                                            <button
                                                onClick={() => setQuantity(opt.id, qty + 1)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                            >
                                                <MdAdd size={14} />
                                            </button>

                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-500 text-center mt-3 ">Price may vary depending on the service. Please go to our shop for the exact price.</p>
                                </div>
                            )}
                            {checked && opt.id !== 'others' && (
                                <div className="flex items-center justify-between px-5 pb-4 pt-0">
                                    <span className="text-xs text-gray-500">How many items?</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(opt.id, Math.max(1, qty - 1))}
                                            className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                        >
                                            <MdRemove size={14} />
                                        </button>
                                        <span className="text-gray-800 font-bold text-sm w-6 text-center tabular-nums">{qty}</span>
                                        <button
                                            onClick={() => setQuantity(opt.id, qty + 1)}
                                            className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                        >
                                            <MdAdd size={14} />
                                        </button>
                                        <span className="text-blue-500/70 text-xs font-medium ml-1">= ₱{opt.price * qty}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="max-w-xl mx-auto mt-6">
                <div className="flex items-center justify-between px-6 py-4 rounded-xl bg-[#F8FAFC] border border-gray-200">
                    <span className="text-gray-600 font-semibold text-sm uppercase tracking-wide">Estimated Total</span>
                    <span className="text-blue-600 font-extrabold text-2xl tabular-nums">₱{total}</span>
                </div>
            </div>

            <div className="max-w-xl mx-auto mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200/50">
                <MdInfo size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-600/80">Please go to the shop for accurate assessment of your repair.</p>
            </div>
        </section>
    )
}

export default StepOptions
