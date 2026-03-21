import { useState, useRef, useEffect } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { CalendarClock, Loader2, CheckCircle2, ShoppingBag, XCircle, ArrowUpRight, ArrowDownRight, Eye, CalendarDays, ChevronDown, User, Scissors, Clock, Filter, } from "lucide-react";


const orders = [
  { id: "ORD-2026-001", item: "3-Piece Suit", customer: "Maria Santos", tailor: "Jane Smith", serviceType: "Team Jersey", status: "Complete", dueDate: "Mar 12, 2026", invoice: { status: "Paid", items: [{ unitPrice: 12500, qty: 1, addOnPrice: 500 }] } },
  { id: "ORD-2026-002", item: "Dress Shirt Repair", customer: "James Chen", tailor: "Marco Rossi", serviceType: "Repair", status: "In-Progress", dueDate: "Mar 11, 2026", invoice: { status: "Pending", items: [{ unitPrice: 350, qty: 1, addOnPrice: 0 }] } },
  { id: "ORD-2026-003", item: "Team Jersey Set", customer: "Barangay FC", tailor: "Remy Cruz", serviceType: "Team Jersey", status: "In-Progress", dueDate: "Mar 15, 2026", invoice: { status: "Pending", items: [{ unitPrice: 750, qty: 12, addOnPrice: 600 }] } },
  { id: "ORD-2026-004", item: "Formal Gown", customer: "Sofia Reyes", tailor: "Jane Smith", serviceType: "Organization", status: "Complete", dueDate: "Mar 5, 2026", invoice: { status: "Paid", items: [{ unitPrice: 18000, qty: 1, addOnPrice: 0 }] } },
  { id: "ORD-2026-005", item: "Pants Repair", customer: "Robert Kim", tailor: "Marco Rossi", serviceType: "Repair", status: "Complete", dueDate: "Mar 8, 2026", invoice: { status: "Paid", items: [{ unitPrice: 450, qty: 2, addOnPrice: 0 }] } },
  { id: "ORD-2026-006", item: "Barong Tagalog", customer: "Eduardo Flores", tailor: "Remy Cruz", serviceType: "Team Jersey", status: "Cancel/Incomplete", dueDate: "Mar 7, 2026", invoice: { status: "Unpaid", items: [{ unitPrice: 3500, qty: 1, addOnPrice: 0 }] } },
  { id: "ORD-2026-007", item: "School Uniform Set", customer: "Dela Cruz Family", tailor: "Jane Smith", serviceType: "Organization", status: "In-Progress", dueDate: "Mar 18, 2026", invoice: { status: "Pending", items: [{ unitPrice: 1200, qty: 4, addOnPrice: 200 }] } },
  { id: "ORD-2026-008", item: "Blazer Repair", customer: "Lucia Mendoza", tailor: "Marco Rossi", serviceType: "Repair", status: "Cancel/Incomplete", dueDate: "Mar 6, 2026", invoice: { status: "Unpaid", items: [{ unitPrice: 800, qty: 1, addOnPrice: 0 }] } },
];

const TODAY = "Mar 10, 2026";
const TOMORROW = "Mar 11, 2026";

const appointments = [
  { id: 1, service: "Suit Fitting", date: "Mar 10, 2026", time: "10:00 AM", status: "Confirmed", customer: "Maria Santos", tailor: "Jane Smith", orderId: "ORD-2026-001" },
  { id: 2, service: "Dress Alteration", date: "Mar 10, 2026", time: "1:30 PM", status: "Confirmed", customer: "James Chen", tailor: "Marco Rossi", orderId: "ORD-2026-002" },
  { id: 3, service: "Jersey Measurement", date: "Mar 10, 2026", time: "3:00 PM", status: "Pending", customer: "Barangay FC Rep", tailor: "Remy Cruz", orderId: "ORD-2026-003" },
  { id: 4, service: "Gown Consultation", date: "Mar 11, 2026", time: "11:00 AM", status: "Confirmed", customer: "Sofia Reyes", tailor: "Jane Smith", orderId: "ORD-2026-004" },
  { id: 5, service: "Blazer Check", date: "Mar 11, 2026", time: "2:00 PM", status: "Pending", customer: "Lucia Mendoza", tailor: "Marco Rossi", orderId: "ORD-2026-008" },
  { id: 6, service: "Uniform Fitting", date: "Mar 12, 2026", time: "9:00 AM", status: "Confirmed", customer: "Dela Cruz Family", tailor: "Jane Smith", orderId: "ORD-2026-007" },
  { id: 7, service: "Alteration Pickup", date: "Mar 12, 2026", time: "3:30 PM", status: "Pending", customer: "Robert Kim", tailor: "Marco Rossi", orderId: "ORD-2026-005" },
  { id: 8, service: "Barong Consultation", date: "Mar 13, 2026", time: "10:30 AM", status: "Confirmed", customer: "Eduardo Flores", tailor: "Remy Cruz", orderId: "ORD-2026-006" },
];
// ITO HULA HULA LANG KASI PAG ACCURATE AMPANGIT TIGNAN NUNG GRAPH 
const weeklyOrders = [
  { day: "Mon", orders: 7, completed: 5, cancelled: 0 },
  { day: "Tue", orders: 3, completed: 3, cancelled: 1 },
  { day: "Wed", orders: 5, completed: 3, cancelled: 2 },
  { day: "Thu", orders: 3, completed: 1, cancelled: 2 },
  { day: "Fri", orders: 3, completed: 2, cancelled: 0 },
  { day: "Sat", orders: 6, completed: 4, cancelled: 2 },
  { day: "Sun", orders: 1, completed: 5, cancelled: 1 },
];

const serviceMix = [
  { name: "Repair", value: 50, color: "#EF4444" },
  { name: "Team Jersey", value: 30, color: "#0400ffff" },
  { name: "Organization", value: 20, color: "#F59E0B" },
];

// Helpers 

const calcOrderTotal = (o) =>
  o.totalPrice || o.invoice?.total || o.invoice?.items?.reduce((s, i) => s + i.unitPrice * i.qty + (i.addOnPrice ?? 0), 0) || 0;

const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0 });

function parseTime(t) {
  const [timePart, meridiem] = t.split(" ");
  let [h, m] = timePart.split(":").map(Number);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function parseDate(d) { return new Date(d); }

const todaySchedule = appointments.filter(a => a.date === TODAY && a.status === "Confirmed").length;
const inProgressCount = orders.filter(o => o.status === "In-Progress").length;
const completeCount = orders.filter(o => o.status === "Complete").length;
const totalOrders = orders.length;
const cancelIncomplete = orders.filter(o => o.status === "Cancel/Incomplete").length;
const upcomingOrders = orders.filter(o => o.status === "In-Progress" || o.status === "Cancel/Incomplete");
const apptToday = appointments.filter(a => a.date === TODAY).sort((a, b) => parseTime(a.time) - parseTime(b.time));
const apptTomorrow = appointments.filter(a => a.date === TOMORROW).sort((a, b) => parseTime(a.time) - parseTime(b.time));

const BADGE_CLASSES = {
  "Confirmed": "bg-blue-100 text-blue-700",
  "Pending": "bg-amber-100 text-amber-700",
  "In-Progress": "bg-violet-100 text-violet-700",
  "Complete": "bg-emerald-100 text-emerald-700",
  "Cancel/Incomplete": "bg-red-100 text-red-600",
  "Paid": "bg-green-100 text-green-700",
  "Unpaid": "bg-red-100 text-red-600",
  "Repair": "bg-orange-100 text-orange-700",
  "Team Jersey": "bg-indigo-100 text-indigo-700",
  "Organization": "bg-teal-100 text-teal-700",
};

const FILTER_OPTIONS = [
  { label: "Today", value: "time" },
  { label: "By Date", value: "date" },
  { label: "In-Progress", value: "In-Progress" },
  { label: "Complete", value: "Complete" },
  { label: "Pending", value: "Pending" },
];

const STAT_CARDS = [
  { icon: CalendarClock, label: "Today's Schedule", value: todaySchedule, sub: "Confirmed appts.", accent: "#3B82F6", bgAccent: "#EFF6FF", trend: 0 },
  { icon: Loader2, label: "In-Progress", value: inProgressCount, sub: "Active orders", accent: "#7C3AED", bgAccent: "#F5F3FF", trend: null },
  { icon: CheckCircle2, label: "Complete", value: completeCount, sub: "Finished orders", accent: "#059669", bgAccent: "#ECFDF5", trend: 8 },
  { icon: ShoppingBag, label: "Total Orders", value: totalOrders, sub: "All records", accent: "#0891B2", bgAccent: "#ECFEFF", trend: 5 },
  { icon: XCircle, label: "Cancel / Incomplete", value: cancelIncomplete, sub: "Needs attention", accent: "#EF4444", bgAccent: "#FEF2F2", trend: -5 },
];

const CustomDot = ({ cx, cy, fill }) => (
  <circle cx={cx} cy={cy} fill={fill} stroke="#fff" strokeWidth={2} />
);

function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = FILTER_OPTIONS.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 bg-slate-100 hover:bg-slate-200 rounded-lg border-none cursor-pointer transition-colors"
      >
        <Filter size={11} />
        {selected?.label}
        <ChevronDown size={11} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-50 min-w-[175px] py-1">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-[11px] font-medium transition-colors border-none cursor-pointer
                ${value === opt.value ? "bg-blue-50 text-blue-700 font-semibold" : "bg-white text-gray-700 hover:bg-slate-50"}`}
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
    <div className="flex  gap-3 border border-slate-100 rounded-xl px-2 py-2 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150 group">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        <CalendarDays size={13} className="text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className=" flex flex-col-2 gap-4 ">
              <div className="text-[12px] font-bold text-gray-900 truncate">{appt.service}</div>
              <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${BADGE_CLASSES[appt.status] ?? "bg-gray-100 text-gray-500"}`}>
                {appt.status}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
              <User size={9} className="shrink-0" /> <span className="truncate">{appt.customer}</span>
              <span className="text-gray-300 mx-0.5 shrink-0">·</span>
              <Scissors size={9} className="shrink-0" /> <span className="truncate">{appt.tailor}</span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock size={9} className="shrink-0" /> {appt.time}
              {appt.date !== TODAY && appt.date !== TOMORROW && (
                <span className="text-gray-300 ml-1">{appt.date}</span>
              )}
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
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeServiceIdx, setActiveServiceIdx] = useState(null);
  const [apptFilter, setApptFilter] = useState("time");

  const handleViewOrder = (orderId) => {
    if (onNavigateToOrders) {
      onNavigateToOrders(orderId);
    } else {
      alert(`Navigate to Order: ${orderId}`);
    }
  };

  const filteredAllAppts = (() => {
    const all = [...appointments];
    switch (apptFilter) {
      case "time":
        return all.sort((a, b) => {
          const priority = (d) => d === TODAY ? 0 : d === TOMORROW ? 1 : 2;
          const pd = priority(a.date) - priority(b.date);
          return pd !== 0 ? pd : parseTime(a.time) - parseTime(b.time);
        });
      case "date":
        return all.sort((a, b) => parseDate(a.date) - parseDate(b.date) || parseTime(a.time) - parseTime(b.time));
      case "In-Progress":
        return all.filter(a => a.status === "Confirmed").sort((a, b) => parseDate(a.date) - parseDate(b.date));
      case "Complete":
        return all.filter(a => a.status === "Confirmed").sort((a, b) => parseDate(a.date) - parseDate(b.date));
      case "Pending":
        return all.filter(a => a.status === "Pending").sort((a, b) => parseDate(a.date) - parseDate(b.date));
      default:
        return all;
    }
  })();

  return (
    <div className="font-inter min-h-screen bg-slate-50">
      <div className="px-2 py-2 lg:px-0 py-0 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, trend }) => (
            <div
              key={label}
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
                {trend !== null ? (
                  <div className={`flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-3 py-1 shrink-0 ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {Math.abs(trend)}%
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 text-[10px] font-bold rounded-lg px-1.5 py-0.5 bg-violet-50 text-violet-600">Live</div>
                )}
              </div>
              <div className=" mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
            </div>
          ))}
        </div>
        {/* weekly   */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col" style={{ minHeight: 290 }}>
              <div className="mb-2 shrink-0">
                <h2 className="m-0 text-[15px] font-extrabold text-gray-900">Weekly Volume Order</h2>
                <p className="mt-0.5 text-[11px] text-gray-400">Orders placed, completed &amp; cancelled this week</p>
              </div>
              <div style={{ flex: 1, minHeight: 230 }}>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={weeklyOrders} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
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
                                <span>{p.name}: <span className="font-bold">{p.value}</span></span>
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
                      type="monotone" dataKey="orders" name="Total"
                      stroke="#3B82F6" strokeWidth={2.5}
                      dot={<CustomDot fill="#3B82F6" />}
                      activeDot={{ r: 6, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone" dataKey="completed" name="Completed"
                      stroke="#10B981" strokeWidth={2.5}
                      dot={<CustomDot fill="#10B981" />}
                      activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone" dataKey="cancelled" name="Cancelled"
                      stroke="#EF4444" strokeWidth={2.5} strokeDasharray="5 3"
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
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={68}
                      dataKey="value" paddingAngle={3}
                      onMouseEnter={(_, i) => setActiveServiceIdx(i)}
                      onMouseLeave={() => setActiveServiceIdx(null)}
                      animationDuration={600}
                    >
                      {serviceMix.map((entry, i) => (
                        <Cell
                          key={i} fill={entry.color} stroke="none"
                          opacity={activeServiceIdx === null || activeServiceIdx === i ? 1 : 0.3}
                          style={{ transition: "opacity 0.25s", cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v + "%"} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: 155 }}>
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

        {/* Appointments Row*/}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-blue-500" />
                  <h2 className="m-0 text-[14px] font-extrabold text-gray-900">Today's Schedule</h2>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {TODAY} · {apptToday.length} appointment{apptToday.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-[9px] font-bold bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5">Today</span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {apptToday.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-[12px]">No appointments today</div>
              ) : (
                apptToday.map(appt => (
                  <ApptCard key={appt.id} appt={appt} showView onViewOrder={handleViewOrder} />
                ))
              )}
            </div>
          </div>

          {/* Tomorrow */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-violet-500" />
                  <h2 className="m-0 text-[14px] font-extrabold text-gray-900">Tomorrow</h2>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {TOMORROW} · {apptTomorrow.length} appointment{apptTomorrow.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-[9px] font-bold bg-violet-100 text-violet-700 rounded-full px-2.5 py-0.5">Upcoming</span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {apptTomorrow.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-[12px]">No appointments tomorrow</div>
              ) : (
                apptTomorrow.map(appt => (
                  <ApptCard key={appt.id} appt={appt} showView={false} />
                ))
              )}
            </div>
          </div>

          {/*All Appointments*/}
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
                filteredAllAppts.map(appt => (
                  <ApptCard key={appt.id} appt={appt} showView={false} />
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}