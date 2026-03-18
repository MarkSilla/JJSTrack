import { useState, useMemo, useEffect } from "react";
import {
  Package, AlertTriangle, TrendingDown, RefreshCw,
  Search, Plus, ChevronDown, Pencil, Trash2,
  ArrowUpCircle, ArrowDownCircle, X, Check,
  Filter, BarChart3, Clock, ShoppingBag, Layers,
  Tag, CheckCircle2, AlertCircle, XCircle,
  Wrench, Sparkles, Link2,
} from "lucide-react";
import { inventoryApi } from "../../services/inventoryApi";
import { fmt } from "../../utils/helpers";

const numberInputStyle = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

const CATEGORIES = ["All", "Sewing", "Fabric", "Fastener", "Tool", "Notions"];
const STATUS_OPTIONS = ["All", "In Stock", "Low Stock", "Out of Stock"];

// Format time for activity log
function formatActivityTime(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  if (activityDate.getTime() === today.getTime()) {
    return `Today, ${timeStr}`;
  } else if (activityDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  } else {
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
  }
}

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
    edit: { bg: "bg-purple-50", Icon: Pencil, cl: "text-purple-600" },
    warn: { bg: "bg-amber-50", Icon: AlertTriangle, cl: "text-amber-500" },
  };
  const { bg, Icon, cl } = cfg[item.type] || cfg.warn;
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

function MobileCard({ item, onAdjust, onEditMax, onDelete }) {
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
        <button onClick={() => onEditMax(item)}
          className="flex items-center justify-center px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors" title="Edit Max Capacity">
          <Pencil size={13} />
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
    onConfirm(item._id, adjType, n);
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
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium appearance-none" />
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
  const [form, setForm] = useState({ name: "", category: "Sewing", stock: "", max: "", unit: "pcs", unitPrice: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleConfirm = () => {
    if (!form.name.trim()) return;
    onConfirm({
      name: form.name.trim(),
      category: form.category,
      stock: parseInt(form.stock) || 0,
      max: parseInt(form.max) || 100,
      unit: form.unit || "pcs",
      unitPrice: parseFloat(form.unitPrice) || 0,
    });
  };

  const fields = [
    { key: "name", label: "Item Name", type: "text", placeholder: "e.g. Sewing Needles" },
    { key: "stock", label: "Initial Stock", type: "number", placeholder: "e.g. 50" },
    { key: "max", label: "Max Capacity", type: "number", placeholder: "e.g. 200" },
    { key: "unit", label: "Unit", type: "text", placeholder: "e.g. pcs, rolls" },
    { key: "unitPrice", label: "Price per Unit", type: "number", placeholder: "e.g. 25.50", step: "0.01" },
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
            <input 
              type={f.type} 
              value={form[f.key]} 
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              step={f.step || undefined}
              className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors ${f.type === "number" ? "appearance-none" : ""}`} />
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

function EditMaxModal({ item, onConfirm, onClose }) {
  const [newMax, setNewMax] = useState(String(item.max || 100));

  const handleConfirm = () => {
    const maxVal = parseInt(newMax);
    if (!newMax.trim() || maxVal <= 0) {
      alert("Max capacity must be greater than 0");
      return;
    }
    if (maxVal < item.stock) {
      alert(`Max capacity cannot be less than current stock (${item.stock})`);
      return;
    }
    onConfirm(maxVal);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-900">Edit Max Capacity</h3>
            <p className="text-xs text-slate-400">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Stock: {item.stock}</label>
          <input
            type="number"
            min={item.stock + 1}
            value={newMax}
            onChange={e => setNewMax(e.target.value)}
            placeholder="Enter new max capacity…"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium appearance-none" />
          <p className="text-xs text-slate-400 mt-1">Must be at least {item.stock}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Check size={15} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventorySystem() {
  return (
    <>
      <style>{numberInputStyle}</style>
      <InventorySystemContent />
    </>
  );
}

function InventorySystemContent() {
  const [inventory, setInventory] = useState([]);
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem("inventoryActivities");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load activities from localStorage:", e);
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statFilter, setStatFilter] = useState("All");
  const [adjModal, setAdjModal] = useState(null);
  const [editMaxModal, setEditMaxModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("inventoryActivities", JSON.stringify(activities));
    } catch (e) {
      console.error("Failed to save activities to localStorage:", e);
    }
  }, [activities]);

  // Fetch inventory data on component mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getAllInventory();
      setInventory(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError("Failed to load inventory");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const lowCount = inventory.filter(i => getStatus(i) === "Low Stock").length;
  const outCount = inventory.filter(i => getStatus(i) === "Out of Stock").length;
  const inStockCount = inventory.filter(i => getStatus(i) === "In Stock").length;
  
  const totalValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + ((item.max || 0) * (item.unitPrice || 0)), 0);
  }, [inventory]);

  const currentValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + ((item.stock || 0) * (item.unitPrice || 0)), 0);
  }, [inventory]);

  const filtered = useMemo(() => inventory.filter(item => {
    const matchQ = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || item.category === catFilter;
    const matchSt = statFilter === "All" || getStatus(item) === statFilter;
    return matchQ && matchCat && matchSt;
  }), [inventory, search, catFilter, statFilter]);

  const STAT_CARDS = [
    { label: "Total Items", value: inventory.length, sub: "All supplies", icon: Package, accent: "#2563EB", bgAccent: "#EFF6FF" },
    { label: "Total Value (Max)", value: fmt(totalValue), sub: "Full capacity cost", icon: ShoppingBag, accent: "#059669", bgAccent: "#ECFDF5" },
    { label: "Current Value", value: fmt(currentValue), sub: "Current stock cost", icon: Layers, accent: "#8B5CF6", bgAccent: "#FAF5FF" },
    { label: "In Stock", value: inStockCount, sub: "Healthy inventory", icon: CheckCircle2, accent: "#10B981", bgAccent: "#F0FDF4" },
    { label: "Low Stock", value: lowCount, sub: "Need restock", icon: AlertTriangle, accent: "#D97706", bgAccent: "#FFFBEB" },
    { label: "Out of Stock", value: outCount, sub: "Immediate action", icon: TrendingDown, accent: "#DC2626", bgAccent: "#FEF2F2" }
  ];

  const pushActivity = (type, text) =>
    setActivities(a => [{ id: Date.now(), type, text, time: formatActivityTime(new Date()) }, ...a]);

  const handleAdjust = async (itemId, type, amount) => {
    try {
      const updatedItem = await inventoryApi.adjustStock(itemId, type, amount);
      setInventory(inv => inv.map(i => i._id === itemId ? updatedItem : i));
      pushActivity(
        type === "increase" ? "add" : "dec",
        type === "increase"
          ? `+${amount} added`
          : `Stock decreased by ${amount}`
      );
      setAdjModal(null);
    } catch (err) {
      console.error("Failed to adjust stock:", err);
      alert("Failed to adjust stock");
    }
  };

  const handleAddItem = async (data) => {
    try {
      const newItem = await inventoryApi.createInventory(data);
      setInventory(inv => [...inv, newItem]);
      pushActivity("add", `New item "${data.name}" added to inventory`);
      setAddModal(false);
    } catch (err) {
      console.error("Failed to add item:", err);
      alert("Failed to add item");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from inventory?`)) return;
    try {
      await inventoryApi.deleteInventory(item._id);
      setInventory(inv => inv.filter(i => i._id !== item._id));
      pushActivity("dec", `"${item.name}" removed from inventory`);
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Failed to delete item");
    }
  };

  const handleEditMax = async (itemId, newMax) => {
    try {
      const updatedItem = await inventoryApi.updateInventory(itemId, { max: newMax });
      setInventory(inv => inv.map(i => i._id === itemId ? updatedItem : i));
      pushActivity("edit", `Max capacity updated to ${newMax}`);
      setEditMaxModal(null);
    } catch (err) {
      console.error("Failed to update max capacity:", err);
      alert("Failed to update max capacity");
    }
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
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
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">Loading...</div>
          ) : filtered.length === 0
            ? <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              <ShoppingBag size={28} className="mx-auto mb-2 opacity-30" />No items found.
            </div>
            : filtered.map(item => (
              <MobileCard key={item._id} item={item}
                onAdjust={(i, t) => setAdjModal({ item: i, type: t })}
                onEditMax={(i) => setEditMaxModal(i)}
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
                {["Item Name", "Category", "Price per Unit", "Stock", "Total Price (Max)", "Total Price (Current)", "Level", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} className="text-center py-12 text-slate-400"><ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />No items found.</td></tr>
                : filtered.map(item => (
                  <tr key={item._id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900">{item.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Tag size={10} /> {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(item.unitPrice || 0)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-900 tabular-nums">{item.stock}</span>
                      <span className="text-slate-400 text-xs"> / {item.max} {item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-blue-600 tabular-nums">{fmt((item.max || 0) * (item.unitPrice || 0))}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-emerald-600 tabular-nums">{fmt((item.stock || 0) * (item.unitPrice || 0))}</span>
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
                        <button onClick={() => setEditMaxModal(item)}
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors" title="Edit Max Capacity">
                          <Pencil size={14} />
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

        {/* RECENT ACTIVITY & CATEGORY BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

          {/* CATEGORY BREAKDOWN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Layers size={14} className="text-purple-600" />
              <p className="text-sm font-bold text-gray-900">Category Breakdown</p>
            </div>
            <div className="px-5 py-4">
              {CATEGORIES.filter(c => c !== "All").map(category => {
                const count = inventory.filter(item => item.category === category).length;
                const categoryConfig = {
                  "Sewing": { Icon: Pencil, color: "text-pink-600", bg: "bg-pink-50" },
                  "Fabric": { Icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
                  "Fastener": { Icon: Link2, color: "text-orange-600", bg: "bg-orange-50" },
                  "Tool": { Icon: Wrench, color: "text-slate-600", bg: "bg-slate-100" },
                  "Notions": { Icon: Sparkles, color: "text-yellow-600", bg: "bg-yellow-50" }
                };
                const { Icon, color, bg } = categoryConfig[category];
                return (
                  <div key={category} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                        <Icon size={16} className={color} />
                      </div>
                      <span className="text-sm text-gray-800 font-medium">{category}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{count}</span>
                  </div>
                );
              })}
            </div>
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
      {editMaxModal && (
        <EditMaxModal
          item={editMaxModal}
          onConfirm={newMax => handleEditMax(editMaxModal._id, newMax)}
          onClose={() => setEditMaxModal(null)}
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