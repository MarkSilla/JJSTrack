import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  BarChart3,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Package,
  RefreshCw,
  Search,
  Tag,
  User,
  X,
  ArrowUpDown
} from "lucide-react";
import { inventoryApi } from "../../services/inventoryApi";
import { SkeletonBlock } from "../../../components/SkeletonLoaders.jsx";
import { StatCard } from "../../../components/ui";
import { getStoredStaffUser } from "../../utils/staffSession";

const HISTORY_FETCH_LIMIT = 500;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "item-az", label: "Item A to Z" },
  { value: "item-za", label: "Item Z to A" },
];

function formatQty(value) {
  const numericValue = Number(value) || 0;
  return Number.isInteger(numericValue)
    ? `${numericValue}`
    : numericValue.toFixed(2).replace(/\.?0+$/, "");
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStockDelta(activity) {
  const previousStock = Number(activity?.previousStock) || 0;
  const newStock = Number(activity?.newStock) || 0;
  return newStock - previousStock;
}

function formatMovement(activity) {
  const delta = getStockDelta(activity);
  const fallbackAmount = Number(activity?.amount) || 0;
  const amount = delta !== 0 ? Math.abs(delta) : fallbackAmount;
  const unitLabel = activity?.unit ? ` ${activity.unit}` : "";
  return delta < 0 ? `-${formatQty(amount)}${unitLabel}` : `${formatQty(amount)}${unitLabel}`;
}

function getUsageTarget(activity) {
  return (
    activity?.usageContext?.orderDisplayId ||
    activity?.usageContext?.orderLabel ||
    activity?.usageContext?.orderId ||
    "No order reference"
  );
}



function DetailModal({ activity, onClose }) {
  if (!activity) return null;

  const batchBreakdown = Array.isArray(activity.batchBreakdown)
    ? activity.batchBreakdown
    : [];

  return (
    <div className="font-inter fixed inset-0 z-[10020] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-900">{activity.inventoryName || "Inventory item"}</h2>
            <p className="text-sm text-slate-500 mt-1">Stock usage details and batch records.</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0"
            aria-label="Close details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-81px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Movement</p>
              <p className="mt-2 text-base font-bold text-rose-600">{formatMovement(activity)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recorded</p>
              <p className="mt-2 text-base font-bold text-gray-900">{formatDateTime(activity.createdAt)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {activity.note || "No additional note was recorded."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-bold text-gray-900">Stock Batch Breakdown</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {batchBreakdown.length > 0
                  ? `${batchBreakdown.length} batch record${batchBreakdown.length === 1 ? "" : "s"} tracked`
                  : "No batch impact recorded"}
              </p>
            </div>
            {batchBreakdown.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">No batch breakdown is attached.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Batch", "Quantity", "Unit Cost", "Line Cost"].map((heading) => (
                        <th key={heading} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batchBreakdown.map((batch, index) => (
                      <tr key={`${batch.batchCode || "batch"}-${index}`} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{batch.batchCode || "N/A"}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatQty(batch.quantity)} {activity.unit || ""}</td>
                        <td className="px-4 py-3 text-slate-600">{Number(batch.unitPrice || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">{Number(batch.lineCost || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffInventoryHistoryPage() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [showCategory, setShowCategory] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) setLoading(true);
      setError("");
      const activityData = await inventoryApi.getInventoryActivity(HISTORY_FETCH_LIMIT, {
        scope: "mine",
      });
      const staffUser = getStoredStaffUser() || {};
      const staffIds = [staffUser._id, staffUser.id].filter(Boolean).map((value) => String(value));
      const staffNames = [staffUser.fullName, staffUser.name, staffUser.email]
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase());

      const mine = Array.isArray(activityData)
        ? activityData.filter((activity) => {
          if (activity.actionType !== "decrease") return false;
          if (staffIds.length && staffIds.includes(String(activity.performedById || ""))) return true;
          if (staffNames.length && staffNames.includes(String(activity.performedByName || "").trim().toLowerCase())) return true;
          return activity.performedByRole === "staff" && staffIds.length === 0 && staffNames.length === 0;
        })
        : [];

      setActivities(mine);
    } catch (historyError) {
      console.error("Failed to load staff inventory history:", historyError);
      setError("Failed to load inventory usage history.");
      setActivities([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory({ showLoader: true });
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(activities.map((activity) => activity.category).filter(Boolean)));
    return ["All", ...categories];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    let nextActivities = activities.filter((activity) => {
      const matchesQuery =
        query.length === 0 ||
        [
          activity.inventoryName,
          activity.inventorySku,
          activity.category,
          activity.note,
          getUsageTarget(activity),
          activity.usageContext?.customerName,
          activity.usageContext?.serviceType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesCategory = categoryFilter === "All" || activity.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });

    if (sortBy === "newest") nextActivities = [...nextActivities].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    if (sortBy === "oldest") nextActivities = [...nextActivities].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    if (sortBy === "item-az") nextActivities = [...nextActivities].sort((left, right) => String(left.inventoryName || "").localeCompare(String(right.inventoryName || "")));
    if (sortBy === "item-za") nextActivities = [...nextActivities].sort((left, right) => String(right.inventoryName || "").localeCompare(String(left.inventoryName || "")));

    return nextActivities;
  }, [activities, categoryFilter, search, sortBy]);

  const hasActiveFilters = categoryFilter !== "All" || sortBy !== "newest";

  const stats = useMemo(() => {
    const stockOut = activities.reduce((sum, activity) => sum + Math.abs(Math.min(0, getStockDelta(activity))), 0);
    const usedOrders = new Set(activities.map(getUsageTarget).filter((target) => target !== "No order reference")).size;
    const touchedItems = new Set(activities.map((activity) => activity.inventoryId).filter(Boolean)).size;

    return {
      totalLogs: activities.length,
      stockOut,
      usedOrders,
      touchedItems,
    };
  }, [activities]);

  return (
    <div className="font-inter space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Inventory Usage History</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your stock-outs and linked order notes.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Logs" value={stats.totalLogs} sub="Recorded usage" icon={BarChart3} accentColor="#2563EB" />
        <StatCard label="Stock Out" value={formatQty(stats.stockOut)} sub="Units consumed" icon={ArrowDownCircle} accentColor="#DC2626" />
        <StatCard label="Linked Orders" value={stats.usedOrders} sub="Recorded in notes" icon={Package} accentColor="#7C3AED" />
        <StatCard label="Items Touched" value={stats.touchedItems} sub="Unique supplies" icon={Tag} accentColor="#059669" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, order, customer, or note..."
              className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => loadHistory({ showLoader: true })}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title="Sync Records"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${showFiltersMenu || hasActiveFilters ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <Filter size={16} />
            </button>

            {showFiltersMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[1000] py-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                  {categoryFilter !== "All" && (
                    <button onClick={() => setCategoryFilter("All")} className="text-[9px] font-bold text-blue-600 hover:underline">Reset</button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto mb-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setCategoryFilter(category);
                        setShowFiltersMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 ${categoryFilter === category ? "text-blue-600 bg-blue-50" : "text-slate-600"}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 my-1" />

                <div className="px-4 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort By</span>
                  {sortBy !== "newest" && (
                    <button onClick={() => setSortBy("newest")} className="text-[9px] font-bold text-blue-600 hover:underline">Reset</button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowFiltersMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 ${sortBy === option.value ? "text-blue-600 bg-blue-50" : "text-slate-600"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {(hasActiveFilters) && (
                  <>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setCategoryFilter("All");
                        setSortBy("newest");
                        setShowFiltersMenu(false);
                      }}
                      className="w-full px-4 py-2 text-[10px] font-medium text-rose-600 hover:bg-rose-50 text-center uppercase tracking-widest"
                    >
                      Clear All Filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock size={15} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-900">My Stock-Out Records</p>
          <span className="ml-auto bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
            {filteredActivities.length}
          </span>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Date", "Item", "Movement", "Customer / Service", "Notes", "Actions"].map((heading) => (
                  <th key={heading} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-5 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, row) => (
                  <tr key={row} className="border-b border-slate-50">
                    {Array.from({ length: 6 }).map((__, column) => (
                      <td key={column} className="px-5 py-3.5">
                        <SkeletonBlock className={`${column === 1 ? "h-4 w-36" : "h-3 w-24"} bg-slate-100`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No usage history found.</td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity._id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatDateTime(activity.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900">{activity.inventoryName || "Inventory item"}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.category || "Uncategorized"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-100">
                        <ArrowDownCircle size={12} />
                        {formatMovement(activity)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{activity.usageContext?.customerName || "N/A"}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.usageContext?.serviceType || "Service not set"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-500 max-w-[260px] line-clamp-2">{activity.note || "No note"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedActivity(activity)}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <SkeletonBlock className="h-4 w-36" />
                      <SkeletonBlock className="h-3 w-28 bg-slate-100" />
                    </div>
                    <SkeletonBlock className="h-5 w-16 rounded-full bg-slate-100" />
                  </div>
                  <SkeletonBlock className="h-9 w-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No usage history found.</div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{activity.inventoryName || "Inventory item"}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-rose-600">{formatMovement(activity)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 line-clamp-2">{activity.note || "No note"}</p>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(activity)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Eye size={14} />
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
        <User size={16} className="mt-0.5 shrink-0" />
        <p>
          These records are synced from the same inventory activity log that admins see, filtered to your stock-out actions.
        </p>
      </div>

      {selectedActivity && (
        <DetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      )}
    </div>
  );
}
