import { useState, useEffect, useMemo } from "react";
import {
  Package, AlertTriangle, X, Check, Box, ChevronDown, Filter,
  ArrowDownCircle, Search, Tag, CheckCircle2, AlertCircle, XCircle,
  Clock, History,
} from "lucide-react";
// PARA SA FIFO YAN
import {
  getBatches,
  deductFIFO,
  previewFIFO,
  getTotalStock,
  initBatchesIfEmpty,
} from "../../utils/fifoUtils";

const MOCK_INVENTORY = [
  { _id: "inv1", name: "Sewing Needles", category: "Sewing",   unit: "pcs",   minStock: 5,  stock: 30 },
  { _id: "inv2", name: "Cotton Fabric",  category: "Fabric",   unit: "yards", minStock: 10, stock: 8  },
  { _id: "inv3", name: "Metal Buttons",  category: "Fastener", unit: "pcs",   minStock: 20, stock: 0  },
  { _id: "inv4", name: "Seam Ripper",    category: "Tool",     unit: "pcs",   minStock: 2,  stock: 5  },
  { _id: "inv5", name: "Elastic Band",   category: "Notions",  unit: "meters",minStock: 5,  stock: 3  },
  { _id: "inv6", name: "Thread Spools",  category: "Sewing",   unit: "pcs",   minStock: 10, stock: 45 },
  { _id: "inv7", name: "Zipper 12-inch", category: "Fastener", unit: "pcs",   minStock: 10, stock: 14 },
  { _id: "inv8", name: "Measuring Tape", category: "Tool",     unit: "pcs",   minStock: 2,  stock: 2  },
  { _id: "inv9", name: "Polyester Fabric", category: "Fabric", unit: "yards", minStock: 5,  stock: 20 },
];

const MOCK_BATCH_SEEDS = {
  inv1: [
    { batchId: 1, quantity: 10, dateAdded: "2026-03-01T08:00:00.000Z" },
    { batchId: 2, quantity: 20, dateAdded: "2026-03-15T08:00:00.000Z" },
  ],
  inv2: [
    { batchId: 1, quantity: 3, dateAdded: "2026-03-05T08:00:00.000Z" },
    { batchId: 2, quantity: 5, dateAdded: "2026-04-01T08:00:00.000Z" },
  ],
  inv4: [{ batchId: 1, quantity: 5, dateAdded: "2026-03-20T08:00:00.000Z" }],
  inv5: [{ batchId: 1, quantity: 3, dateAdded: "2026-03-28T08:00:00.000Z" }],
  inv6: [
    { batchId: 1, quantity: 15, dateAdded: "2026-02-10T08:00:00.000Z" },
    { batchId: 2, quantity: 20, dateAdded: "2026-03-10T08:00:00.000Z" },
    { batchId: 3, quantity: 10, dateAdded: "2026-04-05T08:00:00.000Z" },
  ],
  inv7: [
    { batchId: 1, quantity: 6, dateAdded: "2026-03-12T08:00:00.000Z" },
    { batchId: 2, quantity: 8, dateAdded: "2026-04-02T08:00:00.000Z" },
  ],
  inv8: [{ batchId: 1, quantity: 2, dateAdded: "2026-03-25T08:00:00.000Z" }],
  inv9: [
    { batchId: 1, quantity: 10, dateAdded: "2026-03-08T08:00:00.000Z" },
    { batchId: 2, quantity: 10, dateAdded: "2026-04-01T08:00:00.000Z" },
  ],
};

const MOCK_USER = { id: "staff001", name: "Staff Member" };
const CATEGORIES = ["All", "Sewing", "Fabric", "Fastener", "Tool", "Notions"];

function getStatus(stock, minStock) {
  if (stock === 0) return "Out of Stock";
  if (stock < (minStock || 5)) return "Low Stock";
  return "In Stock";
}

function StatusBadge({ status }) {
  const cfg = {
    "In Stock":     { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", Icon: CheckCircle2 },
    "Low Stock":    { cls: "bg-amber-50 text-amber-700 border border-amber-200",       Icon: AlertCircle  },
    "Out of Stock": { cls: "bg-red-50 text-red-700 border border-red-200",             Icon: XCircle      },
  };
  const { cls, Icon } = cfg[status] || cfg["In Stock"];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={11} /> {status}
    </span>
  );
}

//fifo deduction flow
function UseItemModal({ item, onConfirm, onClose }) {
  const [qty, setQty] = useState("");
  const [step, setStep] = useState("input"); 
  const fifoPreview = useMemo(() => {
    const n = parseInt(qty);
    if (!n || n < 1) return null;
    return previewFIFO(item._id, n);
  }, [qty, item._id]);
  const batches = useMemo(() => getBatches(item._id), [item._id]);
  const totalStock = batches.reduce((s, b) => s + b.quantity, 0);
  const canSubmit = () => {
    const n = parseInt(qty);
    return n > 0 && fifoPreview?.canFulfill;
  };

  const handleUseItem = () => {
    const n = parseInt(qty);
    if (!n || !fifoPreview?.canFulfill) return;

    // PATCH /api/inventory/:id/fifo-deduct { quantity: n, staffId: MOCK_USER.id }
    const result = deductFIFO(item._id, n);
    if (result.success) {
      onConfirm(item, n, result.breakdown);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 sm:hidden" />
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-gray-900">Use Item</h3>
            <p className="text-sm text-slate-500 mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Available Stock</span>
            <span className={`text-xl font-black tabular-nums ${totalStock === 0 ? "text-red-500" : "text-gray-900"}`}>
              {totalStock} <span className="text-sm font-normal text-slate-400">{item.unit}</span>
            </span>
          </div>
          {batches.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-indigo-700 font-semibold">{batches.length} batch{batches.length !== 1 ? "es" : ""} available</span>
              <span className="text-xs text-indigo-500">Oldest batch first (FIFO)</span>
            </div>
          )}

          {step === "input" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity to Use</label>
                <input
                  type="number"
                  min="1"
                  max={totalStock}
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder={`Max ${totalStock} ${item.unit}`}
                  disabled={totalStock === 0}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium appearance-none disabled:bg-slate-50 disabled:text-slate-400"
                />
                {qty && parseInt(qty) > totalStock && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">⚠ Lagpas sa available stock ({totalStock} {item.unit})</p>
                )}
              </div>
              {fifoPreview && fifoPreview.breakdown.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-800 mb-3 flex items-center gap-1.5">
                    <Box size={13} /> FIFO Batch Preview
                  </p>
                  <div className="space-y-2">
                    {fifoPreview.breakdown.map((b, i) => (
                      <div key={b.batchId} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                          i === 0 ? "bg-amber-400 text-white" : "bg-amber-200 text-amber-700"
                        }`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">Batch #{b.batchId}</span>
                            <span className="text-xs font-bold text-amber-700">will use {b.willUse} {item.unit}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(b.dateAdded).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                            {" · "}{b.available} {item.unit} available
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!fifoPreview.canFulfill && (
                    <p className="text-xs text-red-600 font-semibold mt-3 pt-3 border-t border-amber-200">
                      ⚠ Hindi sapat ang stock — kulang pa ng {fifoPreview.shortfall} {item.unit}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={!canSubmit()}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    canSubmit()
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {totalStock === 0 ? "Out of Stock" : "Review & Confirm"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-900 mb-1">Confirm Deduction</p>
                <p className="text-sm text-slate-600">
                  Gagamitin ang <span className="font-bold text-blue-700">{qty} {item.unit}</span> mula sa <span className="font-bold">{item.name}</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Maiiwan: {totalStock - parseInt(qty)} {item.unit} · FIFO order
                </p>
              </div>

              {fifoPreview && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-600 mb-2">Batch breakdown:</p>
                  {fifoPreview.breakdown.map(b => (
                    <div key={b.batchId} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                      <span className="text-slate-500">Batch #{b.batchId} ({new Date(b.dateAdded).toLocaleDateString("en-PH", { month: "short", day: "numeric" })})</span>
                      <span className="font-semibold text-slate-700">-{b.willUse} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep("input")} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleUseItem}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
                >
                  <Check size={15} /> Confirm Use
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
//history
function UsageHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <History size={28} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">Wala pang usage history</p>
        <p className="text-xs text-slate-400 mt-1">Mag-use ng item para lumabas dito</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <History size={15} className="text-blue-600" />
        <p className="text-sm font-bold text-gray-900">My Usage History</p>
        <span className="ml-auto bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">{history.length}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {history.map(entry => (
          <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <ArrowDownCircle size={15} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{entry.itemName}</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock size={10} />
                {new Date(entry.date).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <span className="text-sm font-bold text-red-600 tabular-nums flex-shrink-0">
              -{entry.quantity} <span className="text-xs text-slate-400 font-normal">{entry.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffInventoryPage() {
  const [inventory, setInventory] = useState(() => {
    MOCK_INVENTORY.forEach(item => {
      const key = `fifo_batches_${item._id}`;
      if (!localStorage.getItem(key) && MOCK_BATCH_SEEDS[item._id]) {
        localStorage.setItem(key, JSON.stringify(MOCK_BATCH_SEEDS[item._id]));
      }
    });
    return MOCK_INVENTORY;
  });

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [useModal, setUseModal] = useState(null);
  // GET /api/inventory/usage-history?staffId={userId}
  const [usageHistory, setUsageHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`staff_usage_${MOCK_USER.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [, forceRefresh] = useState(0);
  const refresh = () => forceRefresh(n => n + 1);

  // Stock per item 
  const getItemStock = (itemId) => getTotalStock(itemId);
  const activeItems = inventory.filter(item => getItemStock(item._id) > 0 || item.stock === 0);

  const filtered = useMemo(() => {
    return inventory.filter(item => {
      const matchQ = item.name.toLowerCase().includes(search.toLowerCase()) ||
                     item.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "All" || item.category === catFilter;
      return matchQ && matchCat;
    });
  }, [inventory, search, catFilter]);

  const totalAvailable = inventory.filter(i => getItemStock(i._id) > 0).length;
  const lowStockCount = inventory.filter(i => {
    const s = getItemStock(i._id);
    return s > 0 && s < (i.minStock || 5);
  }).length;

  const handleUseItem = (item, quantity, breakdown) => {
    // /api/inventory/usage-log
    const newEntry = {
      id: Date.now(),
      itemName: item.name,
      itemId: item._id,
      quantity,
      unit: item.unit,
      date: new Date().toISOString(),
      breakdown, //audit
    };

    const updated = [newEntry, ...usageHistory];
    setUsageHistory(updated);
    localStorage.setItem(`staff_usage_${MOCK_USER.id}`, JSON.stringify(updated));

    setUseModal(null);
    refresh();
  };

  // ─── Stats Cards ───
  const StatCard = ({ label, value, sub, icon: Icon, accent }) => (
    <div
      className="bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-200/50"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
      <div className="flex items-center gap-3 relative z-10">
        <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" 
            style={{ background: accent + "18", border: `1.5px solid ${accent}30` }}
        >
            <Icon size={20} color={accent} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-gray-500 tracking-tight leading-none mb-1.5 uppercase">{label}</div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">{value}</div>
            <div className="text-[10px] text-gray-400 font-bold truncate leading-none uppercase tracking-tighter opacity-80">
                {sub}
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 lg:px-6 py-2">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">View available supplies and log usage</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatCard
            label="Total Available"
            value={totalAvailable}
            sub="Items with stock"
            icon={Package}
            accent="#3B82F6"
          />
          <StatCard
            label="Low Stock"
            value={lowStockCount}
            sub="Need attention"
            icon={AlertTriangle}
            accent="#F59E0B"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCatDropdown(v => !v)}
              className="flex items-center gap-1.5 pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer min-w-[110px]"
            >
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <span className="truncate">{catFilter === "All" ? "Category" : catFilter}</span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${showCatDropdown ? "rotate-180" : ""}`} />
            </button>
            {showCatDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] py-1 w-[140px]">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => { setCatFilter(c); setShowCatDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none hover:bg-slate-50 ${catFilter === c ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-600"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Package size={15} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-900">All Supplies</p>
            <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full ml-1">{filtered.length}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Item Name", "Category", "Available Stock", "Status", "Action"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    <Package size={24} className="mx-auto mb-2 opacity-30" />No items found.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const stock = getItemStock(item._id);
                  const status = getStatus(stock, item.minStock);
                  const batches = getBatches(item._id);
                  return (
                    <tr key={item._id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        {batches.length > 0 && (
                          <p className="text-[10px] text-indigo-400 mt-0.5">{batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Tag size={10} /> {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-gray-900 tabular-nums">{stock}</span>
                        <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => stock > 0 && setUseModal(item)}
                          disabled={stock === 0}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                            stock === 0
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                          }`}
                        >
                          <ArrowDownCircle size={13} /> Use Item
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden space-y-3 mb-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              <Package size={28} className="mx-auto mb-2 opacity-30" />No items found.
            </div>
          ) : (
            filtered.map(item => {
              const stock = getItemStock(item._id);
              const status = getStatus(stock, item.minStock);
              const batches = getBatches(item._id);
              return (
                <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Tag size={10} /> {item.category}
                        </span>
                        {batches.length > 0 && (
                          <span className="text-[10px] text-indigo-400">{batches.length} batch{batches.length !== 1 ? "es" : ""}</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">Available Stock</span>
                    <span className="font-bold text-gray-900 tabular-nums">{stock} <span className="text-xs text-slate-400 font-normal">{item.unit}</span></span>
                  </div>
                  <button
                    onClick={() => stock > 0 && setUseModal(item)}
                    disabled={stock === 0}
                    className={`w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition-all ${
                      stock === 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                    }`}
                  >
                    <ArrowDownCircle size={14} /> {stock === 0 ? "Out of Stock" : "Use Item"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/*History */}
        <UsageHistory history={usageHistory} />
      </div>
      {useModal && (
        <UseItemModal
          item={useModal}
          onConfirm={handleUseItem}
          onClose={() => setUseModal(null)}
        />
      )}
    </div>
  );
}
