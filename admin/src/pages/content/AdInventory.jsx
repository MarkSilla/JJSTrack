import { useState, useMemo } from "react";
import {
  Package, AlertTriangle, TrendingDown, RefreshCw,
  Search, Plus, ChevronDown, Pencil, Trash2,
  ArrowUpCircle, ArrowDownCircle, X, Check,
  Filter, BarChart3, Clock, ShoppingBag, Layers,
  Tag, CheckCircle2, AlertCircle, XCircle,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

//MOCK DATA 
const INITIAL_INVENTORY = [
  { id: 1, name: "Sewing Needles", category: "Sewing", stock: 12, max: 100, unit: "pcs" },
  { id: 2, name: "Polyester Thread", category: "Sewing", stock: 230, max: 500, unit: "spools" },
  { id: 3, name: "Cotton Thread", category: "Sewing", stock: 85, max: 500, unit: "spools" },
  { id: 4, name: "Fabric Rolls", category: "Fabric", stock: 5, max: 50, unit: "rolls" },
  { id: 5, name: "Buttons (Assorted)", category: "Fastener", stock: 0, max: 300, unit: "pcs" },
  { id: 6, name: "Zippers 20cm", category: "Fastener", stock: 18, max: 150, unit: "pcs" },
  { id: 7, name: "Measuring Tape", category: "Tool", stock: 7, max: 20, unit: "pcs" },
  { id: 8, name: "Tailor's Chalk", category: "Tool", stock: 40, max: 80, unit: "pcs" },
  { id: 9, name: "Elastic Bands", category: "Notions", stock: 15, max: 200, unit: "pcs" },
];

const INITIAL_ACTIVITY = [
  { id: 1, type: "add", text: "+20 Polyester Threads added", time: "Today, 09:14 AM" },
  { id: 2, type: "dec", text: "Sewing Needles decreased by 5", time: "Today, 08:50 AM" },
  { id: 3, type: "warn", text: "Buttons marked as Out of Stock", time: "Yesterday, 4:30 PM" },
  { id: 4, type: "add", text: "+10 Zippers 20cm restocked", time: "Yesterday, 2:00 PM" },
  { id: 5, type: "warn", text: "Fabric Rolls flagged as Low Stock", time: "Mar 12, 11:20 AM" },
  { id: 6, type: "add", text: "+50 Buttons (Assorted) added", time: "Mar 11, 3:05 PM" },
];

const CATEGORIES = ["All", "Sewing", "Fabric", "Fastener", "Tool", "Notions"];
const STATUS_OPTIONS = ["All", "In Stock", "Low Stock", "Out of Stock"];

// HELPERS 
function getStatus(item) {
  if (item.stock === 0) return "Out of Stock";
  const pct = item.stock / item.max;
  if (pct < 0.2) return "Low Stock";
  return "In Stock";
}

function getPct(item) {
  return item.max > 0 ? Math.min(100, Math.round((item.stock / item.max) * 100)) : 0;
}

// STATUS BADGE 
function StatusBadge({ status }) {
  const cfg = {
    "In Stock": { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", Icon: CheckCircle2 },
    "Low Stock": { cls: "bg-amber-50 text-amber-700 border border-amber-200", Icon: AlertCircle },
    "Out of Stock": { cls: "bg-red-50 text-red-700 border border-red-200", Icon: XCircle },
  };
  const { cls, Icon } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={11} /> {status}
    </span>
  );
}

// PROGRESS BAR 
function StockBar({ item }) {
  const pct = getPct(item);
  const status = getStatus(item);
  const color = status === "Out of Stock" ? "bg-red-500" : status === "Low Stock" ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  const variants = {
    blue: "bg-blue-600 text-white border-blue-600",
    yellow: "bg-white border border-slate-200",
    red: "bg-white border border-slate-200",
    slate: "bg-white border border-slate-200",
  };
  const valColor = { blue: "text-white", yellow: "text-amber-500", red: "text-red-500", slate: "text-blue-600" };
  const subColor = { blue: "text-blue-200", yellow: "text-slate-400", red: "text-slate-400", slate: "text-slate-400" };
  const iconBg = { blue: "bg-blue-500/30", yellow: "bg-amber-50", red: "bg-red-50", slate: "bg-blue-50" };
  const iconCl = { blue: "text-white", yellow: "text-amber-500", red: "text-red-500", slate: "text-blue-600" };

  return (
    <div className={`rounded-xl p-4 ${variants[accent]} shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`text-xs font-semibold uppercase tracking-widest ${subColor[accent]}`}>{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg[accent]}`}>
          <Icon size={15} className={iconCl[accent]} />
        </div>
      </div>
      <p className={`text-3xl font-black leading-none ${valColor[accent]}`}>{value}</p>
      <p className={`text-xs mt-1 ${subColor[accent]}`}>{sub}</p>
    </div>
  );
}

function ActivityItem({ item }) {
  const cfg = {
    add: { bg: "bg-emerald-50", Icon: ArrowUpCircle, cl: "text-emerald-600" },
    dec: { bg: "bg-red-50", Icon: ArrowDownCircle, cl: "text-red-500" },
    warn: { bg: "bg-amber-50", Icon: AlertTriangle, cl: "text-amber-500" },
  };
  const { bg, Icon, cl } = cfg[item.type];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon size={15} className={cl} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">{item.text}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={10} />{item.time}</p>
      </div>
    </div>
  );
}

function MobileCard({ item, onAdjust, onDelete }) {
  const status = getStatus(item);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900 text-sm">{item.name}</p>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Tag size={10} /> {item.category}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Stock Level</span>
          <span className="font-semibold text-gray-800 tabular-nums">{item.stock} / {item.max} {item.unit}</span>
        </div>
        <StockBar item={item} />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onAdjust(item, "increase")}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
          <ArrowUpCircle size={13} /> Add Stock
        </button>
        <button onClick={() => onAdjust(item, "decrease")}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowDownCircle size={13} /> Remove
        </button>
        <button onClick={() => onDelete(item)}
          className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function AdjustModal({ item, type: initialType, onConfirm, onClose }) {
  const [adjType, setAdjType] = useState(initialType);
  const [amount, setAmount] = useState("");

  const handleConfirm = () => {
    const n = parseInt(amount);
    if (!n || n < 1) return;
    onConfirm(item.id, adjType, n);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />

        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-black text-gray-900">Adjust Stock</h3>
            <p className="text-sm text-slate-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl px-4 py-3 my-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Current Stock</span>
          <span className="text-xl font-black text-gray-900 tabular-nums">{item.stock} <span className="text-sm font-normal text-slate-400">{item.unit}</span></span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setAdjType("increase")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${adjType === "increase" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>
            <ArrowUpCircle size={15} /> Increase
          </button>
          <button onClick={() => setAdjType("decrease")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${adjType === "decrease" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>
            <ArrowDownCircle size={15} /> Decrease
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity</label>
          <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount…"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Check size={15} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ onConfirm, onClose }) {
  const [form, setForm] = useState({ name: "", category: "Sewing", stock: "", max: "", unit: "pcs" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleConfirm = () => {
    if (!form.name.trim()) return;
    onConfirm({
      name: form.name.trim(),
      category: form.category,
      stock: parseInt(form.stock) || 0,
      max: parseInt(form.max) || 100,
      unit: form.unit || "pcs",
    });
  };

  const fields = [
    { key: "name", label: "Item Name", type: "text", placeholder: "e.g. Sewing Needles" },
    { key: "stock", label: "Initial Stock", type: "number", placeholder: "e.g. 50" },
    { key: "max", label: "Max Capacity", type: "number", placeholder: "e.g. 200" },
    { key: "unit", label: "Unit", type: "text", placeholder: "e.g. pcs, rolls" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-900">Add New Item</h3>
            <p className="text-xs text-slate-400">Fill in supply details</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
        </div>

        {fields.map(f => (
          <div key={f.key} className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
          </div>
        ))}

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white">
            {["Sewing", "Fabric", "Fastener", "Tool", "Notions"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventorySystem() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [activities, setActivities] = useState(INITIAL_ACTIVITY);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statFilter, setStatFilter] = useState("All");
  const [adjModal, setAdjModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const lowCount = inventory.filter(i => getStatus(i) === "Low Stock").length;
  const outCount = inventory.filter(i => getStatus(i) === "Out of Stock").length;

  const filtered = useMemo(() => inventory.filter(item => {
    const matchQ = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || item.category === catFilter;
    const matchSt = statFilter === "All" || getStatus(item) === statFilter;
    return matchQ && matchCat && matchSt;
  }), [inventory, search, catFilter, statFilter]);

  const STAT_CARDS = [
    { label: "Total Items", value: inventory.length, sub: "All supplies", icon: Package, accent: "#2563EB", bgAccent: "#EFF6FF" },
    { label: "Low Stock", value: lowCount, sub: "Need restock", icon: AlertTriangle, accent: "#D97706", bgAccent: "#FFFBEB" },
    { label: "Out of Stock", value: outCount, sub: "Immediate action", icon: TrendingDown, accent: "#DC2626", bgAccent: "#FEF2F2" },
    { label: "Last Updated", value: "Today", sub: "Mar 13, 2026", icon: RefreshCw, accent: "#7C3AED", bgAccent: "#F5F3FF" }
  ];

  const pushActivity = (type, text) =>
    setActivities(a => [{ id: Date.now(), type, text, time: "Just now" }, ...a]);

  const handleAdjust = (itemId, type, amount) => {
    setInventory(inv => inv.map(i => {
      if (i.id !== itemId) return i;
      const newStock = type === "increase"
        ? Math.min(i.max, i.stock + amount)
        : Math.max(0, i.stock - amount);
      pushActivity(
        type === "increase" ? "add" : "dec",
        type === "increase"
          ? `+${amount} ${i.name} added`
          : `${i.name} stock decreased by ${amount}`
      );
      return { ...i, stock: newStock };
    }));
    setAdjModal(null);
  };

  const handleAddItem = (data) => {
    const newItem = { id: Date.now(), ...data };
    setInventory(inv => [...inv, newItem]);
    pushActivity("add", `New item "${data.name}" added to inventory`);
    setAddModal(false);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Delete "${item.name}" from inventory?`)) return;
    setInventory(inv => inv.filter(i => i.id !== item.id));
    pushActivity("dec", `"${item.name}" removed from inventory`);
  };

  const alertCount = lowCount + outCount;

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <div className="px-3 lg:px-1 py-2 top-0 z-100">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage tailoring supplies</p>
        </div>

        {/* ALERT 
        {!alertDismissed && alertCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-xl p-4 mb-6">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800 flex-1">
              <strong>{alertCount} item{alertCount > 1 ? "s" : ""}</strong> need{alertCount === 1 ? "s" : ""} attention —{" "}
              {lowCount > 0 && `${lowCount} low stock`}{lowCount > 0 && outCount > 0 && ", "}
              {outCount > 0 && `${outCount} out of stock`}.
            </p>
            <button onClick={() => setAlertDismissed(true)} className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        )} */}

        {/* STAT */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, }) => (
            <div
              key={label}
              className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: bgAccent }}>
                  <Icon size={16} color={accent} strokeWidth={2.2} />
                </div>
                <span className="text-[12px] font-semibold text-gray-500">{label}</span>
              </div>
              <div className=" mt-[-6px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="flex flex-1 gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors" />
            </div>

            {/* Filters */}
            <div className="flex gap-1">
              <div className="relative">
                <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="pl-6 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={statFilter}
                  onChange={e => setStatFilter(e.target.value)}
                  className="w-23 pl-2 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer truncate"
                >
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Add */}
          <button onClick={() => setAddModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0">
            <Plus size={15} /> Add Item
          </button>
        </div>

        <div className="lg:hidden space-y-3 mb-8">
          <p className="text-sm font-bold text-gray-900">All Supplies <span className="text-slate-400 font-normal">({filtered.length})</span></p>
          {filtered.length === 0
            ? <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              <ShoppingBag size={28} className="mx-auto mb-2 opacity-30" />No items found.
            </div>
            : filtered.map(item => (
              <MobileCard key={item.id} item={item}
                onAdjust={(i, t) => setAdjModal({ item: i, type: t })}
                onDelete={handleDelete} />
            ))
          }
        </div>
        <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={15} className="text-blue-600" /> All Supplies
              <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">{filtered.length}</span>
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Item Name", "Category", "Stock", "Level", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} className="text-center py-12 text-slate-400"><ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />No items found.</td></tr>
                : filtered.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900">{item.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Tag size={10} /> {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-900 tabular-nums">{item.stock}</span>
                      <span className="text-slate-400 text-xs"> / {item.max} {item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 w-40"><StockBar item={item} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={getStatus(item)} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setAdjModal({ item, type: "increase" })}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Add Stock">
                          <ArrowUpCircle size={14} />
                        </button>
                        <button onClick={() => setAdjModal({ item, type: "decrease" })}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Remove Stock">
                          <ArrowDownCircle size={14} />
                        </button>
                        <button onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock size={14} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-900">Recent Activity</p>
          </div>
          <div className="px-5 divide-y divide-slate-100">
            {activities.slice(0, 6).map(a => <ActivityItem key={a.id} item={a} />)}
          </div>
        </div>

      </div>

      {adjModal && (
        <AdjustModal
          item={adjModal.item}
          type={adjModal.type}
          onConfirm={handleAdjust}
          onClose={() => setAdjModal(null)}
        />
      )}
      {addModal && (
        <AddItemModal
          onConfirm={handleAddItem}
          onClose={() => setAddModal(false)}
        />
      )}
    </div>
  );
}