import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  Banknote,
  Clock3,
  Download,
  FileText,
  BarChart4Icon,
  Loader2,
  PackageCheck,
  Receipt,
  RefreshCw,
} from "lucide-react";
import api, { bookingApi } from "../../services/bookingApi.js";
import { exportToPDF, exportChartToPDF } from "../../components/Export.js";
import { StatCardsSkeleton, TableSkeleton, SkeletonBlock } from "../../components/SkeletonLoaders.jsx";

const TIME_RANGES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];
const RANGE_LIMITS = {
  Daily: 14,
  Weekly: 12,
  Monthly: 12,
  Quarterly: 8,
  Yearly: 5,
};

const STATUS_COLORS = {
  Paid: "#10B981",
  Pending: "#F59E0B",
  Overdue: "#EF4444",
};

const SERVICE_COLORS = {
  Repair: "#F97316",
  "Team Jersey": "#6366F1",
  Organization: "#14B8A6",
  Service: "#64748B",
};

const fmtCurrency = (value) =>
  "PHP " + Number(value || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 });

const toValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatShortDate = (value) => {
  const date = toValidDate(value);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const calcBookingTotal = (booking) => {
  if (Number.isFinite(booking?.totalPrice)) return Number(booking.totalPrice);

  const pricedItems = Array.isArray(booking?.items) ? booking.items : [];
  if (pricedItems.length > 0) {
    return pricedItems.reduce(
      (sum, item) =>
        sum +
        Number(item?.qty || 0) * Number(item?.unitPrice || 0) +
        Number(item?.addOnPrice || 0) * Number(item?.qty || 0),
      0
    );
  }

  const selectedOptions = Array.isArray(booking?.selectedOptions) ? booking.selectedOptions : [];
  return selectedOptions.reduce(
    (sum, option) => sum + Number(option?.price || 0) * Number(option?.quantity || 1),
    0
  );
};

const normalizeServiceType = (service) => {
  const text = String(service || "").toLowerCase();
  if (text.includes("repair")) return "Repair";
  if (text.includes("jersey")) return "Team Jersey";
  if (text.includes("organization") || text.includes("organizational") || text.includes("custom")) return "Organization";
  return "Service";
};

const getWeekStart = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const getQuarter = (month) => Math.floor(month / 3) + 1;

const getBucketMeta = (date, timeRange) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (timeRange === "Daily") {
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sortValue: new Date(year, month, date.getDate()).getTime(),
    };
  }

  if (timeRange === "Weekly") {
    const start = getWeekStart(date);
    const key = start.toISOString().slice(0, 10);
    return {
      key,
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sortValue: start.getTime(),
    };
  }

  if (timeRange === "Monthly") {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      sortValue: new Date(year, month, 1).getTime(),
    };
  }

  if (timeRange === "Quarterly") {
    const quarter = getQuarter(month);
    return {
      key: `${year}-Q${quarter}`,
      label: `Q${quarter} ${year}`,
      sortValue: new Date(year, (quarter - 1) * 3, 1).getTime(),
    };
  }

  if (timeRange === "Yearly") {
    return {
      key: String(year),
      label: String(year),
      sortValue: new Date(year, 0, 1).getTime(),
    };
  }

  return {
    key: String(year),
    label: String(year),
    sortValue: new Date(year, 0, 1).getTime(),
  };
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-lg">
      <div className="mb-1 font-bold text-slate-700">{label}</div>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>
            {entry.name}: <span className="font-semibold">{fmtCurrency(entry.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AdAnalytics() {
  const [bookings, setBookings] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [timeRange, setTimeRange] = useState("Daily");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeStatusIdx, setActiveStatusIdx] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchReportData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      const [bookingsRes, appointmentsRes] = await Promise.allSettled([
        bookingApi.getAllBookings(),
        api.get("/appointments"),
      ]);

      let nextBookings = [];
      let nextAppointments = [];
      let failedCalls = 0;

      if (bookingsRes.status === "fulfilled") {
        const payload = bookingsRes.value || {};
        nextBookings = Array.isArray(payload.bookings)
          ? payload.bookings
          : Array.isArray(payload.data)
            ? payload.data
            : [];
      } else {
        failedCalls += 1;
      }

      if (appointmentsRes.status === "fulfilled") {
        const payload = appointmentsRes.value?.data || {};
        nextAppointments = Array.isArray(payload.appointments) ? payload.appointments : [];
      } else {
        failedCalls += 1;
      }

      setBookings(nextBookings);
      setAppointments(nextAppointments);

      if (failedCalls === 2) {
        setError("Failed to load report data from backend.");
      } else if (failedCalls > 0) {
        setError("Some backend data failed to load. Showing available data.");
      }
    } catch (err) {
      setError("Failed to load report data from backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData(true);
  }, []);

  const totals = useMemo(() => {
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let paidBookingCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const booking of bookings) {
      const total = calcBookingTotal(booking);
      const statusText = String(booking?.status || "").toLowerCase();
      const isCancelled = statusText === "cancelled";
      if (isCancelled) continue;

      const isPaid = Boolean(booking?.paid) || statusText === "released";
      const referenceDate = toValidDate(booking?.pickupDate || booking?.createdAt);
      const isOverdue = !isPaid && referenceDate && referenceDate < today;

      if (isPaid) {
        paidAmount += total;
        paidBookingCount += 1;
      } else if (isOverdue) {
        overdueAmount += total;
      } else {
        pendingAmount += total;
      }
    }

    const billedAmount = paidAmount + pendingAmount + overdueAmount;

    return {
      paidAmount,
      pendingAmount,
      overdueAmount,
      billedAmount,
      paidInvoiceCount: paidBookingCount,
      totalOrderCount: bookings.length,
    };
  }, [bookings]);

  const chartData = useMemo(() => {
    const buckets = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    bookings.forEach((booking) => {
      const statusText = String(booking?.status || "").toLowerCase();
      if (statusText === "cancelled") return;

      const date = toValidDate(booking?.paidAt || booking?.pickupDate || booking?.updatedAt || booking?.createdAt);
      if (!date) return;

      const total = calcBookingTotal(booking);
      const isPaid = Boolean(booking?.paid) || statusText === "released";
      const referenceDate = toValidDate(booking?.pickupDate || booking?.createdAt);
      const isOverdue = !isPaid && referenceDate && referenceDate < today;
      const meta = getBucketMeta(date, timeRange);
      const existing = buckets.get(meta.key) || {
        label: meta.label,
        sortValue: meta.sortValue,
        billed: 0,
        collected: 0,
        outstanding: 0,
      };

      existing.billed += total;
      if (isPaid) existing.collected += total;
      else existing.outstanding += total;

      buckets.set(meta.key, existing);
    });

    const sorted = Array.from(buckets.values()).sort((a, b) => a.sortValue - b.sortValue);
    return sorted.slice(-RANGE_LIMITS[timeRange]);
  }, [bookings, timeRange]);

  const hasSingleTimelinePoint = chartData.length === 1;

  const invoiceStatusBreakdown = useMemo(() => {
    const rows = [
      { name: "Paid", value: totals.paidAmount, color: STATUS_COLORS.Paid },
      { name: "Pending", value: totals.pendingAmount, color: STATUS_COLORS.Pending },
      { name: "Overdue", value: totals.overdueAmount, color: STATUS_COLORS.Overdue },
    ].filter((row) => row.value > 0);

    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return rows.map((row) => ({
      ...row,
      percent: total > 0 ? Math.round((row.value / total) * 100) : 0,
    }));
  }, [totals.paidAmount, totals.pendingAmount, totals.overdueAmount]);

  const serviceStats = useMemo(() => {
    const stats = {};

    bookings.forEach((booking) => {
      const service = normalizeServiceType(booking?.service || booking?.bookingType || booking?.serviceType);
      if (!stats[service]) {
        stats[service] = {
          name: service,
          orders: 0,
          revenue: 0,
          color: SERVICE_COLORS[service] || SERVICE_COLORS.Service,
        };
      }

      stats[service].orders += 1;

      const statusText = String(booking?.status || "").toLowerCase();
      const isPaid = Boolean(booking?.paid) || statusText === "released";
      if (isPaid) {
        stats[service].revenue += calcBookingTotal(booking);
      }
    });

    const totalOrderCount = Math.max(bookings.length, 1);
    return Object.values(stats)
      .map((row) => ({
        ...row,
        percentage: Math.round((row.orders / totalOrderCount) * 100),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  const recentPaidInvoices = useMemo(() => {
    return bookings
      .filter((booking) => {
        const statusText = String(booking?.status || "").toLowerCase();
        return Boolean(booking?.paid) || statusText === "released";
      })
      .sort((a, b) => {
        const dateA = toValidDate(a?.paidAt || a?.updatedAt || a?.createdAt || a?.pickupDate)?.getTime() || 0;
        const dateB = toValidDate(b?.paidAt || b?.updatedAt || b?.createdAt || b?.pickupDate)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [bookings]);

  const handleExport = () => {
    const exportOrders = bookings.map((booking) => ({
      id: booking?.bookingId || booking?.id || booking?._id || "N/A",
      item: booking?.service || booking?.bookingType || "Service",
      customer: booking?.contact?.fullName || booking?.customerName || "Unknown",
      date: formatShortDate(booking?.createdAt || booking?.date),
      estimatedCompletion: formatShortDate(booking?.pickupDate),
      serviceType: normalizeServiceType(booking?.service || booking?.bookingType || booking?.serviceType),
      status: booking?.status || "Pending",
      invoice: {
        status: booking?.paid ? "Paid" : "Pending",
        items: Array.isArray(booking?.items)
          ? booking.items
          : Array.isArray(booking?.selectedOptions)
            ? booking.selectedOptions.map((option) => ({
              description: option?.name || "Service",
              qty: Number(option?.quantity || 1),
              unitPrice: Number(option?.price || 0),
              addOnPrice: 0,
            }))
            : [],
      },
    }));

    const exportAppointments = appointments.map((appointment) => ({
      id: appointment?._id || appointment?.id || "N/A",
      service: appointment?.service || "Service",
      customer: appointment?.customer || appointment?.fullName || "Unknown",
      tailor: appointment?.assignedTailor || "Unassigned",
      date: appointment?.date || "N/A",
      time: appointment?.time || "N/A",
      status: appointment?.status || "Pending",
    }));

    const exportBreakdown = invoiceStatusBreakdown.map((row) => ({
      name: row.name,
      value: row.percent,
      color: row.color,
    }));

    exportToPDF({
      orders: exportOrders,
      expenseBreakdown: exportBreakdown,
      totalExpenses: totals.billedAmount,
    });
    setShowExportMenu(false);
  };

  const handleExportChart = () => {
    exportChartToPDF({
      chartData,
      totals,
      invoiceStatusBreakdown,
      recentPaidInvoices,
      serviceStats,
      timeRange,
    });
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="font-inter p-3">
        <StatCardsSkeleton count={4} className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4" />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SkeletonBlock className="mb-4 h-4 w-40" />
            <SkeletonBlock className="h-72 w-full bg-slate-100" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SkeletonBlock className="mb-4 h-4 w-36" />
            {[0, 1, 2, 3].map((item) => (
              <SkeletonBlock key={item} className="mb-3 h-14 bg-slate-100" />
            ))}
          </div>
        </div>
        <TableSkeleton rows={5} columns={5} className="mt-3" />
      </div>
    );
  }

  return (
    <div className="font-inter p-3">

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div
          className="bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: "#3B82F6" }} />
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: "#EFF6FF" }}>
                <Banknote size={13} color="#3B82F6" strokeWidth={2.5} className="sm:hidden" />
                <Banknote size={16} color="#3B82F6" strokeWidth={2.2} className="hidden sm:block" />
              </div>
              <span className="text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">Total Revenue</span>
            </div>
          </div>
          <div className="mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] font-black sm:font-extrabold text-gray-900 leading-none tracking-tight pl-[36px] sm:pl-[45px] text-left">
            {fmtCurrency(totals.paidAmount)}
          </div>
          <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[36px] sm:pl-[45px] opacity-80 sm:opacity-100">Paid bookings only</div>
        </div>

        <div
          className="bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: "#F59E0B" }} />
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: "#FFFBEB" }}>
                <Clock3 size={13} color="#F59E0B" strokeWidth={2.5} className="sm:hidden" />
                <Clock3 size={16} color="#F59E0B" strokeWidth={2.2} className="hidden sm:block" />
              </div>
              <span className="text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">Outstanding</span>
            </div>
          </div>
          <div className="mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] font-black sm:font-extrabold text-gray-900 leading-none tracking-tight pl-[36px] sm:pl-[45px] text-left">
            {fmtCurrency(totals.pendingAmount + totals.overdueAmount)}
          </div>
          <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[36px] sm:pl-[45px] opacity-80 sm:opacity-100">Pending + overdue</div>
        </div>

        <div
          className="bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: "#10B981" }} />
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: "#ECFDF5" }}>
                <Receipt size={13} color="#10B981" strokeWidth={2.5} className="sm:hidden" />
                <Receipt size={16} color="#10B981" strokeWidth={2.2} className="hidden sm:block" />
              </div>
              <span className="text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">Paid Bookings</span>
            </div>
          </div>
          <div className="mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] font-black sm:font-extrabold text-gray-900 leading-none tracking-tight pl-[36px] sm:pl-[45px] text-left">
            {totals.paidInvoiceCount}
          </div>
          <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[36px] sm:pl-[45px] opacity-80 sm:opacity-100">Successfully collected</div>
        </div>

        <div
          className="bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: "#6366F1" }} />
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: "#EEF2FF" }}>
                <PackageCheck size={13} color="#6366F1" strokeWidth={2.5} className="sm:hidden" />
                <PackageCheck size={16} color="#6366F1" strokeWidth={2.2} className="hidden sm:block" />
              </div>
              <span className="text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">Total Bookings</span>
            </div>
          </div>
          <div className="mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] font-black sm:font-extrabold text-gray-900 leading-none tracking-tight pl-[36px] sm:pl-[45px] text-left">
            {totals.totalOrderCount}
          </div>
          <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[36px] sm:pl-[45px] opacity-80 sm:opacity-100">Across all services</div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div />
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReportData(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Download size={13} />
              Export PDF
            </button>
            {showExportMenu && (
              <div
                className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                style={{ top: "100%" }}
              >
                <button
                  onClick={handleExport}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <FileText size={14} className="text-slate-500" />
                  Export Table
                </button>
                <div className="mx-3 border-t border-slate-100" />
                <button
                  onClick={handleExportChart}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <BarChart4Icon size={14} className="text-slate-500" />
                  Export Chart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-3 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Financial Timeline</h2>
            <div className="flex flex-wrap gap-1.5">
              {TIME_RANGES.map((option) => (
                <button
                  key={option}
                  onClick={() => setTimeRange(option)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                    timeRange === option
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="outstandingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `P${Math.round(value / 1000)}k`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="billed"
                    name="Billed"
                    stroke="#2563EB"
                    fill="url(#billedGradient)"
                    strokeWidth={2.2}
                    dot={hasSingleTimelinePoint ? { r: 4, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 } : false}
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Collected"
                    stroke="#10B981"
                    fill="url(#collectedGradient)"
                    strokeWidth={2}
                    dot={hasSingleTimelinePoint ? { r: 4, fill: "#10B981", stroke: "#FFFFFF", strokeWidth: 2 } : false}
                  />
                  <Area
                    type="monotone"
                    dataKey="outstanding"
                    name="Outstanding"
                    stroke="#F59E0B"
                    fill="url(#outstandingGradient)"
                    strokeWidth={2}
                    dot={hasSingleTimelinePoint ? { r: 4, fill: "#F59E0B", stroke: "#FFFFFF", strokeWidth: 2 } : false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
                No booking timeline data yet.
              </div>
            )}
          </div>
          {hasSingleTimelinePoint && (
            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Only one data period found for this range ({chartData[0]?.label}). Try switching range to Weekly/Monthly.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 lg:col-span-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Booking Payment Mix</h2>
            <span className="text-[10px] font-bold text-slate-500">{fmtCurrency(totals.billedAmount)} Total</span>
          </div>
          <div className="h-44">
            {invoiceStatusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusBreakdown}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={66}
                    paddingAngle={3}
                    onMouseEnter={(_, idx) => setActiveStatusIdx(idx)}
                    onMouseLeave={() => setActiveStatusIdx(null)}
                  >
                    {invoiceStatusBreakdown.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        opacity={activeStatusIdx === null || activeStatusIdx === idx ? 1 : 0.35}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => fmtCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
                No booking payment data yet.
              </div>
            )}
          </div>
          <div className="mt-2 space-y-1.5">
            {invoiceStatusBreakdown.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="font-semibold text-slate-700">{row.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">{fmtCurrency(row.value)}</div>
                  <div className="text-[10px] text-slate-400">{row.percent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-bold text-slate-900">Revenue by Service</h2>
          {serviceStats.length === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
              No service data available.
            </div>
          ) : (
            <div className="space-y-3">
              {serviceStats.map((row) => (
                <div key={row.name}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{row.name}</span>
                    <span className="font-bold text-slate-900">{fmtCurrency(row.revenue)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${row.percentage}%`, backgroundColor: row.color }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {row.orders} booking{row.orders > 1 ? "s" : ""} ({row.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-bold text-slate-900">Recent Paid Bookings</h2>
          {recentPaidInvoices.length === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
              No paid bookings yet.
            </div>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {recentPaidInvoices.map((booking) => {
                const customer = booking?.contact?.fullName || booking?.customerName || "Unknown";
                const service = normalizeServiceType(booking?.service || booking?.bookingType || booking?.serviceType);
                const bookingDisplayId = booking?.bookingId || booking?._id || "Booking";
                return (
                  <div
                    key={booking?._id || booking?.bookingId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-800">
                        {bookingDisplayId} - {customer}
                      </div>
                      <div className="truncate text-[11px] text-slate-500">
                        {service} - {formatShortDate(booking?.paidAt || booking?.pickupDate || booking?.updatedAt || booking?.createdAt)}
                      </div>
                    </div>
                    <span className="ml-2 text-xs font-black text-emerald-600">{fmtCurrency(calcBookingTotal(booking))}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
