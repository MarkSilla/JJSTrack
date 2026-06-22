import { MdCheck, MdAdd, MdRemove, MdInfo, MdDelete } from 'react-icons/md'
import { REPAIR_OPTIONS } from './constants'

const StepOptions = ({
    selectedOptions,
    toggleOption,
    quantities,
    setQuantity,
    repairDescription,
    setRepairDescription,
    repairNotes = {},
    setRepairNote = () => {},
    notes,
    setNotes,
    repairOptions = REPAIR_OPTIONS,
    // Bulk repair props
    isBulkMode = false,
    setIsBulkMode = () => {},
    bulkItems = [],
    addBulkItem = () => {},
    removeBulkItem = () => {},
    updateBulkItem = () => {},
    toggleBulkItemOption = () => {},
    setBulkItemQuantity = () => {},
    bulkSharedNotes = '',
    setBulkSharedNotes = () => {},
}) => {
    const total = repairOptions
        .filter((o) => selectedOptions.includes(o.id))
        .reduce((s, o) => s + o.price * (quantities[o.id] || 1), 0)

    const bulkTotal = bulkItems.reduce((sum, bulkItem) => {
        return sum + (bulkItem.selectedOptions || []).reduce((itemSum, optId) => {
            const opt = repairOptions.find((o) => o.id === optId)
            const qty = bulkItem.quantities?.[optId] || 1
            return itemSum + (opt?.price || 0) * qty
        }, 0)
    }, 0)

    return (
        <section>
            <div className="text-center mb-8 font-inter">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Select Options</h2>
                <p className="text-gray-500 mt-2 text-sm">Choose all that apply and set how many items per repair</p>
            </div>

            {/* Bulk Mode Toggle */}
            <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                <input
                    type="checkbox"
                    id="bulkModeToggle"
                    checked={isBulkMode}
                    onChange={(e) => setIsBulkMode(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="bulkModeToggle" className="cursor-pointer flex-1">
                    <span className="font-semibold text-gray-800">Bulk Repair Mode</span>
                    <p className="text-xs text-gray-600 mt-1">Add multiple items with different repairs - they'll count as 1 booking slot</p>
                </label>
            </div>

            {/* Normal Mode */}
            {!isBulkMode && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto items-start font-inter">
                        {repairOptions.map((opt) => {
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
                                        <span className={`font-bold tabular-nums ${checked ? 'text-blue-600' : 'text-gray-400'}`}>₱{opt.price}</span>
                                        <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleOption(opt.id)} />
                                    </label>

                                    {checked && (
                                        <div className="px-5 pb-4 pt-0 flex flex-col gap-3">
                                            {opt.id === 'others' && (
                                                <input
                                                    type="text"
                                                    value={repairDescription}
                                                    onChange={(e) => setRepairDescription(e.target.value)}
                                                    placeholder="Please specify what repair you need..."
                                                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
                                                />
                                            )}

                                            <textarea
                                                value={repairNotes?.[opt.id] || ''}
                                                onChange={(e) => setRepairNote(opt.id, e.target.value)}
                                                placeholder="Add notes for this repair option (optional)"
                                                rows={3}
                                                className="w-full resize-none bg-[#F8FAFC] border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
                                            />

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">{opt.id === 'others' ? 'How many repairs?' : 'How many items?'}</span>
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
                                                    {opt.id !== 'others' && <span className="text-blue-500/70 text-xs font-medium ml-1">= ₱{opt.price * qty}</span>}
                                                </div>
                                            </div>

                                            {opt.id === 'others' && (
                                                <p className="text-xs text-blue-500 text-center mt-3">Price may vary depending on the service. Please go to our shop for the exact price.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="max-w-2xl mx-auto mt-8 font-inter">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60 mb-2 block">Additional Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Please use a blue zipper if possible, or any specific instructions..."
                            rows={3}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200 resize-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 italic">Anything else you'd like us to know about your repair?</p>
                    </div>

                    <div className="max-w-2xl mx-auto mt-6 font-inter">
                        <div className="flex items-center justify-between px-6 py-4 rounded-xl bg-[#F8FAFC] border border-gray-200">
                            <span className="text-gray-600 font-semibold text-sm uppercase tracking-wide">Estimated Total</span>
                            <span className="text-blue-600 font-extrabold text-2xl tabular-nums">₱{total}</span>
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200/50">
                        <MdInfo size={20} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-600/80">Please go to the shop for accurate assessment of your repair.</p>
                    </div>
                </>
            )}

            {/* Bulk Mode */}
            {isBulkMode && (
                <>
                    <div className="max-w-3xl mx-auto font-inter">
                        {/* Add Item Button */}
                        <button
                            onClick={addBulkItem}
                            className="mb-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                        >
                            <MdAdd size={18} />
                            Add Item
                        </button>

                        {/* Bulk Items List */}
                        {bulkItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No items added yet. Click "Add Item" to start adding repairs.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 mb-8">
                                {bulkItems.map((bulkItem, itemIdx) => {
                                    const itemTotal = (bulkItem.selectedOptions || []).reduce((sum, optId) => {
                                        const opt = repairOptions.find((o) => o.id === optId)
                                        const qty = bulkItem.quantities?.[optId] || 1
                                        return sum + (opt?.price || 0) * qty
                                    }, 0)

                                    return (
                                        <div key={bulkItem.id} className="border border-gray-200 rounded-xl p-5 bg-white">
                                            {/* Item Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={bulkItem.name}
                                                        onChange={(e) => updateBulkItem(bulkItem.id, { name: e.target.value })}
                                                        placeholder={`Item ${itemIdx + 1} name (e.g., "Shirt", "Pants")`}
                                                        className="w-full font-semibold text-gray-800 bg-transparent border-b border-gray-200 pb-1 focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeBulkItem(bulkItem.id)}
                                                    className="ml-4 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Remove item"
                                                >
                                                    <MdDelete size={16} />
                                                </button>
                                            </div>

                                            {/* Repair Options for this Item */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                                {repairOptions.map((opt) => {
                                                    const isSelected = (bulkItem.selectedOptions || []).includes(opt.id)
                                                    const qty = bulkItem.quantities?.[opt.id] || 1

                                                    return (
                                                        <div
                                                            key={opt.id}
                                                            className={`rounded-lg border px-4 py-3 transition-all duration-200 cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-blue-50 border-blue-500/50'
                                                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                            onClick={() => toggleBulkItemOption(bulkItem.id, opt.id)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                                                            isSelected
                                                                                ? 'bg-blue-600 text-white'
                                                                                : 'border-2 border-gray-300'
                                                                        }`}
                                                                    >
                                                                        {isSelected && <MdCheck size={12} />}
                                                                    </span>
                                                                    <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-600">₱{opt.price}</span>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="mt-2 flex items-center gap-2 text-xs">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setBulkItemQuantity(bulkItem.id, opt.id, Math.max(1, qty - 1))
                                                                        }}
                                                                        className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                                                    >
                                                                        <MdRemove size={12} />
                                                                    </button>
                                                                    <span className="w-6 text-center font-semibold">{qty}</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setBulkItemQuantity(bulkItem.id, opt.id, qty + 1)
                                                                        }}
                                                                        className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                                                    >
                                                                        <MdAdd size={12} />
                                                                    </button>
                                                                    <span className="ml-auto text-blue-600 font-semibold">= ₱{opt.price * qty}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Item Total */}
                                            <div className="text-right text-xs text-gray-600 font-semibold">
                                                Item Total: <span className="text-blue-600">₱{itemTotal}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Shared Notes */}
                        <div className="mb-6">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60 mb-2 block">Shared Notes (Optional)</label>
                            <textarea
                                value={bulkSharedNotes}
                                onChange={(e) => setBulkSharedNotes(e.target.value)}
                                placeholder="Add any general instructions for all repairs..."
                                rows={3}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200 resize-none"
                            />
                        </div>

                        {/* Bulk Total */}
                        {bulkItems.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 rounded-xl bg-[#F8FAFC] border border-gray-200">
                                <span className="text-gray-600 font-semibold text-sm uppercase tracking-wide">Total (All Items - 1 Slot)</span>
                                <span className="text-blue-600 font-extrabold text-2xl tabular-nums">₱{bulkTotal}</span>
                            </div>
                        )}

                        <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200/50">
                            <MdInfo size={20} className="text-green-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700">All items in this bulk repair will be counted as a single booking slot on your pickup date.</p>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}

export default StepOptions
