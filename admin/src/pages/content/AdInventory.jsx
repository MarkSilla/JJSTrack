import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Package, AlertTriangle, TrendingDown, RefreshCw, Search, Plus, ChevronDown, Pencil, Archive, RotateCcw, ArrowUpCircle, ArrowDownCircle, X, Check, Filter, BarChart3, Clock, ShoppingBag, Layers,
  Tag, CheckCircle2, AlertCircle, XCircle, SlidersHorizontal, ArrowUpDown,
  Wrench, Sparkles, Link2,
} from "lucide-react";
import ArchiveConfirmModal from './ArchiveConfirmModal.jsx';
import { getInventoryUpdatesWebSocketUrl, inventoryApi } from "../../services/inventoryApi";
import { fmt } from "../../utils/helpers.js";

const numberInputStyle = `../../services/inventoryApi.js
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

const SORT_INVENTORY_OPTIONS = [
  { value: 'newest', label: 'Newest → Oldest' },
  { value: 'oldest', label: 'Oldest → Newest' },
  { value: 'name-az', label: 'Name A → Z' },
  { value: 'name-za', label: 'Name Z → A' },
];

const SOCKET_RECONNECT_MS = 2500;
const SOCKET_REFRESH_DEBOUNCE_MS = 200;

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

function mapActivityRecord(activity) {
  const createdAt = activity?.createdAt ? new Date(activity.createdAt) : new Date();
  return {
    id: activity?._id || `${activity?.inventoryId || "activity"}-${createdAt.getTime()}`,
    type: activity?.type || "warn",
    text: activity?.text || "Inventory updated",
    time: formatActivityTime(createdAt),
  };
}

// HELPERS 
function getStatus(item) {
  if (item.stock === 0) return "Out of Stock";
  if (item.stock < (item.minStock || 5)) return "Low Stock";
  return "In Stock";
}

function getMaxStock(item) {
  const currentStock = Number(item?.stock) || 0;
  const trackedMax = Number(item?.maxStock ?? item?.initialStock ?? 0) || 0;
  return Math.max(currentStock, trackedMax, 0);
}

// Calculate string similarity using Levenshtein distance
function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function getPct(item) {
  const currentStock = Math.max(0, Number(item?.stock) || 0);
  const stockCap = Math.max(1, getMaxStock(item));
  const pct = Math.round((currentStock / stockCap) * 100);
  return Math.min(100, Math.max(0, pct));
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
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

function StatCard({ label, value, sub, icon: Icon, accent, bgAccent }) {
  return (
    <div
      className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: bgAccent }}>
            <Icon size={16} color={accent} strokeWidth={2.2} />
          </div>
          <span className="text-[12px] font-semibold text-gray-500">{label}</span>
        </div>
      </div>
      <div className="mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">
        {value}
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
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

function MobileCard({ item, onAdjust, onArchive, onUpdate, isArchived }) {
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
          <span className="font-semibold text-gray-800 tabular-nums">{item.stock}/{getMaxStock(item)} {item.unit}</span>
        </div>
        <StockBar item={item} />
      </div>

      <div className="flex gap-2 pt-1">
        {!isArchived ? (
          <>
            <button onClick={() => onAdjust(item, "increase")}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              <ArrowUpCircle size={13} /> Add Stock
            </button>
            <button onClick={() => onAdjust(item, "decrease")}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <ArrowDownCircle size={13} /> Remove
            </button>
            <button onClick={() => onUpdate(item)}
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors" title="Edit">
              <Pencil size={13} />
            </button>
            <button onClick={() => onArchive(item._id, false)}
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Archive">
              <Archive size={13} />
            </button>
          </>
        ) : (
          <button onClick={() => onArchive(item._id, true)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
            <RotateCcw size={13} /> Restore
          </button>
        )}
      </div>
    </div>
  );
}

function UpdateModal({ item, onConfirm, onClose }) {
  const categoryButtonRef = useRef(null);
  const [categoryMenuStyle, setCategoryMenuStyle] = useState({});
  const [form, setForm] = useState({
    name: item.name || "",
    category: item.category || "Sewing",
    unit: item.unit || "pcs",
    unitPrice: item.unitPrice || "",
    minStock: item.minStock || 5
  });
  const [confirmModal, setConfirmModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Check if form has changed from original
  const hasChanges = form.name !== item.name || 
                     form.category !== item.category || 
                     form.unit !== item.unit || 
                     form.unitPrice !== item.unitPrice || 
                     form.minStock !== item.minStock;

  const handleConfirm = () => {
    if (!form.name.trim()) return;
    const minStockValue = parseInt(form.minStock) || 5;
    
    if (minStockValue < 0) {
      alert("Min stock cannot be negative");
      return;
    }
    
    setConfirmModal(true);
  };

  const handleConfirmUpdate = () => {
    onConfirm(item._id, {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit || "pcs",
      unitPrice: parseFloat(form.unitPrice) || 0,
      minStock: parseInt(form.minStock) || 5,
    });
  };

  const fields = [
    { key: "name", label: "Item Name", type: "text", placeholder: "e.g. Sewing Needles" },
    { key: "unit", label: "Unit", type: "text", placeholder: "e.g. pcs, rolls" },
    { key: "unitPrice", label: "Price per Unit", type: "number", placeholder: "e.g. 25.50", step: "0.01" },
    { key: "minStock", label: "Min Stock", type: "number", placeholder: "e.g. 5" },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
        <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black text-gray-900">Update Item</h3>
              <p className="text-xs text-slate-400">Edit item details</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Item Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Sewing Needles"
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors border-slate-200 focus:border-blue-500" />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
            <div className="relative">
              <button
                ref={categoryButtonRef}
                onClick={() => {
                  const next = !showCategoryModal;
                  if (!next) {
                    setShowCategoryModal(false);
                    return;
                  }
                  const rect = categoryButtonRef.current?.getBoundingClientRect();
                  if (rect) {
                    setCategoryMenuStyle({
                      position: 'fixed',
                      top: rect.bottom + window.scrollY + 6,
                      left: rect.left + window.scrollX,
                      minWidth: rect.width,
                      maxHeight: '240px',
                      overflowY: 'auto',
                      zIndex: 9999,
                      backgroundColor: 'white',
                      border: '1px solid #CBD5E1',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    });
                  }
                  setShowCategoryModal(true);
                }}
                className="flex items-center gap-1.5 pl-3 pr-3 py-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer justify-between"
              >
                <span className="truncate">{form.category}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${showCategoryModal ? 'rotate-180' : ''}`} />
              </button>
              {showCategoryModal && (
                <div style={categoryMenuStyle}>
                  {["Sewing", "Fabric", "Fastener", "Tool", "Notions"].map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        set("category", c);
                        setShowCategoryModal(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer border-none hover:bg-slate-50 hover:shadow-sm ${form.category === c ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {fields.filter(f => f.key !== "name").map(f => (
            <div key={f.key} className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                step={f.step || undefined}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${f.type === "number" ? "appearance-none" : ""} border-slate-200 focus:border-blue-500`} />
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleConfirm} disabled={!hasChanges} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              hasChanges ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"
            }`}>
              <Check size={15} /> Update
            </button>
          </div>
        </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setConfirmModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Confirm Update</h3>
                <p className="text-sm text-slate-500 mt-1">Are you sure you want to update this item details?</p>
              </div>
              <button onClick={() => setConfirmModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600"><strong className="text-gray-900">{form.name}</strong></p>
              <p className="text-xs text-slate-400 mt-1">Changes will be saved permanently</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleConfirmUpdate} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Check size={15} /> Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
          <span className="text-xl font-black text-gray-900 tabular-nums">
            {item.stock}/{getMaxStock(item)} <span className="text-sm font-normal text-slate-400">{item.unit}</span>
          </span>
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

function SimilarItemModal({ similarItem, onUseSimilar, onCreateNew, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">Similar Item Found</h3>
            <p className="text-sm text-slate-500 mt-1">We found an existing item with a similar name</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
          <p className="text-sm font-semibold text-gray-900">{similarItem.name}</p>
          <p className="text-xs text-slate-500 mt-2">
            <span className="text-slate-400">Category:</span> {similarItem.category}
          </p>
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">Unit:</span> {similarItem.unit}
          </p>
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">Current Stock:</span> {similarItem.stock}/{getMaxStock(similarItem)} {similarItem.unit}
          </p>
        </div>

        <p className="text-sm text-slate-600 mb-6">Did you mean to use this item instead?</p>

        <div className="flex gap-3">
          <button onClick={onCreateNew} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Create New</button>
          <button onClick={() => onUseSimilar(similarItem)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
            <Check size={15} /> Use {similarItem.name.split(' ')[0]}
          </button>
        </div>
      </div>
    </div>
  );
}

function DuplicateItemModal({ existingItem, newData, onUpdateExisting, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">Item Already Exists</h3>
            <p className="text-sm text-slate-500 mt-1">An item with the same name and unit is already in inventory</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
          <p className="text-sm font-semibold text-gray-900">{existingItem.name}</p>
          <p className="text-xs text-slate-500 mt-2">
            <span className="text-slate-400">Unit:</span> {existingItem.unit}
          </p>
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">Current Price:</span> {fmt(existingItem.unitPrice || 0)}
          </p>
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">New Price:</span> {fmt(newData.unitPrice || 0)}
          </p>
        </div>

        <p className="text-sm text-slate-600 mb-6">Would you like to update the existing item instead?</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => onUpdateExisting(existingItem)} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Pencil size={15} /> Update Existing
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ onConfirm, onClose, inventory = [] }) {
  const categoryButtonRef = useRef(null);
  const [categoryMenuStyle, setCategoryMenuStyle] = useState({});
  const [form, setForm] = useState({ name: "", category: "Sewing", stock: "", minStock: "", unit: "pcs", unitPrice: "" });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleConfirm = () => {
    if (!form.name.trim()) return;
    const stockValue = parseInt(form.stock) || 0;
    const minStockValue = parseInt(form.minStock) || 5;
    
    if (stockValue < 0) {
      alert("Current stock cannot be negative");
      return;
    }
    
    if (minStockValue < 0) {
      alert("Min stock cannot be negative");
      return;
    }
    
    const newData = {
      name: form.name.trim(),
      category: form.category,
      stock: stockValue,
      minStock: minStockValue,
      unit: form.unit || "pcs",
      unitPrice: parseFloat(form.unitPrice) || 0,
    };
    
    onConfirm(newData);
  };

  const fields = [
    { key: "name", label: "Item Name", type: "text", placeholder: "e.g. Sewing Needles" },
    { key: "stock", label: "Current Stock", type: "number", placeholder: "e.g. 50" },
    { key: "minStock", label: "Min Stock", type: "number", placeholder: "e.g. 5" },
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

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Item Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Sewing Needles"
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors border-slate-200 focus:border-blue-500" />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
          <div className="relative">
            <button
              ref={categoryButtonRef}
              onClick={() => {
                const next = !showCategoryModal;
                if (!next) {
                  setShowCategoryModal(false);
                  return;
                }
                const rect = categoryButtonRef.current?.getBoundingClientRect();
                if (rect) {
                  setCategoryMenuStyle({
                    position: 'fixed',
                    top: rect.bottom + window.scrollY + 6,
                    left: rect.left + window.scrollX,
                    minWidth: rect.width,
                    maxHeight: '240px',
                    overflowY: 'auto',
                    zIndex: 9999,
                    backgroundColor: 'white',
                    border: '1px solid #CBD5E1',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  });
                }
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-1.5 pl-3 pr-3 py-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer justify-between"
            >
              <span className="truncate">{form.category}</span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${showCategoryModal ? 'rotate-180' : ''}`} />
            </button>
            {showCategoryModal && (
              <div style={categoryMenuStyle}>
                {["Sewing", "Fabric", "Fastener", "Tool", "Notions"].map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      set("category", c);
                      setShowCategoryModal(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer border-none hover:bg-slate-50 hover:shadow-sm ${form.category === c ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {fields.filter(f => f.key !== "name").map(f => (
          <div key={f.key} className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {f.label}
            </label>
            <input
              type={f.type}
              value={form[f.key]}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              step={f.step || undefined}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${f.type === "number" ? "appearance-none" : ""} border-slate-200 focus:border-blue-500`} />
          </div>
        ))}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Plus size={15} /> Add New Item
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
  const location = useLocation();
  const [inventory, setInventory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statFilter, setStatFilter] = useState("All");
const [sortBy, setSortBy] = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [adjModal, setAdjModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [duplicateModal, setDuplicateModal] = useState(null);
  const [similarModal, setSimilarModal] = useState(null);
  const [pendingAddData, setPendingAddData] = useState(null);
  const [archiveConfirm, setArchiveConfirm] = useState({ show: false, id: null, isRestore: false, itemName: '' });
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  const refreshInventoryPage = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [inventoryData, activityData] = await Promise.all([
        inventoryApi.getAllInventory(),
        inventoryApi.getInventoryActivity(20),
      ]);

      setInventory(inventoryData);
      setActivities(activityData.map(mapActivityRecord));
      setError(null);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("Failed to load inventory page:", err);

      if (showLoader) {
        setError("Failed to load inventory");
        setInventory([]);
        setActivities([]);
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await inventoryApi.getInventoryActivity(20);
      setActivities(data.map(mapActivityRecord));
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("Failed to fetch inventory activity:", err);
    }
  };

  useEffect(() => {
    const preset = location.state?.dashboardPreset;
    if (!preset) return;

    if (typeof preset.search === "string") setSearch(preset.search);
    if (typeof preset.catFilter === "string") setCatFilter(preset.catFilter);
    if (typeof preset.statFilter === "string") setStatFilter(preset.statFilter);
    if (typeof preset.sortBy === "string") setSortBy(preset.sortBy);
    if (typeof preset.showArchived === "boolean") setShowArchived(preset.showArchived);

    setShowCategory(false);
    setShowStatus(false);
    setShowSort(false);
  }, [location.state]);

  useEffect(() => {
    void refreshInventoryPage({ showLoader: true });
  }, []);

  useEffect(() => {
    let isDisposed = false;

    const scheduleInventoryRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        if (!isDisposed) {
          void refreshInventoryPage();
        }
      }, SOCKET_REFRESH_DEBOUNCE_MS);
    };

    const connectInventorySocket = () => {
      if (isDisposed) return;

      setSocketStatus("connecting");

      const socket = new WebSocket(getInventoryUpdatesWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isDisposed) {
          setSocketStatus("connected");
          void refreshInventoryPage();
        }
      };

      socket.onmessage = (event) => {
        if (isDisposed) return;

        try {
          const message = JSON.parse(event.data);

          if (message?.type === "inventory:changed") {
            scheduleInventoryRefresh();
          }
        } catch (socketError) {
          console.error("Failed to parse inventory socket message:", socketError);
        }
      };

      socket.onerror = () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };

      socket.onclose = () => {
        if (isDisposed) return;

        setSocketStatus("disconnected");
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectInventorySocket();
        }, SOCKET_RECONNECT_MS);
      };
    };

    connectInventorySocket();

    return () => {
      isDisposed = true;

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        socketRef.current.close();
      }
    };
  }, []);

  const activeInventory = inventory.filter(i => !i.archived);
  const archivedInventory = inventory.filter(i => i.archived);
  const lowCount = activeInventory.filter(i => getStatus(i) === "Low Stock").length;
  const outCount = activeInventory.filter(i => getStatus(i) === "Out of Stock").length;
  const inStockCount = activeInventory.filter(i => getStatus(i) === "In Stock").length;

  const totalValue = useMemo(() => {
    return activeInventory.reduce((sum, item) => sum + (getMaxStock(item) * (item.unitPrice || 0)), 0);
  }, [activeInventory]);

  const currentValue = useMemo(() => {
    return activeInventory.reduce((sum, item) => sum + ((item.stock || 0) * (item.unitPrice || 0)), 0);
  }, [activeInventory]);

  const filtered = useMemo(() => {
    let items = [];
    const source = showArchived ? archivedInventory : activeInventory;
    items = source.filter(item => {
      const matchQ = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "All" || item.category === catFilter;
      const matchSt = statFilter === "All" || getStatus(item) === statFilter;
      return matchQ && matchCat && matchSt;
    });

    // Apply sorting
    if (sortBy === 'newest') items = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') items = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'name-az') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name-za') items = [...items].sort((a, b) => b.name.localeCompare(a.name));

    return items;
  }, [activeInventory, archivedInventory, search, catFilter, statFilter, showArchived, sortBy]);

const STAT_CARDS = [
    { label: "Total Items", value: activeInventory.length, sub: "Active supplies", icon: Package, accent: "#2563EB", bgAccent: "#EFF6FF" },
    { label: "Total Value", value: fmt(totalValue), sub: "Current inventory cost", icon: ShoppingBag, accent: "#059669", bgAccent: "#ECFDF5" },
    { label: "Current Value", value: fmt(currentValue), sub: "Current stock cost", icon: Layers, accent: "#8B5CF6", bgAccent: "#FAF5FF" },
    { label: "In Stock", value: inStockCount, sub: "Healthy inventory", icon: CheckCircle2, accent: "#10B981", bgAccent: "#F0FDF4" },
    { label: "Low Stock", value: lowCount, sub: "Need restock", icon: AlertTriangle, accent: "#D97706", bgAccent: "#FFFBEB" },
    { label: "Out of Stock", value: outCount, sub: "Critical - reorder ASAP", icon: XCircle, accent: "#DC2626", bgAccent: "#FEF2F2" },
    { label: "Archived", value: archivedInventory.length, sub: "Out of service", icon: Archive, accent: "#6366F1", bgAccent: "#EEF2FF" }
  ];

  const handleAdjust = async (itemId, type, amount) => {
    try {
      const updatedItem = await inventoryApi.adjustStock(itemId, type, amount);
      setInventory(inv => inv.map(i => i._id === itemId ? updatedItem : i));
      await fetchActivities();
      setAdjModal(null);
    } catch (err) {
      console.error("Failed to adjust stock:", err);
      alert("Failed to adjust stock");
    }
  };

  const handleAddItem = async (data) => {
    try {
      // Check for existing item with same name and unit
      const existingItem = inventory.find(item => 
        item.name.toLowerCase() === data.name.toLowerCase() && 
        item.unit.toLowerCase() === data.unit.toLowerCase() &&
        !item.archived
      );

      if (existingItem) {
        // Show duplicate modal instead of adding
        setDuplicateModal({ existingItem, newData: data });
        setPendingAddData(data);
        return;
      }

      // Check for similar items (fuzzy match)
      const SIMILARITY_THRESHOLD = 0.75; // 75% similarity
      const similarItem = inventory.find(item => {
        if (item.archived) return false;
        const similarity = stringSimilarity(data.name, item.name);
        return similarity >= SIMILARITY_THRESHOLD && similarity < 1; // Don't count exact matches
      });

      if (similarItem) {
        // Show similar item suggestion modal
        setSimilarModal(similarItem);
        setPendingAddData(data);
        return;
      }

      // No duplicate or similar item found, proceed with adding
      const result = await inventoryApi.createInventory(data);
      
      if (result.isUpdate) {
        setInventory(inv => inv.map(i => i._id === result._id ? result : i));
      } else {
        setInventory(inv => [...inv, result]);
      }
      await fetchActivities();
      setAddModal(false);
    } catch (err) {
      console.error("Failed to add item:", err);
      alert("Failed to add item");
    }
  };

  const handleUseSimilarItem = (similarItem) => {
    // Close similar modal, open update modal for the similar item
    setAddModal(false);
    setSimilarModal(null);
    setPendingAddData(null);
    setUpdateModal(similarItem);
  };

  const handleCreateNewAnyway = async () => {
    // Proceed to create the new item despite similar item existing
    setSimilarModal(null);
    if (pendingAddData) {
      try {
        const result = await inventoryApi.createInventory(pendingAddData);
        if (result.isUpdate) {
          setInventory(inv => inv.map(i => i._id === result._id ? result : i));
        } else {
          setInventory(inv => [...inv, result]);
        }
        await fetchActivities();
        setAddModal(false);
      } catch (err) {
        console.error("Failed to add item:", err);
        alert("Failed to add item");
      }
      setPendingAddData(null);
    }
  };

  const handleUpdateFromDuplicate = (existingItem) => {
    // Close add and duplicate modals, open update modal for the existing item
    setAddModal(false);
    setDuplicateModal(null);
    setPendingAddData(null);
    setUpdateModal(existingItem);
  };

  const handleUpdate = async (itemId, data) => {
    try {
      const updatedItem = await inventoryApi.updateInventory(itemId, data);
      setInventory(inv => inv.map(i => i._id === itemId ? updatedItem : i));
      await fetchActivities();
      setUpdateModal(null);
    } catch (err) {
      console.error("Failed to update item:", err);
      alert("Failed to update item");
    }
  };

  const handleArchive = async (itemId, restore = false) => {
    try {
      const item = inventory.find(i => i._id === itemId);
      setArchiveConfirm({ 
        show: true, 
        id: itemId, 
        isRestore: restore, 
        itemName: item.name 
      });
    } catch (err) {
      console.error("Error finding item:", err);
    }
  };

  const handleArchiveConfirm = async () => {
    try {
      const { id, isRestore } = archiveConfirm;
      const item = inventory.find(i => i._id === id);
      const updatedItem = isRestore 
        ? await inventoryApi.restoreInventory(id)
        : await inventoryApi.archiveInventory(id);
      
      setInventory(inv => inv.map(i => i._id === id ? updatedItem : i));
      await fetchActivities();
      setArchiveConfirm({ show: false, id: null, isRestore: false, itemName: '' });
    } catch (err) {
      console.error("Failed to archive/restore item:", err);
      alert(archiveConfirm.isRestore ? "Failed to restore item" : "Failed to archive item");
    }
  };

  const handleArchiveCancel = () => {
    setArchiveConfirm({ show: false, id: null, isRestore: false, itemName: '' });
  };

  const alertCount = lowCount + outCount;

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <div className="px-4 lg:px-6 py-2 top-0 z-100">

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-3">
          {STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, }) => (
            <div
              key={label}
              className="bg-white rounded-2xl py-2.5 px-3 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: bgAccent }}>
                  <Icon size={15} color={accent} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-semibold text-gray-500">{label}</span>
              </div>
              <div className="mt-[-4px] text-[14px] font-extrabold text-gray-900 leading-none tracking-tight pl-[40px]">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 pl-[40px]">{sub}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
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
              {/* Category Filter */}
              <div className="relative inline-block">
                <button
                  onClick={() => setShowCategory(v => !v)}
                  className="flex items-center gap-1.5 pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer min-w-[100px]"
                >
                  <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <span className="truncate">{catFilter === "All" ? "Category" : catFilter}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${showCategory ? 'rotate-180' : ''}`} />
                </button>
                {showCategory && (
                  <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] py-1 w-[140px] max-h-48 overflow-y-auto">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => { 
                          setCatFilter(c); 
                          setShowCategory(false); 
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none hover:bg-slate-50 ${catFilter === c ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowStatus(v => !v)}
                  className="flex items-center gap-1.5 pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer min-w-[110px]"
                >
                  <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <span className="truncate">{statFilter === "All" ? "Status" : statFilter}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${showStatus ? 'rotate-180' : ''}`} />
                </button>
                {showStatus && (
                  <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] py-1 w-[120px] max-h-48 overflow-y-auto">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => { 
                          setStatFilter(s); 
                          setShowStatus(false); 
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none hover:bg-slate-50 ${statFilter === s ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSort(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer group"
                >
                  <SlidersHorizontal size={13} className="text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                  <span className="truncate max-w-[90px]">Sort</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${showSort ? 'rotate-180 scale-110' : ''}`} />
                </button>
                {showSort && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] py-1 w-44 max-h-48 overflow-y-auto ring-1 ring-black/5">
                    {SORT_INVENTORY_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { 
                          setSortBy(o.value); 
                          setShowSort(false); 
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer border-none hover:bg-slate-50 hover:shadow-sm ${sortBy === o.value ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`hidden lg:flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
              socketStatus === "connected"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <RefreshCw
                size={13}
                className={`${
                  socketStatus === "connected" ? "text-emerald-600" : "text-amber-600"
                } ${socketStatus === "connected" ? "" : "animate-spin"}`}
              />
              <div className="leading-tight">
                <p className={`text-[11px] font-semibold ${
                  socketStatus === "connected" ? "text-emerald-700" : "text-amber-700"
                }`}>
                  {socketStatus === "connected"
                    ? "Live sync active"
                    : socketStatus === "connecting"
                      ? "Connecting live sync..."
                      : "Reconnecting live sync..."}
                </p>
                <p className="text-[10px] text-slate-400">
                  {lastSyncedAt
                    ? `Last sync ${lastSyncedAt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}`
                    : "Waiting for inventory updates"}
                </p>
              </div>
            </div>
            <button
              onClick={() => void refreshInventoryPage()}
              className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw size={14} />
              Sync Now
            </button>
            <button onClick={() => setAddModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0">
              <Plus size={15} /> Add New Item
            </button>
          </div>
        </div>

        <div className="lg:hidden space-y-3 mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900">All Supplies <span className="text-slate-400 font-normal">({filtered.length})</span></p>
            <button onClick={() => setShowArchived(!showArchived)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                showArchived 
                  ? "bg-indigo-100 text-indigo-700" 
                  : "bg-slate-100 text-slate-600"
              }`}>
              {showArchived ? (
                <>
                  <Archive size={13} /> Archived
                </>
              ) : (
                <>
                  <Package size={13} /> Active
                </>
              )}
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">Loading...</div>
          ) : filtered.length === 0
            ? <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              <ShoppingBag size={28} className="mx-auto mb-2 opacity-30" />No items found.
            </div>
            : filtered.map(item => (
              <MobileCard key={item._id} item={item}
                onAdjust={(i, t) => setAdjModal({ item: i, type: t })}
                onUpdate={(item) => setUpdateModal(item)}
                onArchive={handleArchive}
                isArchived={showArchived} />
            ))
          }
        </div>
        <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={15} className="text-blue-600" /> All Supplies
              <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">{filtered.length}</span>
            </p>
            <button onClick={() => setShowArchived(!showArchived)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                showArchived 
                  ? "bg-indigo-100 text-indigo-700" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {showArchived ? (
                <>
                  <Archive size={13} /> Archived Items
                </>
              ) : (
                <>
                  <Package size={13} /> Active Items
                </>
              )}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Item Name", "SKU", "Category", "Price per Unit", "Stock", "Total Price (Max)", "Total Price (Current)", "Status", "Date Added", "Last Activity", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={12} className="text-center py-12 text-slate-400"><ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />No items found.</td></tr>
                : filtered.map(item => (
                  <tr key={item._id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{item.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                        {item.sku || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Tag size={10} /> {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(item.unitPrice || 0)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 tabular-nums">{item.stock}/{getMaxStock(item)}</span>
                      <span className="text-slate-400 text-xs"> {item.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-blue-600 tabular-nums">{fmt(getMaxStock(item) * (item.unitPrice || 0))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-600 tabular-nums">{fmt((item.stock || 0) * (item.unitPrice || 0))}</span>
                    </td>

                    <td className="px-4 py-3"><StatusBadge status={getStatus(item)} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {item.lastActivityDate ? formatActivityTime(new Date(item.lastActivityDate)) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!showArchived ? (
                          <>
                            <button onClick={() => setAdjModal({ item, type: "increase" })}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Add Stock">
                              <ArrowUpCircle size={14} />
                            </button>
                            <button onClick={() => setAdjModal({ item, type: "decrease" })}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Remove Stock">
                              <ArrowDownCircle size={14} />
                            </button>
                            <button onClick={() => setUpdateModal(item)}
                              className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleArchive(item._id, false)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Archive">
                              <Archive size={14} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleArchive(item._id, true)}
                            className="flex-1 p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold flex items-center justify-center gap-1" title="Restore">
                            <RotateCcw size={14} /> Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* RECENT ACTIVITY & CATEGORY BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* RECENT ACTIVITY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Clock size={14} className="text-blue-600" />
              <p className="text-sm font-bold text-gray-900">Recent Activity</p>
            </div>
            <div className="px-4 divide-y divide-slate-100">
              {activities.slice(0, 6).map(a => <ActivityItem key={a.id} item={a} />)}
            </div>
          </div>

          {/* CATEGORY BREAKDOWN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Layers size={14} className="text-purple-600" />
              <p className="text-sm font-bold text-gray-900">Category Breakdown</p>
            </div>
            <div className="px-4 py-3">
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
      {addModal && (
        <AddItemModal
          onConfirm={handleAddItem}
          onClose={() => setAddModal(false)}
          inventory={inventory}
        />
      )}
      {updateModal && (
        <UpdateModal
          item={updateModal}
          onConfirm={handleUpdate}
          onClose={() => setUpdateModal(null)}
        />
      )}
      {duplicateModal && (
        <DuplicateItemModal
          existingItem={duplicateModal.existingItem}
          newData={duplicateModal.newData}
          onUpdateExisting={handleUpdateFromDuplicate}
          onClose={() => {
            setDuplicateModal(null);
            setPendingAddData(null);
          }}
        />
      )}
      {similarModal && (
        <SimilarItemModal
          similarItem={similarModal}
          onUseSimilar={handleUseSimilarItem}
          onCreateNew={handleCreateNewAnyway}
          onClose={() => {
            setSimilarModal(null);
            setPendingAddData(null);
          }}
        />
      )}
      <ArchiveConfirmModal 
        archiveConfirm={archiveConfirm}
        onConfirm={handleArchiveConfirm}
        onCancel={handleArchiveCancel} 
      />
    </div>
  );
}
