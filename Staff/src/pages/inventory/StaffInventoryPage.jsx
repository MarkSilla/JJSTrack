import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  History,
  Package,
  Search,
  Tag,
  X,
  XCircle,
} from "lucide-react";

import { inventoryApi } from "../../services/inventoryApi";

const getStatus = (stock, minStock) => {
  if (stock <= 0) return "Out of Stock";
  if (stock <= (Number(minStock) || 5)) return "Low Stock";
  return "In Stock";
};

const readErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function StatusBadge({ status }) {
  const cfg = {
    "In Stock": {
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      Icon: CheckCircle2,
    },
    "Low Stock": {
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
      Icon: AlertCircle,
    },
    "Out of Stock": {
      cls: "bg-red-50 text-red-700 border border-red-200",
      Icon: XCircle,
    },
  };

  const { cls, Icon } = cfg[status] || cfg["In Stock"];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}
    >
      <Icon size={11} /> {status}
    </span>
  );
}

function UseItemModal({ item, onConfirm, onClose, submitting }) {
  const [qty, setQty] = useState("");
  const stock = Math.max(0, Number(item?.stock) || 0);
  const parsedQty = Number(qty);
  const canSubmit =
    Number.isFinite(parsedQty) &&
    parsedQty > 0 &&
    parsedQty <= stock &&
    !submitting;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 sm:hidden" />
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-gray-900">Use Item</h3>
            <p className="text-sm text-slate-500 mt-0.5">{item.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Available Stock</span>
            <span
              className={`text-xl font-black tabular-nums ${
                stock === 0 ? "text-red-500" : "text-gray-900"
              }`}
            >
              {stock}{" "}
              <span className="text-sm font-normal text-slate-400">
                {item.unit}
              </span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Quantity to Use
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              max={stock}
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              placeholder={`Max ${stock} ${item.unit}`}
              disabled={stock === 0 || submitting}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-medium appearance-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            {qty && parsedQty > stock && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                Exceeds available stock ({stock} {item.unit})
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-900 mb-1">
              Stock deduction
            </p>
            <p className="text-sm text-slate-600">
              This will deduct the quantity directly from the real backend
              inventory using FIFO, so the oldest batch is used first.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => canSubmit && onConfirm(item, parsedQty)}
              disabled={!canSubmit}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                canSubmit
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {submitting ? "Saving..." : "Confirm Use"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <History size={28} className="mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">
          No usage history yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Use an item to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <History size={15} className="text-blue-600" />
        <p className="text-sm font-bold text-gray-900">My Usage History</p>
        <span className="ml-auto bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
          {history.length}
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <ArrowDownCircle size={15} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {entry.itemName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock size={10} />
                {new Date(entry.date).toLocaleString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="text-sm font-bold text-red-600 tabular-nums flex-shrink-0">
              -{entry.quantity}{" "}
              <span className="text-xs text-slate-400 font-normal">
                {entry.unit}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffInventoryPage() {
  const parsedStaffUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("staffUser") || "null");
    } catch {
      return null;
    }
  })();

  const usageStorageKey = `staff_usage_${
    parsedStaffUser?.id ||
    parsedStaffUser?._id ||
    parsedStaffUser?.email ||
    "staff"
  }`;

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [useModal, setUseModal] = useState(null);
  const [submittingUse, setSubmittingUse] = useState(false);
  const [usageHistory, setUsageHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(usageStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadInventory = async () => {
    try {
      setError("");
      const response = await inventoryApi.getAllInventory();
      const items = Array.isArray(response)
        ? response.filter((item) => !item.archived)
        : [];
      setInventory(items);
    } catch (fetchError) {
      console.error("Failed to fetch staff inventory:", fetchError);
      setError(readErrorMessage(fetchError, "Failed to load inventory"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    localStorage.setItem(usageStorageKey, JSON.stringify(usageHistory));
  }, [usageHistory, usageStorageKey]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(inventory.map((item) => item.category).filter(Boolean))
    );
    return ["All", ...uniqueCategories];
  }, [inventory]);

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const category = String(item.category || "").toLowerCase();
      const matchQuery =
        name.includes(search.toLowerCase()) ||
        category.includes(search.toLowerCase());
      const matchCategory =
        catFilter === "All" || item.category === catFilter;
      return matchQuery && matchCategory;
    });
  }, [inventory, search, catFilter]);

  const totalAvailable = inventory.filter(
    (item) => (Number(item.stock) || 0) > 0
  ).length;
  const lowStockCount = inventory.filter((item) => {
    const stock = Number(item.stock) || 0;
    return stock > 0 && stock <= (Number(item.minStock) || 5);
  }).length;
  const outOfStockCount = inventory.filter(
    (item) => (Number(item.stock) || 0) <= 0
  ).length;

  const handleUseItem = async (item, quantity) => {
    try {
      setSubmittingUse(true);
      const updatedItem = await inventoryApi.adjustStock(
        item._id,
        "decrease",
        quantity
      );

      setInventory((current) =>
        current.map((entry) =>
          entry._id === item._id ? { ...entry, ...updatedItem } : entry
        )
      );

      setUsageHistory((current) => [
        {
          id: Date.now(),
          itemName: item.name,
          itemId: item._id,
          quantity,
          unit: item.unit,
          date: new Date().toISOString(),
        },
        ...current,
      ]);

      setUseModal(null);
    } catch (useError) {
      console.error("Failed to deduct inventory:", useError);
      alert(readErrorMessage(useError, "Failed to update inventory stock"));
    } finally {
      setSubmittingUse(false);
    }
  };

  const StatCard = ({ label, value, sub, icon: Icon, accent }) => (
    <div
      className="bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-200/50"
      style={{
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `${accent}18`,
            border: `1.5px solid ${accent}30`,
          }}
        >
          <Icon size={20} color={accent} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-gray-500 tracking-tight leading-none mb-1.5 uppercase">
            {label}
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">
            {value}
          </div>
          <div className="text-[10px] text-gray-400 font-bold truncate leading-none uppercase tracking-tighter opacity-80">
            {sub}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View live supplies from the admin inventory and log usage
          </p>
        </div>
        <button
          type="button"
          onClick={loadInventory}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        <StatCard
          label="Out of Stock"
          value={outOfStockCount}
          sub="Needs restocking"
          icon={XCircle}
          accent="#EF4444"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCatDropdown((value) => !value)}
            className="flex items-center gap-1.5 pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-600 transition-all cursor-pointer min-w-[110px]"
          >
            <Filter
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <span className="truncate">
              {catFilter === "All" ? "Category" : catFilter}
            </span>
            <ChevronDown
              size={12}
              className={`text-slate-400 transition-transform ${
                showCatDropdown ? "rotate-180" : ""
              }`}
            />
          </button>
          {showCatDropdown && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] py-1 w-[160px]">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => {
                    setCatFilter(category);
                    setShowCatDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-none hover:bg-slate-50 ${
                    catFilter === category
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-slate-600"
                  }`}
                >
                  {category}
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
          <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full ml-1">
            {filtered.length}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Item Name", "Category", "Available Stock", "Status", "Action"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-5 py-3"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  Loading inventory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  <Package size={24} className="mx-auto mb-2 opacity-30" />
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const stock = Math.max(0, Number(item.stock) || 0);
                const status = getStatus(stock, item.minStock);

                return (
                  <tr
                    key={item._id}
                    className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      {item.sku && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          SKU: {item.sku}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Tag size={10} /> {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-900 tabular-nums">
                        {stock}
                      </span>
                      <span className="text-slate-400 text-xs ml-1">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
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
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            Loading inventory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            <Package size={28} className="mx-auto mb-2 opacity-30" />
            No items found.
          </div>
        ) : (
          filtered.map((item) => {
            const stock = Math.max(0, Number(item.stock) || 0);
            const status = getStatus(stock, item.minStock);

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Tag size={10} /> {item.category}
                      </span>
                      {item.sku && (
                        <span className="text-[10px] text-slate-400">
                          {item.sku}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">Available Stock</span>
                  <span className="font-bold text-gray-900 tabular-nums">
                    {stock}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      {item.unit}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => stock > 0 && setUseModal(item)}
                  disabled={stock === 0}
                  className={`w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition-all ${
                    stock === 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                  }`}
                >
                  <ArrowDownCircle size={14} />{" "}
                  {stock === 0 ? "Out of Stock" : "Use Item"}
                </button>
              </div>
            );
          })
        )}
      </div>

      <UsageHistory history={usageHistory} />

      {useModal && (
        <UseItemModal
          item={useModal}
          onConfirm={handleUseItem}
          onClose={() => !submittingUse && setUseModal(null)}
          submitting={submittingUse}
        />
      )}
    </div>
  );
}
