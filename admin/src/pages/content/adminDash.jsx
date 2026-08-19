import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { CalendarClock, Loader2, CheckCircle2, ShoppingBag, XCircle, Eye, CalendarDays, ChevronDown, ChevronUp, User, Scissors, Clock, Filter, Package, AlertTriangle, Archive, RefreshCw, Search, } from "lucide-react";
import { bookingApi } from "../../services/bookingApi";
import { inventoryApi } from "../../services/inventoryApi";
import { DashboardSkeleton } from "../../components/SkeletonLoaders.jsx";
import {
  StatCard,
  StatusBadge,
  DataCard,
  EmptyState,
  FilterBar,
  SectionHeader,
} from "../../components/ui";
import {
  getPickupSlotBucket,
  getPickupSlotDisplay,
  getPickupSlotSortValue,
} from "../../utils/pickupSlot.js";

const formatDateLabel = (date) =>
  date
    ? date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "No Date";

const parseDateValue = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      const [, y, m, d] = ymd;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const normalizeServiceLabel = (service) => {
  const text = String(service || "").toLowerCase();
  if (text.includes("repair")) return "Repair";
  if (text.includes("jersey")) return "Team Jersey";
  if (text.includes("organizational") || text.includes("organization") || text.includes("custom")) return "Organization";
  return "Service";
};

const getRepairDisplayLabel = (booking = {}) =>
  booking.selectedOptions?.[0]?.name || booking.service || booking.repairDescription || "Repair";

const getBookingDisplayLabel = (booking = {}) => {
  if (booking.bookingType === "jersey") {
    return booking.teamName || booking.service || "Team Jersey";
  }

  if (booking.bookingType === "organizational") {
    return booking.orgName || booking.service || "Organization";
  }

  if (booking.bookingType === "repair") {
    return getRepairDisplayLabel(booking);
  }

  return booking.service || booking.teamName || booking.orgName || normalizeServiceLabel(booking.bookingType);
};

const normalizeAppointmentStatus = (status) => {
  const text = String(status || "").toLowerCase();
  if (text.includes("overdue")) return "Overdue";
  if (text.includes("cancel")) return "Cancel/Incomplete";
  if (text.includes("released")) return "Released";
  if (text.includes("complete")) return "Complete";
  if (text.includes("progress")) return "In-Progress";
  if (text.includes("approved") || text.includes("confirm")) return "Confirmed";
  return "Pending";
};

const parseTime = (value) => getPickupSlotSortValue(value, "No Time");

function parseDate(d) {
  return parseDateValue(d) || new Date(0);
}

const formatCurrency = (value) =>
  `PHP ${Number(value || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

const formatDateKey = (date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const DAILY_BOOKING_BUCKETS = [
  { label: getPickupSlotDisplay("morning"), value: "morning" },
  { label: getPickupSlotDisplay("afternoon"), value: "afternoon" },
  { label: getPickupSlotDisplay("evening"), value: "evening" },
  { label: "Unscheduled", value: "unscheduled" },
];

const getDailyBookingBucket = (timeValue) =>
  getPickupSlotBucket(timeValue, "No Time");

const FILTER_OPTIONS = [
  { label: "Today", value: "time" },
  { label: "By Date", value: "date" },
  { label: "In-Progress", value: "In-Progress" },
  { label: "Complete", value: "Complete" },
  { label: "Pending", value: "Pending" },
];

const BOOKING_VOLUME_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

const BOOKING_VOLUME_META = {
  daily: {
    title: "Daily Booking Volume",
    subtitle: "Bookings scheduled, completed & cancelled today",
  },
  weekly: {
    title: "Weekly Booking Volume",
    subtitle: "Bookings scheduled, completed & cancelled this week",
  },
  monthly: {
    title: "Monthly Booking Volume",
    subtitle: "Bookings scheduled, completed & cancelled this year",
  },
  quarterly: {
    title: "Quarterly Booking Volume",
    subtitle: "Bookings scheduled, completed & cancelled this year",
  },
  yearly: {
    title: "Yearly Booking Volume",
    subtitle: "Bookings scheduled, completed & cancelled in recent years",
  },
};

const CLOSED_APPOINTMENT_STATUSES = new Set(["Complete", "Released", "Cancel/Incomplete"]);

const CustomDot = ({ cx, cy, fill }) => (
  <circle cx={cx} cy={cy} fill={fill} stroke="#fff" strokeWidth={2} />
);

function ApptCard({ appt, showView = false, onViewOrder, isClickable = false }) {
  const handleCardClick = (event) => {
    if (isClickable && onViewOrder) {
      onViewOrder(appt.orderId);
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onViewOrder(appt.orderId);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`p-3 sm:p-3.5 bg-white border border-slate-200/80 rounded-xl transition-all duration-200 ${isClickable ? "cursor-pointer hover:bg-slate-50/90 hover:border-blue-300 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none" : ""
        }`}
    >
      {/* Top Header Row: Service Title + Action Button */}
      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarDays size={13} />
            </div>
            <h4 className="text-xs font-extrabold text-slate-900 leading-snug m-0 truncate">{appt.service}</h4>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <StatusBadge status={appt.status} size="xs" />
            {appt.isOverCapacity && (
              <StatusBadge status="overdue" label="Over Capacity" size="xs" />
            )}
          </div>
        </div>
        {showView && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onViewOrder && onViewOrder(appt.orderId);
            }}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
          >
            <Eye size={12} />
            <span>View</span>
          </button>
        )}
      </div>

      {/* Metadata Section: Customer & Tailor Grid + Time & Date */}
      <div className="space-y-1.5 text-xs pt-0.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
          <div className="flex items-center gap-1.5 min-w-0">
            <User size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] font-medium shrink-0">Customer:</span>
            <span className="font-semibold text-slate-800 truncate">{appt.customer}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Scissors size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] font-medium shrink-0">Tailor:</span>
            <span className="font-semibold text-slate-800 truncate">{appt.tailor || 'Unassigned'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-50">
          <Clock size={12} className="text-blue-500 shrink-0" />
          <span className="font-semibold text-slate-700 whitespace-nowrap">{appt.time}</span>
          <span className="text-slate-300">•</span>
          <span className="font-medium text-slate-600 whitespace-nowrap">{appt.date}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onNavigateToOrders }) {
  const navigate = useNavigate();
  const [activeServiceIdx, setActiveServiceIdx] = useState(null);
  const [apptFilter, setApptFilter] = useState("time");
  const [bookingVolumeRange, setBookingVolumeRange] = useState("weekly");
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [overdueFilter, setOverdueFilter] = useState("all");
  const [kpiTab, setKpiTab] = useState("operations");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [bookingResponse, inventoryResponse] = await Promise.allSettled([
        bookingApi.getAllBookings(),
        inventoryApi.getAllInventory(),
      ]);
      const rawBookings =
        bookingResponse.status === "fulfilled"
          ? bookingResponse.value?.bookings || bookingResponse.value?.data || []
          : [];
      const rawInventory =
        inventoryResponse.status === "fulfilled"
          ? inventoryResponse.value
          : [];

      const normalizedAppointments = (Array.isArray(rawBookings) ? rawBookings : [])
        .map((booking) => {
          const dateObj = parseDateValue(booking.pickupDate || booking.createdAt);
          const linkedOrderId =
            (typeof booking.orderId === "string"
              ? booking.orderId
              : booking.orderId?._id) || booking._id;

          const dropStep = Array.isArray(booking.steps)
            ? booking.steps.find(s => String(s.label || s.step || "").toLowerCase().includes("drop") && s.date)
            : null;
          const dropDateObj = dropStep ? parseDateValue(dropStep.date) : null;

          return {
            id: booking._id,
            service: getBookingDisplayLabel(booking),
            date: formatDateLabel(dateObj),
            dateObj,
            dropDateObj,
            time: getPickupSlotDisplay(booking.pickupSlot, "No Time"),
            status: normalizeAppointmentStatus(booking.status),
            customer: booking.contact?.fullName || "Unknown Customer",
            tailor: booking.assignedTailor || "Unassigned",
            orderId: linkedOrderId,
            bookingType: booking.bookingType,
            createdAtValue: parseDateValue(booking.createdAt),
            isOverCapacity: Boolean(booking.isOverCapacity),
            capacityLabel: booking.capacitySnapshot
              ? `${booking.capacitySnapshot.totalBookedBefore || booking.capacitySnapshot.bookedBefore || 0}/${booking.capacitySnapshot.totalMax || booking.capacitySnapshot.max || 10}`
              : "",
          };
        })
        .sort(
          (a, b) =>
            (b.createdAtValue?.getTime?.() || 0) -
            (a.createdAtValue?.getTime?.() || 0)
        );

      setAppointments(normalizedAppointments);

      const normalizedInventory = (Array.isArray(rawInventory) ? rawInventory : []).map((item) => ({
        ...item,
        stock: Number(item?.stock) || 0,
        unitPrice: Number(item?.unitPrice) || 0,
        currentStockValue: Number(item?.currentStockValue) || 0,
      }));
      setInventory(normalizedInventory);

      const failedSources = [];
      if (bookingResponse.status === "rejected") failedSources.push("bookings");
      if (inventoryResponse.status === "rejected") failedSources.push("inventory");
      if (failedSources.length > 0) {
        setError(`Some dashboard data failed to load (${failedSources.join(", ")}).`);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setAppointments([]);
      setInventory([]);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrowDate = useMemo(() => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + 1);
    return d;
  }, [todayDate]);

  const TODAY = formatDateLabel(todayDate);
  const TOMORROW = formatDateLabel(tomorrowDate);
  const todayDateKey = formatDateKey(todayDate);

  const apptToday = useMemo(
    () =>
      appointments
        .filter((a) => isSameDay(a.dateObj, todayDate))
        .sort((a, b) => parseTime(a.time) - parseTime(b.time)),
    [appointments, todayDate]
  );

  const apptOverdue = useMemo(
    () =>
      appointments
        .filter((a) => {
          if (!a.dateObj) return false;
          const isPast = a.dateObj < todayDate;
          const isPending = !CLOSED_APPOINTMENT_STATUSES.has(a.status);
          if (!isPast || !isPending) return false;

          if (overdueFilter === "yesterday") {
            const yesterday = new Date(todayDate);
            yesterday.setDate(yesterday.getDate() - 1);
            return isSameDay(a.dateObj, yesterday);
          }
          if (overdueFilter === "week") {
            const lastWeek = new Date(todayDate);
            lastWeek.setDate(lastWeek.getDate() - 7);
            return a.dateObj >= lastWeek;
          }
          if (overdueFilter === "month") {
            const lastMonth = new Date(todayDate);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return a.dateObj >= lastMonth;
          }
          return true;
        })
        .sort(
          (a, b) =>
            parseDate(a.dateObj) - parseDate(b.dateObj) ||
            parseTime(a.time) - parseTime(b.time)
        ),
    [appointments, todayDate, overdueFilter]
  );

  const overCapacityRequests = useMemo(
    () =>
      appointments
        .filter((a) => a.isOverCapacity && !CLOSED_APPOINTMENT_STATUSES.has(a.status))
        .sort(
          (a, b) =>
            (b.createdAtValue?.getTime?.() || 0) -
            (a.createdAtValue?.getTime?.() || 0)
        ),
    [appointments]
  );

  const filteredAllAppts = useMemo(() => {
    let all = appointments.filter(a => a.status === "Complete");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter(a =>
        a.service.toLowerCase().includes(q) ||
        a.customer.toLowerCase().includes(q) ||
        String(a.orderId || "").toLowerCase().includes(q)
      );
    }

    return all.sort((a, b) => parseDate(a.dateObj) - parseDate(b.dateObj));
  }, [appointments, searchQuery]);

  const bookingCounts = useMemo(() => {
    const counts = {
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const appointment of appointments) {
      if (appointment.status === "In-Progress") counts.inProgress += 1;
      if (appointment.status === "Complete") counts.completed += 1;
      if (appointment.status === "Cancel/Incomplete") counts.cancelled += 1;
    }

    return counts;
  }, [appointments]);

  const todaySchedule = apptToday.length;
  const inProgressCount = bookingCounts.inProgress;
  const completeCount = bookingCounts.completed;
  const totalOrders = appointments.length;
  const cancelIncomplete = bookingCounts.cancelled;

  const inventoryStats = useMemo(() => {
    const activeItems = inventory.filter((item) => !item.archived);
    const archivedItems = inventory.filter((item) => item.archived);
    const totalItems = activeItems.length;
    const lowStock = activeItems.filter((item) => {
      const minStock = Number(item?.minStock) || 5;
      return item.stock > 0 && item.stock <= minStock;
    }).length;
    const outOfStock = activeItems.filter((item) => item.stock === 0).length;
    const totalValue = activeItems.reduce(
      (sum, item) =>
        sum + (Number(item.currentStockValue) || (item.stock * item.unitPrice)),
      0
    );

    return {
      totalItems,
      lowStock,
      outOfStock,
      archivedCount: archivedItems.length,
      totalValue,
    };
  }, [inventory]);

  const bookingVolumeMeta = BOOKING_VOLUME_META[bookingVolumeRange] || BOOKING_VOLUME_META.weekly;

  const bookingVolumeData = useMemo(() => {
    const normalizedAppointments = appointments
      .map((appointment) => {
        const dateValue = appointment.dateObj || appointment.createdAtValue;
        if (!dateValue) return null;

        const normalizedDate = new Date(dateValue);
        normalizedDate.setHours(0, 0, 0, 0);
        return {
          date: normalizedDate,
          status: appointment.status,
          time: appointment.time,
        };
      })
      .filter(Boolean);

    const buildPoint = (label, from, to) => {
      const point = {
        label,
        orders: 0,
        completed: 0,
        cancelled: 0,
      };

      normalizedAppointments.forEach((appointment) => {
        if (appointment.date < from || appointment.date >= to) return;
        point.orders += 1;
        if (appointment.status === "Complete") point.completed += 1;
        if (appointment.status === "Cancel/Incomplete") point.cancelled += 1;
      });

      return point;
    };

    const referenceDate = new Date(todayDate);
    referenceDate.setHours(0, 0, 0, 0);

    if (bookingVolumeRange === "daily") {
      return DAILY_BOOKING_BUCKETS.map((bucket) => {
        const point = {
          label: bucket.label,
          orders: 0,
          completed: 0,
          cancelled: 0,
        };

        normalizedAppointments.forEach((appointment) => {
          if (!isSameDay(appointment.date, referenceDate)) return;
          if (getDailyBookingBucket(appointment.time) !== bucket.value) return;

          point.orders += 1;
          if (appointment.status === "Complete") point.completed += 1;
          if (appointment.status === "Cancel/Incomplete") point.cancelled += 1;
        });

        return point;
      });
    }

    if (bookingVolumeRange === "monthly") {
      const currentYear = referenceDate.getFullYear();
      return Array.from({ length: 12 }, (_, idx) => {
        const from = new Date(currentYear, idx, 1);
        const to = new Date(currentYear, idx + 1, 1);
        const label = from.toLocaleDateString("en-US", { month: "short" });
        return buildPoint(label, from, to);
      });
    }

    if (bookingVolumeRange === "quarterly") {
      const currentYear = referenceDate.getFullYear();
      return Array.from({ length: 4 }, (_, idx) => {
        const quarter = idx + 1;
        const from = new Date(currentYear, idx * 3, 1);
        const to = new Date(currentYear, idx * 3 + 3, 1);
        return buildPoint(`Q${quarter}`, from, to);
      });
    }

    if (bookingVolumeRange === "yearly") {
      const currentYear = referenceDate.getFullYear();
      return Array.from({ length: 4 }, (_, idx) => {
        const year = currentYear - (3 - idx);
        const from = new Date(year, 0, 1);
        const to = new Date(year + 1, 0, 1);
        return buildPoint(String(year), from, to);
      });
    }

    const monday = new Date(referenceDate);
    const day = monday.getDay();
    const diffToMonday = (day + 6) % 7;
    monday.setDate(monday.getDate() - diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const from = new Date(monday);
      from.setDate(monday.getDate() + i);
      const to = new Date(from);
      to.setDate(from.getDate() + 1);
      const label = from.toLocaleDateString("en-US", { weekday: "short" });
      return buildPoint(label, from, to);
    });
  }, [appointments, bookingVolumeRange, todayDate]);

  const serviceMix = useMemo(() => {
    const counts = {
      Repair: 0,
      "Team Jersey": 0,
      Organization: 0,
    };

    const addCount = (label) => {
      if (label === "Repair") counts.Repair += 1;
      if (label === "Team Jersey") counts["Team Jersey"] += 1;
      if (label === "Organization") counts.Organization += 1;
    };

    appointments.forEach((appt) =>
      addCount(normalizeServiceLabel(appt.bookingType || appt.service))
    );

    const total = counts.Repair + counts["Team Jersey"] + counts.Organization;

    const toPercent = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return [
      { name: "Repair", value: toPercent(counts.Repair), color: "#EF4444" },
      { name: "Team Jersey", value: toPercent(counts["Team Jersey"]), color: "#0400ff" },
      { name: "Organization", value: toPercent(counts.Organization), color: "#F59E0B" },
    ];
  }, [appointments]);

  const STAT_CARDS = useMemo(() => [
    {
      icon: CalendarClock,
      label: "Today's Schedule",
      value: todaySchedule,
      sub: "Today's appts.",
      accent: "#3B82F6",
      bgAccent: "#EFF6FF",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/appointment", {
          selectedDateStr: todayDateKey,
          showSchedule: true,
          activeFilter: "all",
        }),
    },
    {
      icon: Loader2,
      label: "In-Progress",
      value: inProgressCount,
      sub: "Active bookings",
      accent: "#7C3AED",
      bgAccent: "#F5F3FF",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/orders", {
          filterStatus: "In Progress",
        }),
    },
    {
      icon: AlertTriangle,
      label: "Overdue",
      value: apptOverdue.length,
      sub: "Past due date",
      accent: "#DC2626",
      bgAccent: "#FEF2F2",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/orders", {
          filterStatus: "Overdue",
        }),
    },
    {
      icon: CheckCircle2,
      label: "Complete",
      value: completeCount,
      sub: "Completed bookings",
      accent: "#059669",
      bgAccent: "#ECFDF5",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/orders", {
          filterStatus: "Completed",
        }),
    },
    {
      icon: XCircle,
      label: "Cancel / Incomplete",
      value: cancelIncomplete,
      sub: "Needs attention",
      accent: "#EF4444",
      bgAccent: "#FEF2F2",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/orders", {
          filterStatus: "Cancelled",
        }),
    },
    {
      icon: ShoppingBag,
      label: "Total Orders",
      value: totalOrders,
      sub: "All bookings",
      accent: "#0891B2",
      bgAccent: "#ECFEFF",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/orders", {
          filterStatus: "All Records",
        }),
    },
  ], [todaySchedule, todayDateKey, inProgressCount, apptOverdue.length, completeCount, cancelIncomplete, totalOrders]);

  const INVENTORY_STAT_CARDS = useMemo(() => [
    {
      icon: Package,
      label: "Inventory Items",
      value: inventoryStats.totalItems,
      sub: "Active inventory",
      accent: "#0EA5E9",
      bgAccent: "#ECFEFF",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/inventory", {
          showArchived: false,
          statFilter: "All",
        }),
    },
    {
      icon: AlertTriangle,
      label: "Low Stock",
      value: inventoryStats.lowStock,
      sub: "Below min stock",
      accent: "#F59E0B",
      bgAccent: "#FFFBEB",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/inventory", {
          showArchived: false,
          statFilter: "Low Stock",
        }),
    },
    {
      icon: XCircle,
      label: "Out of Stock",
      value: inventoryStats.outOfStock,
      sub: "Needs restock",
      accent: "#DC2626",
      bgAccent: "#FEF2F2",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/inventory", {
          showArchived: false,
          statFilter: "Out of Stock",
        }),
    },
    {
      icon: Archive,
      label: "Archived",
      value: inventoryStats.archivedCount,
      sub: "Archived items",
      accent: "#4F46E5",
      bgAccent: "#EEF2FF",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/inventory", {
          showArchived: true,
          statFilter: "All",
        }),
    },
    {
      icon: ShoppingBag,
      label: "Inventory Value",
      value: formatCurrency(inventoryStats.totalValue),
      sub: "Current stock value",
      accent: "#0F766E",
      bgAccent: "#F0FDFA",
      trend: null,
      onClick: () =>
        navigateWithDashboardPreset("/admin/inventory", {
          showArchived: false,
          statFilter: "All",
        }),
    },
  ], [inventoryStats]);

  const ALL_MOBILE_CARDS = useMemo(() => [
    ...STAT_CARDS,
    ...INVENTORY_STAT_CARDS,
  ], [STAT_CARDS, INVENTORY_STAT_CARDS]);

  const PRIORITY_MOBILE_CARDS = useMemo(() => [
    STAT_CARDS[0], // Today's Schedule
    STAT_CARDS[1], // In-Progress
    STAT_CARDS[2], // Overdue
    STAT_CARDS[5], // Total Orders
    INVENTORY_STAT_CARDS[1], // Low Stock
  ], [STAT_CARDS, INVENTORY_STAT_CARDS]);

  const hiddenMetricsCount = ALL_MOBILE_CARDS.length - PRIORITY_MOBILE_CARDS.length;

  const handleViewOrder = (orderId) => {
    if (!orderId) {
      navigate("/admin/orders");
      return;
    }

    if (onNavigateToOrders) {
      onNavigateToOrders(orderId);
    } else {
      navigate(`/admin/orders/${orderId}`);
    }
  };

  function navigateWithDashboardPreset(path, dashboardPreset = {}) {
    navigate(path, { state: { dashboardPreset } });
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && appointments.length === 0 && inventory.length === 0) {
    return (
      <div className="font-inter min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 m-0">Unable to load dashboard data</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
        <button
          type="button"
          onClick={fetchDashboardData}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-saas border-none cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="font-inter min-h-screen bg-slate-50 space-y-4">
      <div className="w-full px-2 lg:px-3 py-1">
        {/* Priority Attention / Urgent Alert Banner (Top Hierarchy) */}
        {overCapacityRequests.length > 0 && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 sm:p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Attention Required
                  </span>
                  <span className="text-xs font-bold text-amber-900">Over Capacity Requests</span>
                </div>
                <p className="mt-0.5 text-xs text-amber-800 font-medium m-0">
                  {overCapacityRequests.length} booking request{overCapacityRequests.length !== 1 ? "s" : ""} exceed recommended slot capacity
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigate('/admin/orders', { state: { filterStatus: 'Over Capacity' } });
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all border-none cursor-pointer shrink-0 self-end sm:self-auto shadow-2xs"
            >
              Review Requests ({overCapacityRequests.length})
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="text-xs font-bold text-rose-800 hover:text-rose-950 underline border-none bg-transparent cursor-pointer shrink-0"
            >
              Refresh Data
            </button>
          </div>
        )}

        {/* KPI Metrics Segmented Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-full sm:w-fit">
            <button
              type="button"
              onClick={() => setKpiTab("operations")}
              className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer flex items-center gap-1.5 ${kpiTab === "operations"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
            >
              <CalendarClock size={14} />
              <span>Operations Metrics</span>
            </button>
            <button
              type="button"
              onClick={() => setKpiTab("inventory")}
              className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer flex items-center gap-1.5 ${kpiTab === "inventory"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
            >
              <Package size={14} />
              <span>Inventory Metrics</span>
            </button>
          </div>

        </div>

        {/* KPI Metrics Ribbon */}
        {kpiTab === "operations" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard
              icon={CalendarClock}
              label="Today's Schedule"
              value={todaySchedule}
              sub="Pickups & drop-offs today"
              accentColor="#3B82F6"
              onClick={() =>
                navigateWithDashboardPreset("/admin/appointment", {
                  selectedDateStr: todayDateKey,
                  showSchedule: true,
                  activeFilter: "all",
                })
              }
            />
            <StatCard
              icon={Loader2}
              label="In-Progress"
              value={inProgressCount}
              sub="Active production orders"
              accentColor="#7C3AED"
              onClick={() =>
                navigateWithDashboardPreset("/admin/orders", {
                  filterStatus: "In Progress",
                })
              }
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={apptOverdue.length}
              sub="Past due target date"
              accentColor="#DC2626"
              onClick={() =>
                navigateWithDashboardPreset("/admin/orders", {
                  filterStatus: "Overdue",
                })
              }
            />
            <StatCard
              icon={ShoppingBag}
              label="Total Orders"
              value={totalOrders}
              sub="All system bookings"
              accentColor="#0891B2"
              onClick={() =>
                navigateWithDashboardPreset("/admin/orders", {
                  filterStatus: "All Records",
                })
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {INVENTORY_STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, trend, onClick }, index) => (
              <StatCard
                key={label}
                icon={Icon}
                label={label}
                value={value}
                sub={sub}
                accentColor={accent}
                trend={trend}
                onClick={onClick}
                className={index === INVENTORY_STAT_CARDS.length - 1 ? "col-span-2 md:col-span-1" : ""}
              />
            ))}
          </div>
        )}

        {/* Analytics & Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col h-full min-h-[300px]">
              <div className="mb-3 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="m-0 text-sm sm:text-base font-extrabold text-slate-900">{bookingVolumeMeta.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500 m-0">{bookingVolumeMeta.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 flex-wrap w-fit">
                  {BOOKING_VOLUME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBookingVolumeRange(option.value)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border-none cursor-pointer transition-colors ${bookingVolumeRange === option.value
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "bg-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={bookingVolumeData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md rounded-xl px-3.5 py-2.5 text-white text-[11px] shadow-xl border border-slate-800">
                            <div className="font-bold mb-1.5 text-slate-300">{label}</div>
                            {payload.map((p, i) => (
                              <div key={i} className="flex items-center gap-2 mb-0.5">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                                <span>
                                  {p.name}: <span className="font-bold">{p.value}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      formatter={(value) => <span style={{ color: "#475569", fontWeight: 600 }}>{value}</span>}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Total Bookings"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      dot={<CustomDot fill="#2563EB" />}
                      activeDot={{ r: 6, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={<CustomDot fill="#059669" />}
                      activeDot={{ r: 6, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cancelled"
                      name="Cancelled"
                      stroke="#DC2626"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      dot={<CustomDot fill="#DC2626" />}
                      activeDot={{ r: 5, fill: "#DC2626", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col h-full min-h-[300px]">
              <div className="mb-2 shrink-0">
                <h2 className="m-0 text-sm sm:text-base font-extrabold text-slate-900">Service Mix</h2>
                <p className="mt-0.5 text-xs text-slate-500 m-0">Distribution of customer booking types</p>
              </div>
              <div className="relative flex-1 flex items-center justify-center my-1" style={{ minHeight: 160 }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={serviceMix}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={66}
                      dataKey="value"
                      paddingAngle={3}
                      onMouseEnter={(_, i) => setActiveServiceIdx(i)}
                      onMouseLeave={() => setActiveServiceIdx(null)}
                      animationDuration={500}
                    >
                      {serviceMix.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          stroke="none"
                          opacity={activeServiceIdx === null || activeServiceIdx === i ? 1 : 0.3}
                          style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Services</div>
                  <div className="text-xl font-extrabold text-slate-900">{serviceMix.length}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-100">
                {serviceMix.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onMouseEnter={() => setActiveServiceIdx(i)}
                    onMouseLeave={() => setActiveServiceIdx(null)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                      <span className="text-slate-700 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Queues & Activity Panels (Hierarchy: Overdue -> Today's Schedule -> Complete) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Overdue & Action Needed Panel */}
          <DataCard
            title="Overdue & Action Needed"
            icon={AlertTriangle}
            className="h-full flex flex-col"
            action={
              <select
                value={overdueFilter}
                onChange={(e) => setOverdueFilter(e.target.value)}
                className="h-7 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 border-none rounded-xl px-2.5 text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-rose-400 transition-colors inline-flex items-center"
              >
                <option value="all">All Dates</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            }
          >
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] min-h-[260px] pr-1 custom-scrollbar flex-1">
              {apptOverdue.length === 0 ? (
                <EmptyState
                  title="No overdue appointments"
                  description="Great job! All customer pickups are up to date."
                />
              ) : (
                apptOverdue.map((appt) => (
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} isClickable />
                ))
              )}
            </div>
          </DataCard>

          {/* Today's Schedule Panel */}
          <DataCard
            title="Today's Schedule"
            icon={CalendarDays}
            className="h-full flex flex-col"
          >
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] min-h-[260px] pr-1 custom-scrollbar flex-1">
              {apptToday.length === 0 ? (
                <EmptyState
                  title="No appointments today"
                  description="There are no scheduled pickups or drop-offs for today."
                />
              ) : (
                apptToday.map((appt) => (
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} isClickable />
                ))
              )}
            </div>
          </DataCard>

          {/* Ready for Release Panel */}
          <DataCard
            title="Ready for Release"
            icon={Package}
            className="h-full flex flex-col"
            action={
              <div className="relative w-[20px] min-w-[90px] sm:w-44">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ready orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 w-full pl-7 pr-2.5 text-xs bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all"
                />
              </div>
            }
          >
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] min-h-[260px] pr-1 custom-scrollbar flex-1">
              {filteredAllAppts.length === 0 ? (
                <EmptyState
                  title="No orders ready for release"
                  description="Completed items ready for customer pickup will appear here."
                />
              ) : (
                filteredAllAppts.map((appt) => (
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} isClickable />
                ))
              )}
            </div>
          </DataCard>
        </div>
      </div>
    </div>
  );
}
