import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Layers,
  Package,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  User,
  X,
} from "lucide-react"
import { getInventoryUpdatesWebSocketUrl, inventoryApi } from "../../services/inventoryApi"
import { fmt } from "../../utils/helpers.js"
import { SkeletonBlock } from "../../components/SkeletonLoaders.jsx"

const SOCKET_RECONNECT_MS = 2500
const SOCKET_REFRESH_DEBOUNCE_MS = 200
const HISTORY_FETCH_LIMIT = 500

const ACTION_OPTIONS = [
  { value: "All", label: "All Activity" },
  { value: "increase", label: "Stock In" },
  { value: "decrease", label: "Stock Out" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "archive", label: "Archived" },
  { value: "restore", label: "Restored" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest -> Oldest" },
  { value: "oldest", label: "Oldest -> Newest" },
  { value: "item-az", label: "Item A -> Z" },
  { value: "item-za", label: "Item Z -> A" },
]

function formatQty(value) {
  const numericValue = Number(value) || 0
  return Number.isInteger(numericValue)
    ? `${numericValue}`
    : numericValue.toFixed(2).replace(/\.?0+$/, "")
}

function formatDateTime(value) {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(value) {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getActionConfig(actionType) {
  const map = {
    create: {
      label: "Created",
      Icon: Package,
      badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      soft: "bg-emerald-50 text-emerald-600",
    },
    increase: {
      label: "Stock In",
      Icon: ArrowUpCircle,
      badge: "bg-blue-50 text-blue-700 border border-blue-200",
      soft: "bg-blue-50 text-blue-600",
    },
    decrease: {
      label: "Stock Out",
      Icon: ArrowDownCircle,
      badge: "bg-rose-50 text-rose-700 border border-rose-200",
      soft: "bg-rose-50 text-rose-600",
    },
    update: {
      label: "Updated",
      Icon: Pencil,
      badge: "bg-violet-50 text-violet-700 border border-violet-200",
      soft: "bg-violet-50 text-violet-600",
    },
    archive: {
      label: "Archived",
      Icon: Archive,
      badge: "bg-amber-50 text-amber-700 border border-amber-200",
      soft: "bg-amber-50 text-amber-600",
    },
    restore: {
      label: "Restored",
      Icon: RotateCcw,
      badge: "bg-teal-50 text-teal-700 border border-teal-200",
      soft: "bg-teal-50 text-teal-600",
    },
  }

  return map[actionType] || map.update
}

function getStockDelta(activity) {
  const previousStock = Number(activity?.previousStock) || 0
  const newStock = Number(activity?.newStock) || 0
  return newStock - previousStock
}

function formatMovement(activity) {
  const delta = getStockDelta(activity)
  const fallbackAmount = Number(activity?.amount) || 0
  const amount = delta !== 0 ? Math.abs(delta) : fallbackAmount
  const unitLabel = activity?.unit ? ` ${activity.unit}` : ""

  if (delta > 0) return `Added ${formatQty(amount)}${unitLabel}`
  if (delta < 0) return `Deducted ${formatQty(amount)}${unitLabel}`
  if (activity?.actionType === "archive") return "Archived"
  if (activity?.actionType === "restore") return "Restored"
  return amount > 0 ? `${formatQty(amount)}${unitLabel}` : "No stock change"
}

function getStockFlow(activity) {
  return `${formatQty(activity?.previousStock)} -> ${formatQty(activity?.newStock)}`
}

function getBatchSummary(activity) {
  const batchBreakdown = Array.isArray(activity?.batchBreakdown) ? activity.batchBreakdown : []
  if (batchBreakdown.length === 0) return "No batch detail"

  const preview = batchBreakdown
    .slice(0, 2)
    .map((batch) => `${batch.batchCode || "BATCH"} x ${formatQty(batch.quantity)}`)
    .join(", ")

  if (batchBreakdown.length <= 2) return preview
  return `${preview} +${batchBreakdown.length - 2} more`
}

function getUsageTarget(activity) {
  return (
    activity?.usageContext?.orderDisplayId ||
    activity?.usageContext?.orderLabel ||
    activity?.usageContext?.orderId ||
    ""
  )
}

function StatCard({ label, value, sub, icon: Icon, accent, bgAccent }) {
  return (
    <div
      className="bg-white rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: bgAccent }}>
          <Icon size={13} color={accent} strokeWidth={2.2} className="sm:hidden" />
          <Icon size={15} color={accent} strokeWidth={2.2} className="hidden sm:block" />
        </div>
        <span className="text-[8px] sm:text-[11px] font-bold sm:font-semibold text-gray-500 leading-tight">{label}</span>
      </div>
      <div className="mt-[-4px] text-[12px] sm:text-[14px] font-extrabold text-gray-900 leading-none tracking-tight pl-0 sm:pl-[40px] text-center sm:text-left">{value}</div>
      <div className="hidden sm:block text-[10px] text-gray-400 mt-0.5 pl-[40px]">{sub}</div>
    </div>
  )
}

function ActionBadge({ actionType }) {
  const { label, Icon, badge } = getActionConfig(actionType)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

function MobileHistoryCard({ item, onView }) {
  const { Icon, soft } = getActionConfig(item.actionType)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-gray-900 text-sm">{item.inventoryName || "Inventory item"}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Tag size={10} />
              {item.category || "Uncategorized"}
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {item.inventorySku || "N/A"}
            </span>
          </div>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${soft}`}>
          <Icon size={16} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <ActionBadge actionType={item.actionType} />
        <span className="text-xs font-semibold text-slate-500">{formatMovement(item)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-slate-400">Stock Flow</p>
          <p className="font-semibold text-slate-700 mt-1">{getStockFlow(item)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-slate-400">Batches</p>
          <p className="font-semibold text-slate-700 mt-1">{Array.isArray(item.batchBreakdown) ? item.batchBreakdown.length : 0}</p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-slate-500 mb-3">
        <p className="flex items-center gap-1.5"><Clock size={11} /> {formatDateTime(item.createdAt)}</p>
        <p className="flex items-center gap-1.5"><User size={11} /> {item.performedByName || "System"} ({item.performedByRole || "system"})</p>
        {getUsageTarget(item) && (
          <p className="text-blue-600 font-semibold">Used for {getUsageTarget(item)}</p>
        )}
        <p className="text-slate-400 leading-relaxed">{item.note || getBatchSummary(item)}</p>
      </div>

      <button
        onClick={() => onView(item)}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        <Eye size={14} />
        View Details
      </button>
    </div>
  )
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

function DetailModal({ item, onClose }) {
  const { label, Icon, badge, soft } = getActionConfig(item.actionType)
  const batchBreakdown = Array.isArray(item.batchBreakdown) ? item.batchBreakdown : []

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[92vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-4 py-4 sm:px-5 sm:py-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${soft}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{item.inventoryName || "Inventory item"}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {item.inventorySku || "N/A"}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {item.category || "Uncategorized"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge}`}>
                    <Icon size={12} />
                    {label}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500">Detailed stock movement and batch usage.</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center shrink-0"
            aria-label="Close movement details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Movement</p>
                <p className="mt-2 text-base font-bold text-gray-900">{formatMovement(item)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Flow</p>
                <p className="mt-2 text-base font-bold text-gray-900">{getStockFlow(item)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Movement Cost</p>
                <p className="mt-2 text-base font-bold text-emerald-600">{fmt(item.totalCost || 0)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recorded At</p>
                <p className="mt-2 text-base font-bold text-gray-900">{formatDateTime(item.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actor</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.performedByName || "System"}</p>
                    <p className="text-sm text-slate-500 capitalize">{item.performedByRole || "system"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Used For</p>
                <p className="font-semibold text-gray-900">{getUsageTarget(item) || "No order reference"}</p>
                {(item.usageContext?.customerName || item.usageContext?.serviceType) && (
                  <p className="mt-1 text-sm text-slate-500">
                    {[item.usageContext?.customerName, item.usageContext?.serviceType].filter(Boolean).join(" / ")}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Notes</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.note || "No additional note was recorded for this movement."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Stock Batch Breakdown</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {batchBreakdown.length > 0
                      ? `${batchBreakdown.length} batch record${batchBreakdown.length === 1 ? "" : "s"} tracked`
                      : "No stock batch impact recorded"}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Total {fmt(item.totalCost || 0)}
                </span>
              </div>

              {batchBreakdown.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-400">
                  No batch breakdown is attached to this activity.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {["Batch", "Quantity", "Unit Cost", "Line Cost", "Received"].map((heading) => (
                          <th key={heading} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {batchBreakdown.map((batch, index) => (
                        <tr key={`${batch.batchCode || "batch"}-${index}`} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                              {batch.batchCode || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {formatQty(batch.quantity)} {item.unit || ""}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{fmt(batch.unitPrice || 0)}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(batch.lineCost || 0)}</td>
                          <td className="px-4 py-3 text-slate-500">{formatShortDate(batch.receivedAt)}</td>
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
    </div>
  )
}

export default function AdInventoryHistory() {
  const [activities, setActivities] = useState([])
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [actionFilter, setActionFilter] = useState("All")
  const [sortBy, setSortBy] = useState("newest")
  const [activeDropdown, setActiveDropdown] = useState(null) // 'category', 'action', 'sort'
  const [activeFilterMenu, setActiveFilterMenu] = useState(null) // 'category', 'action', 'sort'
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [socketStatus, setSocketStatus] = useState("connecting")
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const refreshTimeoutRef = useRef(null)

  const refreshHistoryPage = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const activityData = await inventoryApi.getInventoryActivity(HISTORY_FETCH_LIMIT)
      setActivities(Array.isArray(activityData) ? activityData : [])
      setError(null)
      setLastSyncedAt(new Date())
    } catch (err) {
      console.error("Failed to load inventory history:", err)

      if (showLoader) {
        setError("Failed to load inventory history")
        setActivities([])
      }
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void refreshHistoryPage({ showLoader: true })

    const handleClickOutside = () => setActiveDropdown(null)
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    let isDisposed = false

    const scheduleHistoryRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        if (!isDisposed) {
          void refreshHistoryPage()
        }
      }, SOCKET_REFRESH_DEBOUNCE_MS)
    }

    const connectInventorySocket = () => {
      if (isDisposed) return

      setSocketStatus("connecting")

      const socket = new WebSocket(getInventoryUpdatesWebSocketUrl())
      socketRef.current = socket

      socket.onopen = () => {
        if (!isDisposed) {
          setSocketStatus("connected")
          void refreshHistoryPage()
        }
      }

      socket.onmessage = (event) => {
        if (isDisposed) return

        try {
          const message = JSON.parse(event.data)
          if (message?.type === "inventory:changed") {
            scheduleHistoryRefresh()
          }
        } catch (socketError) {
          console.error("Failed to parse inventory history socket message:", socketError)
        }
      }

      socket.onerror = () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close()
        }
      }

      socket.onclose = () => {
        if (isDisposed) return

        setSocketStatus("disconnected")
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectInventorySocket()
        }, SOCKET_RECONNECT_MS)
      }
    }

    connectInventorySocket()

    return () => {
      isDisposed = true

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        socketRef.current.close()
      }
    }
  }, [])

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(activities.map((activity) => activity.category).filter(Boolean))]
    return ["All", ...categories.sort((left, right) => left.localeCompare(right))]
  }, [activities])

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase()

    let nextActivities = activities.filter((activity) => {
      const matchesQuery =
        query.length === 0 ||
        [
          activity.inventoryName,
          activity.inventorySku,
          activity.category,
          activity.performedByName,
          activity.note,
          getUsageTarget(activity),
          activity.usageContext?.customerName,
          activity.usageContext?.serviceType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      const matchesCategory = categoryFilter === "All" || activity.category === categoryFilter
      const matchesAction = actionFilter === "All" || activity.actionType === actionFilter

      return matchesQuery && matchesCategory && matchesAction
    })

    if (sortBy === "newest") {
      nextActivities = [...nextActivities].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    }
    if (sortBy === "oldest") {
      nextActivities = [...nextActivities].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
    }
    if (sortBy === "item-az") {
      nextActivities = [...nextActivities].sort((left, right) => String(left.inventoryName || "").localeCompare(String(right.inventoryName || "")))
    }
    if (sortBy === "item-za") {
      nextActivities = [...nextActivities].sort((left, right) => String(right.inventoryName || "").localeCompare(String(left.inventoryName || "")))
    }

    return nextActivities
  }, [actionFilter, activities, categoryFilter, search, sortBy])

  const stats = useMemo(() => {
    const totalLogs = activities.length
    const stockIn = activities.reduce((sum, activity) => sum + Math.max(0, getStockDelta(activity)), 0)
    const stockOut = activities.reduce((sum, activity) => sum + Math.abs(Math.min(0, getStockDelta(activity))), 0)
    const touchedItems = new Set(activities.map((activity) => activity.inventoryId).filter(Boolean)).size
    const batchTouches = activities.reduce((sum, activity) => sum + (Array.isArray(activity.batchBreakdown) ? activity.batchBreakdown.length : 0), 0)
    const movementValue = activities.reduce((sum, activity) => sum + (Number(activity.totalCost) || 0), 0)
    const nonStockChanges = activities.filter((activity) => ["update", "archive", "restore"].includes(activity.actionType)).length

    return {
      totalLogs,
      stockIn,
      stockOut,
      touchedItems,
      batchTouches,
      movementValue,
      nonStockChanges,
    }
  }, [activities])

  const statCards = [
    { label: "Total Logs", value: stats.totalLogs, sub: "Latest synced records", icon: BarChart3, accent: "#2563EB", bgAccent: "#EFF6FF" },
    { label: "Stock In", value: formatQty(stats.stockIn), sub: "Units received or opened", icon: ArrowUpCircle, accent: "#2563EB", bgAccent: "#EFF6FF" },
    { label: "Stock Out", value: formatQty(stats.stockOut), sub: "Units used from stock", icon: ArrowDownCircle, accent: "#DC2626", bgAccent: "#FEF2F2" },
    { label: "Items Touched", value: stats.touchedItems, sub: "Unique inventory records", icon: Package, accent: "#7C3AED", bgAccent: "#F5F3FF" },
    { label: "Movement Value", value: fmt(stats.movementValue), sub: "Tracked stock cost", icon: ShoppingBag, accent: "#059669", bgAccent: "#ECFDF5" },
    { label: "Batch Touches", value: stats.batchTouches, sub: "Stock batches involved", icon: Layers, accent: "#0891B2", bgAccent: "#ECFEFF" },
    { label: "Adjustments", value: stats.nonStockChanges, sub: "Update, archive, restore", icon: Pencil, accent: "#D97706", bgAccent: "#FFFBEB" },
  ]

  if (error && activities.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-inter">
        <div className="px-4 lg:px-6 py-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-12 text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">Inventory history unavailable</p>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => void refreshHistoryPage({ showLoader: true })}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter overflow-x-hidden">
      <div className="px-4 lg:px-6 py-2 top-0 z-100 overflow-visible">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-2 sm:gap-3 mb-3">
          {statCards.map(({ icon: Icon, label, value, sub, accent, bgAccent }, index) => (
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
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search item, SKU, actor, or note..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors"
              />
            </div>

            {/* Actions Group - Standard Icons for Mobile, Labels for Desktop */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => void refreshHistoryPage({ showLoader: true })}
                className="w-10 h-10 lg:w-auto lg:px-4 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
                title="Sync Now"
              >
                <RefreshCw size={16} />
                <span className="hidden lg:inline text-sm font-semibold">Sync</span>
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
                          value={categoryFilter}
                          isOpen={activeFilterMenu === 'category'}
                          onToggle={() => setActiveFilterMenu(activeFilterMenu === 'category' ? null : 'category')}
                          onChange={(val) => { setCategoryFilter(val); setActiveFilterMenu(null); }}
                          options={categoryOptions}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Action</label>
                        <FilterSelect
                          value={actionFilter}
                          isOpen={activeFilterMenu === 'action'}
                          onToggle={() => setActiveFilterMenu(activeFilterMenu === 'action' ? null : 'action')}
                          onChange={(val) => { setActionFilter(val); setActiveFilterMenu(null); }}
                          options={ACTION_OPTIONS}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Sort By</label>
                        <FilterSelect
                          value={sortBy}
                          isOpen={activeFilterMenu === 'sort'}
                          onToggle={() => setActiveFilterMenu(activeFilterMenu === 'sort' ? null : 'sort')}
                          onChange={(val) => { setSortBy(val); setActiveFilterMenu(null); }}
                          options={SORT_OPTIONS}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden space-y-3 mb-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <SkeletonBlock className="h-4 w-40" />
                      <SkeletonBlock className="h-3 w-28 bg-slate-100" />
                    </div>
                    <SkeletonBlock className="h-7 w-20 rounded-full bg-slate-100" />
                  </div>
                  <SkeletonBlock className="h-10 w-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              <ShoppingBag size={28} className="mx-auto mb-2 opacity-30" />
              No history records found.
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <MobileHistoryCard key={activity._id} item={activity} onView={setSelectedActivity} />
            ))
          )}
        </div>

        <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={15} className="text-blue-600" />
                Stock Movement History
                <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">{filteredActivities.length}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Showing the latest {activities.length} synced inventory activity records.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1260px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Date", "Item", "Action", "Movement", "Stock Flow", "Batches", "Cost", "Performed By", "Notes", "Actions"].map((heading) => (
                    <th key={heading} className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, row) => (
                    <tr key={row} className="border-b border-slate-50">
                      {Array.from({ length: 10 }).map((__, column) => (
                        <td key={column} className="px-4 py-3">
                          <SkeletonBlock className={`${column === 1 ? "h-4 w-36" : "h-3 w-24"} bg-slate-100`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400">
                      <ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />
                      No history records found.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <tr key={activity._id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{formatDateTime(activity.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{activity.inventoryName || "Inventory item"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Tag size={10} />
                            {activity.category || "Uncategorized"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                            {activity.inventorySku || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge actionType={activity.actionType} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">{formatMovement(activity)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700">{getStockFlow(activity)}</span>
                        <p className="text-[10px] text-slate-400 mt-1">Before to after</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-blue-600">{Array.isArray(activity.batchBreakdown) ? activity.batchBreakdown.length : 0}</span>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] truncate">{getBatchSummary(activity)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-emerald-600">{fmt(activity.totalCost || 0)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{activity.performedByName || "System"}</p>
                        <p className="text-[10px] text-slate-400 capitalize mt-1">{activity.performedByRole || "system"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500 max-w-[220px] line-clamp-2">
                          {activity.note || "No additional note was recorded."}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedActivity(activity)}
                          className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold px-3 py-2 rounded-lg"
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
        </div>
      </div>

      {selectedActivity && (
        <DetailModal item={selectedActivity} onClose={() => setSelectedActivity(null)} />
      )}
    </div>
  )
}
