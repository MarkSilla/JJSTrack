import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Package, AlertTriangle, TrendingDown, RefreshCw, Search, Plus, ChevronDown, Pencil, Archive, RotateCcw, ArrowUpCircle, ArrowDownCircle, X, Check, Filter, BarChart3, Clock, ShoppingBag, Layers,
  Tag, CheckCircle2, AlertCircle, XCircle, SlidersHorizontal, ArrowUpDown, Settings,
  Wrench, Sparkles, Link2,
} from "lucide-react";
import { toast } from "sonner";
import ArchiveConfirmModal from './ArchiveConfirmModal.jsx';
import { getInventoryUpdatesWebSocketUrl, inventoryApi } from "../../services/inventoryApi";
import { useStockAlert } from "../../context/StockAlertContext";
import { fmt } from "../../utils/helpers.js";
import { SkeletonBlock } from "../../components/SkeletonLoaders.jsx";
import { StatusBadge, StatCard } from "../../components/ui";

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
const UNIT_OPTIONS = ["pcs", "yards", "meters"];

const SORT_INVENTORY_OPTIONS = [
  { value: 'newest', label: 'Newest → Oldest' },
  { value: 'oldest', label: 'Oldest → Newest' },
  { value: 'name-az', label: 'Name A → Z' },
  { value: 'name-za', label: 'Name Z → A' },
];

const DEFAULT_INVENTORY_SETTINGS = {
  thresholds: {
    pcs: 5,
    yards: 5,
    meters: 5,
  },
};

const LOW_STOCK_SETTING_UNITS = [
  { key: "pcs", label: "PCS", helper: "Pieces and count-based stocks" },
  { key: "yards", label: "YARDS", helper: "Fabric measured in yards" },
  { key: "meters", label: "METERS", helper: "Fabric measured in meters" },
];

const SOCKET_RECONNECT_MS = 2500;
const SOCKET_REFRESH_DEBOUNCE_MS = 200;

function normalizeInventorySettings(settings) {
  return {
    thresholds: {
      ...DEFAULT_INVENTORY_SETTINGS.thresholds,
      ...(settings?.thresholds || {}),
    },
  };
}

function getUnitMinStock(settings, unit) {
  const unitKey = String(unit || "pcs").trim().toLowerCase();
  const normalizedSettings = normalizeInventorySettings(settings);
  const thresholdValue =
    normalizedSettings.thresholds?.[unitKey] ??
    normalizedSettings.thresholds?.pcs ??
    DEFAULT_INVENTORY_SETTINGS.thresholds.pcs;
  return Math.max(0, Number(thresholdValue) || 0);
}

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
function formatQty(value) {
  const numericValue = Number(value) || 0;
  return Number.isInteger(numericValue)
    ? `${numericValue}`
    : numericValue.toFixed(2).replace(/\.?0+$/, "");
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateInput(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function getSortedBatches(item) {
  const batches = Array.isArray(item?.batches) ? item.batches : [];
  return [...batches].sort((left, right) => new Date(left.receivedAt) - new Date(right.receivedAt));
}

function getBatchCount(item) {
  return Number(item?.batchCount) || getSortedBatches(item).length;
}

function getOldestBatch(item) {
  return getSortedBatches(item)[0] || null;
}

function getAverageUnitCost(item) {
  const averageCost = Number(item?.averageUnitPrice);
  if (Number.isFinite(averageCost) && averageCost > 0) {
    return averageCost;
  }
  return Number(item?.unitPrice) || 0;
}

function getCurrentValue(item) {
  const currentValue = Number(item?.currentStockValue);
  if (Number.isFinite(currentValue)) {
    return currentValue;
  }
  return (Number(item?.stock) || 0) * getAverageUnitCost(item);
}

function getStatus(item) {
  if (item.stock === 0) return "Out of Stock";
  if (item.stock <= (item.minStock || 5)) return "Low Stock";
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

function FilterSelect({ value, options, onChange, isOpen, onToggle }) {
  const selectedLabel = options.find(o => (typeof o === 'object' ? o.value : o) === value);
  const displayLabel = typeof selectedLabel === 'object' ? selectedLabel.label : selectedLabel;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-all shadow-sm">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-full px-3 py-2 text-xs font-medium text-slate-700 flex justify-between items-center transition-colors hover:bg-slate-50"
      >
        <span className="truncate">{displayLabel || value}</span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50 py-1 max-h-48 overflow-y-auto">
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            const isSelected = value === val;

            return (
              <button
                key={val}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(val);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors border-none ${isSelected ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileCard({ item, onAdjust, onArchive, onUpdate, isArchived }) {
  const status = getStatus(item);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Tag size={10} /> {item.category}
            </span>
            <span className="text-[10px] text-slate-400">• {getBatchCount(item)} batch{getBatchCount(item) === 1 ? "" : "es"}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mb-2.5 bg-slate-50/50 rounded-lg p-2 border border-slate-100/50">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Stock Level</span>
          <span className="font-bold text-gray-800 tabular-nums">{formatQty(item.stock)} <span className="font-normal text-slate-400">{item.unit}</span></span>
        </div>
        <StockBar item={item} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div className="rounded-lg bg-slate-50/50 border border-slate-100/50 px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-wide text-slate-400">Avg Cost</p>
          <p className="text-xs font-bold text-slate-800">{fmt(getAverageUnitCost(item))}</p>
        </div>
        <div className="rounded-lg bg-slate-50/50 border border-slate-100/50 px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-wide text-slate-400">Value</p>
          <p className="text-xs font-bold text-emerald-600">{fmt(getCurrentValue(item))}</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {!isArchived ? (
          <>
            <button onClick={() => onAdjust(item, "increase")}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-2 rounded-lg bg-blue-600 text-white shadow-sm transition-all active:scale-95">
              <Plus size={12} /> Receive
            </button>
            <button onClick={() => onAdjust(item, "decrease")}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-2 rounded-lg bg-white border border-slate-200 text-slate-600 transition-all active:scale-95">
              <ArrowDownCircle size={12} /> Use Stock
            </button>
            <div className="flex gap-1.5">
              <button onClick={() => onUpdate(item)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-200" title="Edit">
                <Pencil size={12} />
              </button>
              <button onClick={() => onArchive(item._id, false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-amber-600 border border-slate-200" title="Archive">
                <Archive size={12} />
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => onArchive(item._id, true)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 transition-all active:scale-95">
            <RotateCcw size={13} /> Restore Item
          </button>
        )}
      </div>
    </div>
  );
}

function UpdateModal({ item, settings, onConfirm, onClose }) {
  const categoryButtonRef = useRef(null);
  const unitButtonRef = useRef(null);
  const [categoryMenuStyle, setCategoryMenuStyle] = useState({});
  const [unitMenuStyle, setUnitMenuStyle] = useState({});
  const [form, setForm] = useState({
    name: item.name || "",
    category: item.category || "Sewing",
    unit: item.unit || "pcs",
    unitPrice: item.unitPrice || "",
  });
  const [confirmModal, setConfirmModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Check if form has changed from original
  const hasChanges = form.name !== item.name ||
    form.category !== item.category ||
    form.unit !== item.unit ||
    form.unitPrice !== item.unitPrice;

  const handleConfirm = () => {
    if (!form.name.trim()) return;
    setConfirmModal(true);
  };

  const handleConfirmUpdate = () => {
    onConfirm(item._id, {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit || "pcs",
      unitPrice: parseFloat(form.unitPrice) || 0,
    });
  };

  const fields = [
    { key: "name", label: "Item Name", type: "text", placeholder: "e.g. Sewing Needles" },
    { key: "unitPrice", label: "Default Cost per Unit", type: "number", placeholder: "e.g. 25.50", step: "0.01" },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
        <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-w-md rounded-none sm:rounded-2xl p-6 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
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

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unit</label>
            <div className="relative">
              <button
                ref={unitButtonRef}
                onClick={() => {
                  const next = !showUnitModal;
                  if (!next) {
                    setShowUnitModal(false);
                    return;
                  }
                  const rect = unitButtonRef.current?.getBoundingClientRect();
                  if (rect) {
                    setUnitMenuStyle({
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
                  setShowUnitModal(true);
                }}
                className="flex items-center gap-1.5 pl-3 pr-3 py-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer justify-between"
              >
                <span className="truncate">{form.unit}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${showUnitModal ? 'rotate-180' : ''}`} />
              </button>
              {showUnitModal && (
                <div style={unitMenuStyle}>
                  {UNIT_OPTIONS.map(u => (
                    <button
                      key={u}
                      onClick={() => {
                        set("unit", u);
                        setShowUnitModal(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer border-none hover:bg-slate-50 hover:shadow-sm ${form.unit === u ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Low stock alert for <span className="font-semibold text-slate-600">{form.unit}</span> is set to{" "}
              <span className="font-semibold text-blue-600">{getUnitMinStock(settings, form.unit)}</span>.
              Update it from Inventory Settings.
            </p>
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
            <button onClick={handleConfirm} disabled={!hasChanges} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${hasChanges ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"
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
  const [unitPrice, setUnitPrice] = useState(String(item.unitPrice ?? ""));
  const [receivedAt, setReceivedAt] = useState(() => formatDateInput(new Date()));
  const [fifoPreview, setFifoPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const openBatches = useMemo(() => getSortedBatches(item), [item]);
  const parsedAmount = Number(amount);

  useEffect(() => {
    let ignore = false;

    if (adjType !== "decrease" || !parsedAmount || parsedAmount <= 0) {
      setFifoPreview(null);
      setPreviewError("");
      setPreviewLoading(false);
      return undefined;
    }

    setPreviewLoading(true);
    setPreviewError("");

    inventoryApi
      .previewFifo(item._id, parsedAmount)
      .then((data) => {
        if (!ignore) {
          setFifoPreview(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setFifoPreview(null);
          setPreviewError(
            error?.response?.data?.message || "Failed to check stock usage"
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setPreviewLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [adjType, item._id, parsedAmount]);

  const handleConfirm = () => {
    const quantity = Number(amount);
    if (!quantity || quantity < 1) return;

    if (adjType === "increase") {
      if (unitPrice === "") {
        toast.error("Batch cost per unit is required");
        return;
      }

      const nextUnitPrice = Number(unitPrice);
      if (!Number.isFinite(nextUnitPrice) || nextUnitPrice < 0) {
        toast.error("Batch cost cannot be negative");
        return;
      }

      onConfirm(item._id, adjType, quantity, {
        unitPrice: nextUnitPrice,
        receivedAt,
      });
      return;
    }

    if (fifoPreview && !fifoPreview.canFulfill) {
      toast.error("Requested quantity exceeds available stock");
      return;
    }

    onConfirm(item._id, adjType, quantity);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl rounded-none sm:rounded-2xl p-6 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-4 flex items-start justify-between bg-white px-6 pt-6 pb-3 border-b border-slate-100">
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
            {formatQty(item.stock)}/{formatQty(getMaxStock(item))} <span className="text-sm font-normal text-slate-400">{item.unit}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Open Batches</p>
            <p className="text-lg font-black text-gray-900 mt-1">{getBatchCount(item)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avg Cost</p>
            <p className="text-lg font-black text-gray-900 mt-1">{fmt(getAverageUnitCost(item))}</p>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Current Value</p>
            <p className="text-lg font-black text-gray-900 mt-1">{fmt(getCurrentValue(item))}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setAdjType("increase")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${adjType === "increase" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>
            <ArrowUpCircle size={15} /> Receive Batch
          </button>
          <button onClick={() => setAdjType("decrease")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${adjType === "decrease" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>
            <ArrowDownCircle size={15} /> Use Stock
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity</label>
          <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount…"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium appearance-none" />
        </div>

        {adjType === "increase" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Batch Cost per Unit</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                  placeholder="e.g. 120.00"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Received Date</label>
                <input
                  type="date"
                  value={receivedAt}
                  onChange={e => setReceivedAt(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium"
                />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
              <p className="text-sm font-bold text-gray-900 mb-1">New stock batch</p>
              <p className="text-sm text-slate-600">
                This stock will be stored as a separate batch and will not merge with older stock.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4 mb-5">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-900 mb-1">Stock usage</p>
              <p className="text-sm text-slate-600">
                The system uses the oldest available batch first for quality control and accurate costing.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open Batches</p>
                <span className="text-xs text-slate-400">{openBatches.length} active</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {openBatches.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
                    No active batches.
                  </div>
                ) : openBatches.map(batch => (
                  <div key={batch.id || batch.batchId} className="rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{batch.batchCode}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Received {formatShortDate(batch.receivedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{formatQty(batch.quantity)} {item.unit}</p>
                        <p className="text-xs text-slate-400">{fmt(batch.unitPrice || 0)}/unit</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stock Usage Preview</p>
                {fifoPreview?.totalCost > 0 && (
                  <span className="text-xs font-semibold text-slate-500">Cost {fmt(fifoPreview.totalCost)}</span>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {previewLoading ? (
                  <div className="px-4 py-4 text-sm text-slate-400">Checking stock usage...</div>
                ) : previewError ? (
                  <div className="px-4 py-4 text-sm text-red-500">{previewError}</div>
                ) : !parsedAmount ? (
                  <div className="px-4 py-4 text-sm text-slate-400">Enter a quantity to preview which batches will be used.</div>
                ) : !fifoPreview?.breakdown?.length ? (
                  <div className="px-4 py-4 text-sm text-slate-400">No eligible batch found for this deduction.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {fifoPreview.breakdown.map(entry => (
                      <div key={entry.batchId} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{entry.batchCode}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatShortDate(entry.receivedAt)} • {fmt(entry.unitPrice || 0)}/unit
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">-{formatQty(entry.willUse)} {item.unit}</p>
                          <p className="text-xs text-slate-400">{fmt(entry.lineCost || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {fifoPreview && !fifoPreview.canFulfill && (
                <p className="text-xs font-medium text-red-500 mt-2">
                  Short by {formatQty(fifoPreview.shortfall)} {item.unit}.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-6 -mb-6 flex gap-3 border-t border-slate-100 bg-white px-6 pt-3 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={adjType === "decrease" && fifoPreview && !fifoPreview.canFulfill}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${adjType === "decrease" && fifoPreview && !fifoPreview.canFulfill
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            <Check size={15} /> {adjType === "increase" ? "Receive Batch" : "Confirm Stock Use"}
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

function AddItemModal({ settings, onConfirm, onClose }) {
  const categoryButtonRef = useRef(null);
  const unitButtonRef = useRef(null);
  const [categoryMenuStyle, setCategoryMenuStyle] = useState({});
  const [unitMenuStyle, setUnitMenuStyle] = useState({});
  const [form, setForm] = useState({
    name: "",
    category: "Sewing",
    stock: "",
    unit: "pcs",
    unitPrice: "",
    receivedAt: formatDateInput(new Date()),
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hasAllRequiredFields =
    form.name.trim() !== "" &&
    form.category &&
    form.unit &&
    form.stock !== "" &&
    form.unitPrice !== "" &&
    String(form.receivedAt || "").trim() !== "";
  const stockValue = Number(form.stock);
  const unitPriceValue = Number(form.unitPrice);
  const isSaveDisabled =
    !hasAllRequiredFields ||
    Number.isNaN(stockValue) ||
    stockValue < 0 ||
    Number.isNaN(unitPriceValue) ||
    unitPriceValue < 0;

  const handleConfirm = () => {
    if (!form.name.trim()) return;
    const stockValue = Number(form.stock) || 0;

    if (stockValue < 0) {
      toast.error("Current stock cannot be negative");
      return;
    }

    if (stockValue > 0 && form.unitPrice === "") {
      toast.error("Batch cost per unit is required when receiving stock");
      return;
    }

    const newData = {
      name: form.name.trim(),
      category: form.category,
      stock: stockValue,
      unit: form.unit || "pcs",
      unitPrice: Number(form.unitPrice) || 0,
      receivedAt: form.receivedAt || formatDateInput(new Date()),
    };

    onConfirm(newData);
  };

  const fields = [
    { key: "name", label: "Item Name", type: "text", placeholder: "e.g. Sewing Needles" },
    { key: "stock", label: "Current Stock", type: "number", placeholder: "e.g. 50" },
    { key: "unitPrice", label: "Batch Cost per Unit", type: "number", placeholder: "e.g. 25.50", step: "0.01" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-w-md rounded-none sm:rounded-2xl p-6 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-lg font-black text-gray-900">Add Item / Receive Batch</h3>
            <p className="text-xs text-slate-400">Create a new item or add a new stock batch to an existing one</p>
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

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unit</label>
          <div className="relative">
            <button
              ref={unitButtonRef}
              onClick={() => {
                const next = !showUnitModal;
                if (!next) {
                  setShowUnitModal(false);
                  return;
                }
                const rect = unitButtonRef.current?.getBoundingClientRect();
                if (rect) {
                  setUnitMenuStyle({
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
                setShowUnitModal(true);
              }}
              className="flex items-center gap-1.5 pl-3 pr-3 py-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer justify-between"
            >
              <span className="truncate">{form.unit}</span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${showUnitModal ? 'rotate-180' : ''}`} />
            </button>
            {showUnitModal && (
              <div style={unitMenuStyle}>
                {UNIT_OPTIONS.map(u => (
                  <button
                    key={u}
                    onClick={() => {
                      set("unit", u);
                      setShowUnitModal(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer border-none hover:bg-slate-50 hover:shadow-sm ${form.unit === u ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Low stock alert for <span className="font-semibold text-slate-600">{form.unit}</span> is set to{" "}
            <span className="font-semibold text-blue-600">{getUnitMinStock(settings, form.unit)}</span>.
            Change it from Inventory Settings.
          </p>
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

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Received Date</label>
          <input
            type="date"
            value={form.receivedAt}
            onChange={e => set("receivedAt", e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors border-slate-200 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={isSaveDisabled}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isSaveDisabled
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            <Plus size={15} /> Save Item / Batch
          </button>
        </div>
      </div>
    </div>
  );
}

function InventorySettingsModal({ settings, onConfirm, onClose, saving }) {
  const normalizedSettings = normalizeInventorySettings(settings);
  const [form, setForm] = useState({
    pcs: normalizedSettings.thresholds.pcs,
    yards: normalizedSettings.thresholds.yards,
    meters: normalizedSettings.thresholds.meters,
  });

  useEffect(() => {
    const nextSettings = normalizeInventorySettings(settings);
    setForm({
      pcs: nextSettings.thresholds.pcs,
      yards: nextSettings.thresholds.yards,
      meters: nextSettings.thresholds.meters,
    });
  }, [settings]);

  const setThreshold = (unit, value) => {
    setForm((current) => ({
      ...current,
      [unit]: value,
    }));
  };

  const handleSave = () => {
    const payload = {
      thresholds: {
        pcs: Math.max(0, Number(form.pcs) || 0),
        yards: Math.max(0, Number(form.yards) || 0),
        meters: Math.max(0, Number(form.meters) || 0),
      },
    };

    onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[70] sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-900">Low Stock Settings</h3>
            <p className="text-xs text-slate-400">Set the alert threshold by unit. These values will be used across the whole inventory.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {LOW_STOCK_SETTING_UNITS.map((unit) => (
            <div key={unit.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-black tracking-[0.18em] text-slate-500">{unit.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{unit.helper}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Settings size={16} />
                </div>
              </div>

              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Minimum stock before low alert
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form[unit.key]}
                onChange={(event) => setThreshold(unit.key, event.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors border-slate-200 focus:border-blue-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Low stock will trigger when available stock is below this value.
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-blue-900">Applies to all inventory items with the same unit</p>
          <p className="text-xs text-blue-700 mt-1">
            Add New Stock will no longer ask for minimum stock. The alert threshold now follows the unit setting automatically.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
          >
            <Check size={15} />
            {saving ? "Saving..." : "Save Settings"}
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
  const { checkInventory } = useStockAlert();
  const [inventory, setInventory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [inventorySettings, setInventorySettings] = useState(DEFAULT_INVENTORY_SETTINGS);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statFilter, setStatFilter] = useState("All");
  const [sortBy, setSortBy] = useState('newest');
  const [activeDropdown, setActiveDropdown] = useState(null); // 'category', 'status', 'sort', 'actions'
  const [activeFilterMenu, setActiveFilterMenu] = useState(null); // 'category', 'status', 'sort'
  const [settingsModal, setSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [adjModal, setAdjModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
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

      const [inventoryData, activityData, settingsData] = await Promise.all([
        inventoryApi.getAllInventory(),
        inventoryApi.getInventoryActivity(20),
        inventoryApi.getInventorySettings(),
      ]);

      setInventory(inventoryData);
      setActivities(activityData.map(mapActivityRecord));
      setInventorySettings(normalizeInventorySettings(settingsData));
      setError(null);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("Failed to load inventory page:", err);

      if (showLoader) {
        setError("Failed to load inventory");
        setInventory([]);
        setActivities([]);
        setInventorySettings(DEFAULT_INVENTORY_SETTINGS);
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

    setActiveDropdown(null);
    setActiveFilterMenu(null);
  }, [location.state]);

  useEffect(() => {
    void refreshInventoryPage({ showLoader: true });
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
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

  const totalBatchCount = useMemo(() => {
    return activeInventory.reduce((sum, item) => sum + getBatchCount(item), 0);
  }, [activeInventory]);

  const currentValue = useMemo(() => {
    return activeInventory.reduce((sum, item) => sum + getCurrentValue(item), 0);
  }, [activeInventory]);

  const normalizedInventorySettings = useMemo(
    () => normalizeInventorySettings(inventorySettings),
    [inventorySettings]
  );

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
    { label: "Open Batches", value: totalBatchCount, sub: "Stock batches on hand", icon: Layers, accent: "#7C3AED", bgAccent: "#F5F3FF" },
    { label: "In Stock", value: inStockCount, sub: "Healthy inventory", icon: CheckCircle2, accent: "#10B981", bgAccent: "#F0FDF4" },
    { label: "Low Stock", value: lowCount, sub: "Need restock", icon: AlertTriangle, accent: "#D97706", bgAccent: "#FFFBEB" },
    { label: "Current Value", value: fmt(currentValue), sub: "Exact batch-based cost", icon: ShoppingBag, accent: "#059669", bgAccent: "#ECFDF5" },
    { label: "Out of Stock", value: outCount, sub: "Critical - reorder ASAP", icon: XCircle, accent: "#DC2626", bgAccent: "#FEF2F2" },
    { label: "Archived", value: archivedInventory.length, sub: "Out of service", icon: Archive, accent: "#6366F1", bgAccent: "#EEF2FF" }
  ];

  const handleAdjust = async (itemId, type, amount, options = {}) => {
    try {
      const updatedItem = await inventoryApi.adjustStock(itemId, type, amount, options);
      setInventory(inv => inv.map(i => i._id === itemId ? updatedItem : i));
      await fetchActivities();
      setAdjModal(null);
      toast.success(type === "increase" ? "Stock batch received successfully." : "Stock usage recorded successfully.");
    } catch (err) {
      console.error("Failed to adjust stock:", err);
      toast.error(err?.response?.data?.message || "Failed to adjust stock");
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
        const result = await inventoryApi.createInventory(data);
        setInventory(inv => inv.map(i => i._id === result._id ? result : i));
        await fetchActivities();
        setAddModal(false);
        toast.success("Inventory item updated successfully.");
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
      toast.success(result.isUpdate ? "Inventory item updated successfully." : "Inventory item added successfully.");
    } catch (err) {
      console.error("Failed to add item:", err);
      toast.error("Failed to add item");
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
        toast.success(result.isUpdate ? "Inventory item updated successfully." : "Inventory item added successfully.");
      } catch (err) {
        console.error("Failed to add item:", err);
        toast.error("Failed to add item");
      }
      setPendingAddData(null);
    }
  };

  const handleUpdate = async (itemId, data) => {
    try {
      const updatedItem = await inventoryApi.updateInventory(itemId, data);
      setInventory(inv => inv.map(i => i._id === itemId ? updatedItem : i));
      await fetchActivities();
      setUpdateModal(null);
      toast.success("Item updated successfully.");
    } catch (err) {
      console.error("Failed to update item:", err);
      toast.error("Failed to update item");
    }
  };

  const handleSaveSettings = async (settingsPayload) => {
    try {
      setSavingSettings(true);
      const updatedSettings = await inventoryApi.updateInventorySettings(settingsPayload);
      setInventorySettings(normalizeInventorySettings(updatedSettings));
      await refreshInventoryPage();
      await checkInventory();
      setSettingsModal(false);
      toast.success("Low stock settings saved successfully.");
    } catch (err) {
      console.error("Failed to save inventory settings:", err);
      toast.error(err?.response?.data?.message || "Failed to save low stock settings");
    } finally {
      setSavingSettings(false);
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
      toast.success(isRestore ? "Item restored successfully." : "Item archived successfully.");
    } catch (err) {
      console.error("Failed to archive/restore item:", err);
      toast.error(archiveConfirm.isRestore ? "Failed to restore item" : "Failed to archive item");
    }
  };

  const handleArchiveCancel = () => {
    setArchiveConfirm({ show: false, id: null, isRestore: false, itemName: '' });
  };

  const alertCount = lowCount + outCount;

  return (
    <div className="min-h-screen bg-slate-50 font-inter overflow-x-hidden">
      <div className="px-4 lg:px-6 py-2 top-0 z-100 overflow-visible">
        {/* STAT */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-2 sm:gap-3 mb-3">
          {STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent }, index) => (
            <div
              key={label}
              className={`bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50 ${index === 4
                ? 'col-span-2 lg:col-span-3 xl:col-span-1 order-last xl:order-none'
                : 'col-span-1 order-none'
                }`}
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
              <div className="flex items-center gap-2 mb-1.5 sm:mb-3">
                <div className={`rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${index === 4 ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-9 sm:h-9'}`} style={{ background: bgAccent }}>
                  <Icon size={index === 4 ? 14 : 13} color={accent} strokeWidth={2.5} className="sm:hidden" />
                  <Icon size={16} color={accent} strokeWidth={2.2} className="hidden sm:block" />
                </div>
                <span className={`text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 truncate leading-tight ${index === 4 ? 'max-w-none' : 'max-w-none'}`}>{label}</span>
              </div>
              <div className={`leading-none tracking-tight font-black sm:font-extrabold text-gray-900 ${index === 4 ? 'mt-0 sm:mt-[-14px] text-[16px] sm:text-[22px] pl-[40px] sm:pl-[45px]' : 'mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] pl-[36px] sm:pl-[45px] text-left'
                }`}>{value}</div>
              <div className={`block text-[9px] text-gray-400 mt-1 sm:mt-0.5 opacity-80 sm:opacity-100 ${index === 4 ? 'pl-[40px] sm:pl-[45px]' : 'pl-[36px] sm:pl-[45px]'}`}>{sub}</div>
            </div>
          ))}
        </div>


        <div className="flex flex-col lg:flex-row items-center gap-3 mb-3">
          <div className="flex items-center gap-2 w-full lg:flex-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors" />
            </div>

            {/* Actions Group - Standard Icons for Mobile, Labels for Desktop */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => void refreshInventoryPage({ showLoader: true })}
                className="w-10 h-10 lg:w-auto lg:px-4 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
                title="Sync Now"
              >
                <RefreshCw size={16} />
                <span className="hidden lg:inline text-sm font-semibold">Sync</span>
              </button>

              <button
                onClick={() => setSettingsModal(true)}
                className="w-10 h-10 lg:w-auto lg:px-4 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
                title="Low Stock Settings"
              >
                <Settings size={16} />
                <span className="hidden lg:inline text-sm font-semibold">Settings</span>
              </button>

              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'filters' ? null : 'filters'); }}
                  className={`w-10 h-10 lg:w-auto lg:px-4 flex items-center justify-center gap-2 border border-slate-200 transition-all rounded-xl ${activeDropdown === 'filters' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  title="Filters"
                >
                  <Filter size={16} />
                  <span className="hidden lg:inline text-sm font-semibold">Filter</span>
                  <ChevronDown size={14} className={`hidden lg:block transition-transform ${activeDropdown === 'filters' ? 'rotate-180' : ''}`} />
                </button>

                {activeDropdown === 'filters' && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] p-4 w-64 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Category</label>
                        <FilterSelect
                          value={catFilter}
                          isOpen={activeFilterMenu === 'category'}
                          onToggle={() => setActiveFilterMenu(activeFilterMenu === 'category' ? null : 'category')}
                          onChange={(val) => { setCatFilter(val); setActiveFilterMenu(null); }}
                          options={CATEGORIES}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Status</label>
                        <FilterSelect
                          value={statFilter}
                          isOpen={activeFilterMenu === 'status'}
                          onToggle={() => setActiveFilterMenu(activeFilterMenu === 'status' ? null : 'status')}
                          onChange={(val) => { setStatFilter(val); setActiveFilterMenu(null); }}
                          options={STATUS_OPTIONS}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Sort By</label>
                        <FilterSelect
                          value={sortBy}
                          isOpen={activeFilterMenu === 'sort'}
                          onToggle={() => setActiveFilterMenu(activeFilterMenu === 'sort' ? null : 'sort')}
                          onChange={(val) => { setSortBy(val); setActiveFilterMenu(null); }}
                          options={SORT_INVENTORY_OPTIONS}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setAddModal(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                title="Add Stock"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2 sm:px-4 sm:py-3 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-sm font-bold text-gray-900 leading-none">Low Stock Thresholds</p>
                <p className="hidden sm:block text-xs text-slate-400 mt-1">Alerts trigger based on units.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {LOW_STOCK_SETTING_UNITS.map((unit) => (
                <span key={unit.key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-[10px] sm:text-xs font-semibold">
                  {unit.label} <span className="text-blue-600 font-bold">{getUnitMinStock(normalizedInventorySettings, unit.key)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        {!alertDismissed && alertCount > 0 && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-xl p-3 sm:p-4 mb-4">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <p className="text-[11px] sm:text-sm font-medium text-amber-800 flex-1">
              <strong>{alertCount} item{alertCount > 1 ? "s" : ""}</strong> need attention — {lowCount > 0 && `${lowCount} low`}{lowCount > 0 && outCount > 0 && ", "}{outCount > 0 && `${outCount} out`}.
            </p>
            <button onClick={() => setAlertDismissed(true)} className="text-amber-400 hover:text-amber-600 transition-colors shrink-0 p-1">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="lg:hidden space-y-3 mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900">All Supplies <span className="text-slate-400 font-normal">({filtered.length})</span></p>
            <button onClick={() => setShowArchived(!showArchived)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${showArchived
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
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <SkeletonBlock className="h-4 w-36" />
                      <SkeletonBlock className="h-3 w-24 bg-slate-100" />
                    </div>
                    <SkeletonBlock className="h-7 w-20 rounded-full bg-slate-100" />
                  </div>
                  <SkeletonBlock className="h-10 w-full bg-slate-100" />
                </div>
              ))}
            </div>
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
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${showArchived
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
                {["Item Name", "SKU", "Category", "Avg Cost / Unit", "Stock", "Open Batches", "Current Value", "Status", "Date Added", "Last Activity", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 7 }).map((_, row) => (
                  <tr key={row} className="border-b border-slate-50">
                    {Array.from({ length: 11 }).map((__, column) => (
                      <td key={column} className="px-4 py-3">
                        <SkeletonBlock className={`${column === 0 ? "h-4 w-36" : "h-3 w-24"} bg-slate-100`} />
                      </td>
                    ))}
                  </tr>
                ))
                : filtered.length === 0
                  ? <tr><td colSpan={12} className="text-center py-12 text-slate-400"><ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />No items found.</td></tr>
                  : filtered.map(item => (
                    <tr key={item._id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {getBatchCount(item)} batch{getBatchCount(item) === 1 ? "" : "es"}
                          {getOldestBatch(item) ? ` • oldest ${formatShortDate(getOldestBatch(item).receivedAt)}` : ""}
                        </p>
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
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(getAverageUnitCost(item))}</span>
                        <p className="text-[10px] text-slate-400 mt-1">Default {fmt(item.unitPrice || 0)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 tabular-nums">{formatQty(item.stock)}/{formatQty(getMaxStock(item))}</span>
                        <span className="text-slate-400 text-xs"> {item.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-blue-600 tabular-nums">{getBatchCount(item)}</span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {getOldestBatch(item) ? `Oldest ${formatShortDate(getOldestBatch(item).receivedAt)}` : "No batches"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-emerald-600 tabular-nums">{fmt(getCurrentValue(item))}</span>
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
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Receive Batch">
                                <ArrowUpCircle size={14} />
                              </button>
                              <button onClick={() => setAdjModal({ item, type: "decrease" })}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Use Stock">
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
          settings={normalizedInventorySettings}
          onConfirm={handleAddItem}
          onClose={() => setAddModal(false)}
        />
      )}
      {updateModal && (
        <UpdateModal
          item={updateModal}
          settings={normalizedInventorySettings}
          onConfirm={handleUpdate}
          onClose={() => setUpdateModal(null)}
        />
      )}
      {settingsModal && (
        <InventorySettingsModal
          settings={normalizedInventorySettings}
          onConfirm={handleSaveSettings}
          onClose={() => !savingSettings && setSettingsModal(false)}
          saving={savingSettings}
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
