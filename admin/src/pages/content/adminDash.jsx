import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { CalendarClock, Loader2, CheckCircle2, ShoppingBag, XCircle, Eye, CalendarDays, ChevronDown, User, Scissors, Clock, Filter, Package, AlertTriangle, Archive, } from "lucide-react";
import { bookingApi } from "../../services/bookingApi";
import { inventoryApi } from "../../services/inventoryApi";

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

const normalizeAppointmentStatus = (status) => {
  const text = String(status || "").toLowerCase();
  if (text.includes("cancel")) return "Cancel/Incomplete";
  if (text.includes("released") || text.includes("complete")) return "Complete";
  if (text.includes("progress")) return "In-Progress";
  if (text.includes("approved") || text.includes("confirm")) return "Confirmed";
  return "Pending";
};

function parseTime(value) {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return 0;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3];

  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

function parseDate(d) {
  return parseDateValue(d) || new Date(0);
}

const formatCurrency = (value) =>
  `PHP ${Number(value || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

const BADGE_CLASSES = {
  Confirmed: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  "In-Progress": "bg-violet-100 text-violet-700",
  Complete: "bg-emerald-100 text-emerald-700",
  "Cancel/Incomplete": "bg-red-100 text-red-600",
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
              className={`w-full text-left px-3.5 py-2 text-[11px] font-medium transition-colors border-none cursor-pointer ${
                value === opt.value
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

function ApptCard({ appt, showView = false, onViewOrder }) {
  return (
    <div className="flex gap-3 border border-slate-100 rounded-xl px-2 py-2 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150 group">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        <CalendarDays size={13} className="text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-col-2 gap-4 ">
              <div className="text-[12px] font-bold text-gray-900 truncate">{appt.service}</div>
              <span
                className={`text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${
                  BADGE_CLASSES[appt.status] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {appt.status}
              </span>
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
          </div>
          <div className="flex text-center items-center justify-center ">
            {showView && (
              <button
                onClick={() => onViewOrder && onViewOrder(appt.orderId)}
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
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

            return {
              id: booking._id,
              service: booking.service || normalizeServiceLabel(booking.bookingType),
              date: formatDateLabel(dateObj),
              dateObj,
              time: booking.pickupSlot || "No Time",
              status: normalizeAppointmentStatus(booking.status),
              customer: booking.contact?.fullName || "Unknown Customer",
              tailor: booking.assignedTailor || "Unassigned",
              orderId: linkedOrderId,
              bookingType: booking.bookingType,
              createdAtValue: parseDateValue(booking.createdAt),
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

  const apptToday = useMemo(
    () =>
      appointments
        .filter((a) => isSameDay(a.dateObj, todayDate))
        .sort((a, b) => parseTime(a.time) - parseTime(b.time)),
    [appointments, todayDate]
  );

  const apptTomorrow = useMemo(
    () =>
      appointments
        .filter((a) => isSameDay(a.dateObj, tomorrowDate))
        .sort((a, b) => parseTime(a.time) - parseTime(b.time)),
    [appointments, tomorrowDate]
  );

  const filteredAllAppts = useMemo(() => {
    const all = [...appointments];

    switch (apptFilter) {
      case "time":
        return all.sort((a, b) => {
          const priority = (d) => {
            if (isSameDay(d, todayDate)) return 0;
            if (isSameDay(d, tomorrowDate)) return 1;
            return 2;
          };

          const pd = priority(a.dateObj) - priority(b.dateObj);
          if (pd !== 0) return pd;

          const dateDelta = parseDate(a.dateObj) - parseDate(b.dateObj);
          if (dateDelta !== 0) return dateDelta;

          return parseTime(a.time) - parseTime(b.time);
        });
      case "date":
        return all.sort(
          (a, b) =>
            parseDate(a.dateObj) - parseDate(b.dateObj) ||
            parseTime(a.time) - parseTime(b.time)
        );
      case "In-Progress":
        return all
          .filter((a) => a.status === "In-Progress")
          .sort((a, b) => parseDate(a.dateObj) - parseDate(b.dateObj));
      case "Complete":
        return all
          .filter((a) => a.status === "Complete")
          .sort((a, b) => parseDate(a.dateObj) - parseDate(b.dateObj));
      case "Pending":
        return all
          .filter((a) => a.status === "Pending")
          .sort((a, b) => parseDate(a.dateObj) - parseDate(b.dateObj));
      default:
        return all;
    }
  }, [appointments, apptFilter, todayDate, tomorrowDate]);

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
      return item.stock > 0 && item.stock < minStock;
    }).length;
    const outOfStock = activeItems.filter((item) => item.stock === 0).length;
    const totalValue = activeItems.reduce(
      (sum, item) => sum + item.stock * item.unitPrice,
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

  const weeklyOrders = useMemo(() => {
    const monday = new Date(todayDate);
    const day = monday.getDay();
    const diffToMonday = (day + 6) % 7;
    monday.setDate(monday.getDate() - diffToMonday);

    const week = Array.from({ length: 7 }, (_, i) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      return {
        date: current,
        day: current.toLocaleDateString("en-US", { weekday: "short" }),
        orders: 0,
        completed: 0,
        cancelled: 0,
      };
    });

    appointments.forEach((appointment) => {
      const dateValue = appointment.dateObj || appointment.createdAtValue;
      if (!dateValue) return;

      const normalizedDate = new Date(dateValue);
      normalizedDate.setHours(0, 0, 0, 0);

      const idx = Math.floor((normalizedDate - monday) / (1000 * 60 * 60 * 24));
      if (idx < 0 || idx > 6) return;

      week[idx].orders += 1;
      if (appointment.status === "Complete") week[idx].completed += 1;
      if (appointment.status === "Cancel/Incomplete") week[idx].cancelled += 1;
    });

    return week.map(({ day: dayLabel, orders: total, completed, cancelled }) => ({
      day: dayLabel,
      orders: total,
      completed,
      cancelled,
    }));
  }, [appointments, todayDate]);

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
    },
    {
      icon: Loader2,
      label: "In-Progress",
      value: inProgressCount,
      sub: "Active bookings",
      accent: "#7C3AED",
      bgAccent: "#F5F3FF",
      trend: null,
    },
    {
      icon: CheckCircle2,
      label: "Complete",
      value: completeCount,
      sub: "Completed bookings",
      accent: "#059669",
      bgAccent: "#ECFDF5",
      trend: null,
    },
    {
      icon: ShoppingBag,
      label: "Total Orders",
      value: totalOrders,
      sub: "All bookings",
      accent: "#0891B2",
      bgAccent: "#ECFEFF",
      trend: null,
    },
    {
      icon: XCircle,
      label: "Cancel / Incomplete",
      value: cancelIncomplete,
      sub: "Needs attention",
      accent: "#EF4444",
      bgAccent: "#FEF2F2",
      trend: null,
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
    },
    {
      icon: AlertTriangle,
      label: "Low Stock",
      value: inventoryStats.lowStock,
      sub: "Below min stock",
      accent: "#F59E0B",
      bgAccent: "#FFFBEB",
      trend: null,
    },
    {
      icon: XCircle,
      label: "Out of Stock",
      value: inventoryStats.outOfStock,
      sub: "Needs restock",
      accent: "#DC2626",
      bgAccent: "#FEF2F2",
      trend: null,
    },
    {
      icon: Archive,
      label: "Archived",
      value: inventoryStats.archivedCount,
      sub: "Archived items",
      accent: "#4F46E5",
      bgAccent: "#EEF2FF",
      trend: null,
    },
    {
      icon: ShoppingBag,
      label: "Inventory Value",
      value: formatCurrency(inventoryStats.totalValue),
      sub: "Current stock value",
      accent: "#0F766E",
      bgAccent: "#F0FDFA",
      trend: null,
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

  if (loading) {
    return (
      <div className="font-inter min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <Loader2 size={18} className="animate-spin" /> Loading dashboard...
        </div>
      </div>
    );
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

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, trend }) => (
            <div
              key={label}
              className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
                style={{ background: accent }}
              />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: bgAccent }}
                  >
                    <Icon size={16} color={accent} strokeWidth={2.2} />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-500">{label}</span>
                </div>
                {trend !== null ? (
                  <div className="flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-3 py-1 shrink-0 bg-slate-100 text-slate-600">
                    {trend}%
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-1.5 py-0.5 bg-violet-50 text-violet-600">
                    Live
                  </div>
                )}
              </div>
              <div className="mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">
                {value}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {INVENTORY_STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, trend }) => (
            <div
              key={label}
              className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
                style={{ background: accent }}
              />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: bgAccent }}
                  >
                    <Icon size={16} color={accent} strokeWidth={2.2} />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-500">{label}</span>
                </div>
                {trend !== null ? (
                  <div className="flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-3 py-1 shrink-0 bg-slate-100 text-slate-600">
                    {trend}%
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-1.5 py-0.5 bg-emerald-50 text-emerald-600">
                    Live
                  </div>
                )}
              </div>
              <div className="mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">
                {value}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col" style={{ minHeight: 290 }}>
              <div className="mb-2 shrink-0">
                <h2 className="m-0 text-[15px] font-extrabold text-gray-900">Weekly Booking Volume</h2>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Bookings scheduled, completed &amp; cancelled this week
                </p>
              </div>
              <div style={{ flex: 1, minHeight: 230 }}>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={weeklyOrders} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="day"
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
                <h2 className="m-0 text-[15px] font-extrabold text-gray-900">Service Mix</h2>
                <p className="mt-0.5 text-[11px] text-gray-400">By service type</p>
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
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} />
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-violet-500" />
                  <h2 className="m-0 text-[14px] font-extrabold text-gray-900">Tomorrow</h2>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {TOMORROW} - {apptTomorrow.length} appointment{apptTomorrow.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-[9px] font-bold bg-violet-100 text-violet-700 rounded-full px-2.5 py-0.5">
                Upcoming
              </span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {apptTomorrow.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-[12px]">No appointments tomorrow</div>
              ) : (
                apptTomorrow.map((appt) => <ApptCard key={appt.id} appt={appt} showView={false} />)
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-emerald-500" />
                  <h2 className="m-0 text-[14px] font-extrabold text-gray-900">All Appointments</h2>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">{appointments.length} total records</p>
              </div>
              <FilterDropdown value={apptFilter} onChange={setApptFilter} />
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {filteredAllAppts.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-[12px]">No appointments found</div>
              ) : (
                filteredAllAppts.map((appt) => <ApptCard key={appt.id} appt={appt} showView={false} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

