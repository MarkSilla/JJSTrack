import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { CalendarClock, Loader2, CheckCircle2, ShoppingBag, XCircle, Eye, CalendarDays, ChevronDown, User, Scissors, Clock, Filter, Package, AlertTriangle, Archive, } from "lucide-react";
import { bookingApi } from "../../services/bookingApi";
import { inventoryApi } from "../../services/inventoryApi";
import { DashboardSkeleton } from "../../components/SkeletonLoaders.jsx";
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

const BADGE_CLASSES = {
  Confirmed: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  "In-Progress": "bg-violet-100 text-violet-700",
  Complete: "bg-emerald-100 text-emerald-700",
  Released: "bg-cyan-100 text-cyan-700",
  "Cancel/Incomplete": "bg-red-100 text-red-600",
  Overdue: "bg-rose-100 text-rose-700 border border-rose-200",
  Repair: "bg-orange-100 text-orange-700",
  "Team Jersey": "bg-indigo-100 text-indigo-700",
  Organization: "bg-teal-100 text-teal-700",
};

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

function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = FILTER_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 bg-slate-100 hover:bg-slate-200 rounded-lg border-none cursor-pointer transition-colors"
      >
        <Filter size={11} />
        {selected?.label}
        <ChevronDown
          size={11}
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-50 min-w-[175px] py-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-[11px] font-medium transition-colors border-none cursor-pointer ${value === opt.value
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "bg-white text-gray-700 hover:bg-slate-50"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApptCard({ appt, showView = false, onViewOrder, isClickable = false }) {
  const handleCardClick = () => {
    if (!isClickable || !onViewOrder) return;
    onViewOrder(appt.orderId);
  };

  const handleCardKeyDown = (event) => {
    if (!isClickable || !onViewOrder) return;

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
      className={`flex gap-3 border border-slate-100 rounded-xl px-2 py-2 transition-all duration-150 group ${isClickable ? "cursor-pointer hover:bg-blue-50/30 focus:outline-none focus-visible:outline-none" : ""}`}
    >
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        <CalendarDays size={13} className="text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-col-2 gap-4 ">
              <div className="text-[12px] font-bold text-gray-900 truncate">{appt.service}</div>
              <span
                className={`text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${BADGE_CLASSES[appt.status] ?? "bg-gray-100 text-gray-500"
                  }`}
              >
                {appt.status}
              </span>
              {appt.isOverCapacity && (
                <span
                  className="text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap bg-amber-100 text-amber-700 border border-amber-200"
                  title={appt.capacityLabel ? `Capacity: ${appt.capacityLabel} full` : "Over recommended capacity"}
                >
                  Over Capacity
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
              <User size={9} className="shrink-0" /> <span className="truncate">{appt.customer}</span>
              <span className="text-gray-300 mx-0.5 shrink-0">|</span>
              <Scissors size={9} className="shrink-0" /> <span className="truncate">{appt.tailor}</span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock size={9} className="shrink-0" /> {appt.time}
              <span className="text-gray-300 ml-1">{appt.date}</span>
            </div>
            {appt.isOverCapacity && (
              <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-1 font-semibold">
                <AlertTriangle size={9} className="shrink-0" />
                {appt.capacityLabel ? `Capacity: ${appt.capacityLabel} Full` : "Recommended capacity reached"}
              </div>
            )}
          </div>
          <div className="flex text-center items-center justify-center ">
            {showView && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onViewOrder && onViewOrder(appt.orderId);
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-md border-none cursor-pointer transition-colors"
              >
                <Eye size={12} /> View
              </button>
            )}
          </div>
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

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
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

        if (!isMounted) return;

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
        if (isMounted) {
          setAppointments([]);
          setInventory([]);
          setError("Failed to load dashboard data.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const STAT_CARDS = [
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
  ];

  const INVENTORY_STAT_CARDS = [
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
  ];

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
      <div className="font-inter min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="font-inter min-h-screen bg-slate-50">
      <div className="w-full px-2 lg:px-2 py-0">
        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[12px] font-medium text-amber-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, trend, onClick }, index) => (
            <button
              type="button"
              key={label}
              onClick={onClick}
              className={`bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-none text-left w-full focus:outline-none focus-visible:outline-none ${index === 4 ? 'col-span-4 lg:col-span-1' : 'col-span-1 lg:col-span-1'
                }`}
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              <div
                className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
                style={{ background: accent }}
              />
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div
                    className={`rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${index === 4 ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-9 sm:h-9'}`}
                    style={{ background: bgAccent }}
                  >
                    <Icon size={index === 4 ? 14 : 13} color={accent} strokeWidth={2.5} className="sm:hidden" />
                    <Icon size={16} color={accent} strokeWidth={2.2} className="hidden sm:block" />
                  </div>
                  <span className={`text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight ${index === 4 ? 'max-w-none' : 'max-w-none'}`}>{label}</span>
                </div>
                {trend !== null && (
                  <div className="hidden sm:flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-3 py-1 shrink-0 bg-slate-100 text-slate-600">
                    {trend}%
                  </div>
                )}
              </div>
              <div className={`leading-none tracking-tight font-black sm:font-extrabold text-gray-900 ${index === 4 ? 'mt-0 sm:mt-[-14px] text-[16px] sm:text-[22px] pl-[40px] sm:pl-[45px]' : 'mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] pl-[36px] sm:pl-[45px] text-left'
                }`}>
                {value}
              </div>
              <div className={`block text-[9px] text-gray-400 mt-1 sm:mt-0.5 opacity-80 sm:opacity-100 ${index === 4 ? 'pl-[40px] sm:pl-[45px]' : 'pl-[36px] sm:pl-[45px]'}`}>{sub}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
          {INVENTORY_STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, trend, onClick }, index) => (
            <button
              type="button"
              key={label}
              onClick={onClick}
              className={`bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-none text-left w-full focus:outline-none focus-visible:outline-none ${index === 4 ? 'col-span-4 lg:col-span-1' : 'col-span-1 lg:col-span-1'
                }`}
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
                style={{ background: accent }}
              />
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: bgAccent }}
                  >
                    <Icon size={14} color={accent} strokeWidth={2.5} className="sm:hidden" />
                    <Icon size={16} color={accent} strokeWidth={2.2} className="hidden sm:block" />
                  </div>
                  <span className="text-[10px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">{label}</span>
                </div>
                {trend !== null && (
                  <div className="hidden sm:flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-3 py-1 shrink-0 bg-slate-100 text-slate-600">
                    {trend}%
                  </div>
                )}
              </div>
              <div className={`leading-none tracking-tight font-black sm:font-extrabold text-gray-900 mt-1 sm:mt-[-14px] text-[18px] sm:text-[22px] pl-[40px] sm:pl-[45px] text-left`}>
                {value}
              </div>
              <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[40px] sm:pl-[45px] opacity-80 sm:opacity-100">{sub}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col" style={{ minHeight: 290 }}>
              <div className="mb-2 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="m-0 text-[15px] font-extrabold text-gray-900">{bookingVolumeMeta.title}</h2>
                  <p className="mt-0.5 text-[11px] text-gray-400">{bookingVolumeMeta.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 flex-wrap w-fit">
                  {BOOKING_VOLUME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBookingVolumeRange(option.value)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border-none cursor-pointer transition-colors ${bookingVolumeRange === option.value
                        ? "bg-white text-blue-700 shadow-sm"
                        : "bg-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 230 }}>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={bookingVolumeData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-slate-800 rounded-xl px-3.5 py-2.5 text-white text-[11px] shadow-xl border border-slate-700">
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
                      formatter={(value) => <span style={{ color: "#64748b" }}>{value}</span>}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Total"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      dot={<CustomDot fill="#3B82F6" />}
                      activeDot={{ r: 6, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={<CustomDot fill="#10B981" />}
                      activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cancelled"
                      name="Cancelled"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      strokeDasharray="5 3"
                      dot={<CustomDot fill="#EF4444" />}
                      activeDot={{ r: 6, fill: "#EF4444", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col h-full">
              <div className="mb-2 shrink-0">
                <h2 className="m-0 text-[15px] font-extrabold text-gray-900">Services</h2>
              </div>
              <div className="relative" style={{ height: 155 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceMix}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      dataKey="value"
                      paddingAngle={3}
                      onMouseEnter={(_, i) => setActiveServiceIdx(i)}
                      onMouseLeave={() => setActiveServiceIdx(null)}
                      animationDuration={600}
                    >
                      {serviceMix.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          stroke="none"
                          opacity={activeServiceIdx === null || activeServiceIdx === i ? 1 : 0.3}
                          style={{ transition: "opacity 0.25s", cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v + "%"} />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  style={{ height: 155 }}
                >
                  <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Types</div>
                  <div className="text-[20px] font-extrabold text-gray-900">{serviceMix.length}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2 flex-1">
                {serviceMix.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                    onMouseEnter={() => setActiveServiceIdx(i)}
                    onMouseLeave={() => setActiveServiceIdx(null)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                      <span className="text-gray-600">{entry.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {overCapacityRequests.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <div>
                <p className="m-0 text-xs font-black uppercase tracking-wider text-amber-700">Over Capacity</p>
                <p className="mt-0.5 text-xs font-normal text-amber-800">
                  {overCapacityRequests.length} request{overCapacityRequests.length !== 1 ? "s" : ""} pending approval
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-2xl font-black text-amber-600">{overCapacityRequests.length}</span>
              <button
                onClick={() => {
                  navigate('/admin/orders', { state: { filterStatus: 'Over Capacity' } });
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors border-none cursor-pointer"
              >
                View
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-blue-500" />
                  <h2 className="m-0 text-[14px] font-extrabold text-gray-900">Today's Schedule</h2>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {TODAY} - {apptToday.length} appointment{apptToday.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-[9px] font-bold bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5">
                Today
              </span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {apptToday.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-[12px]">No appointments today</div>
              ) : (
                apptToday.map((appt) => (
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} isClickable />
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-red-500" />
                  <h2 className="m-0 text-[14px] font-extrabold text-gray-900">Overdue Dates</h2>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {apptOverdue.length} pending record{apptOverdue.length !== 1 ? "s" : ""}
                </p>
              </div>
              <select
                value={overdueFilter}
                onChange={(e) => setOverdueFilter(e.target.value)}
                className="text-[10px] font-bold bg-slate-100 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-red-400"
              >
                <option value="all">All</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {apptOverdue.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-[12px]">No overdue appointments</div>
              ) : (
                apptOverdue.map((appt) => (
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} isClickable />
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-emerald-500" />
                  <h2 className="m-0 text-[14px] font-extrabold text-gray-900">Complete</h2>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">{filteredAllAppts.length} ready to release</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 sm:w-52 px-2 py-1 text-[10px] bg-slate-100 border-none rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {filteredAllAppts.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-[12px]">No orders ready to release</div>
              ) : (
                filteredAllAppts.map((appt) => (
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} isClickable />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









