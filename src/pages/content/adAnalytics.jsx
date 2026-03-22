import { useState } from "react";
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    TrendingUp, TrendingDown, DollarSign, Banknote,
    Users, Download, BarChart2, ArrowUpRight, ArrowDownRight,
    CheckSquare, Square, CheckCircle2, Package,
    Wifi, Zap, Droplets, Phone, ShieldCheck, Trash2, Plus, Eye,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const orders = [
    { id: "ORD-2026-001", item: "3-Piece Suit", customer: "Maria Santos", serviceType: "Team Jersey", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 12500, qty: 1, addOnPrice: 500 }] } },
    { id: "ORD-2026-002", item: "Dress Shirt Repair", customer: "James Chen", serviceType: "Repair", status: "In-Progress", invoice: { status: "Pending", items: [{ unitPrice: 350, qty: 1, addOnPrice: 0 }] } },
    { id: "ORD-2026-003", item: "Team Jersey Set", customer: "Barangay FC", serviceType: "Team Jersey", status: "In-Progress", invoice: { status: "Pending", items: [{ unitPrice: 750, qty: 12, addOnPrice: 600 }] } },
    { id: "ORD-2026-004", item: "Formal Gown", customer: "Sofia Reyes", serviceType: "Organization", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 18000, qty: 1, addOnPrice: 0 }] } },
    { id: "ORD-2026-005", item: "Pants Repair", customer: "Robert Kim", serviceType: "Repair", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 450, qty: 2, addOnPrice: 0 }] } },
    { id: "ORD-2026-006", item: "Barong Tagalog", customer: "Eduardo Flores", serviceType: "Team Jersey", status: "Cancel/Incomplete", invoice: { status: "Unpaid", items: [{ unitPrice: 3500, qty: 1, addOnPrice: 0 }] } },
    { id: "ORD-2026-007", item: "School Uniform Set", customer: "Dela Cruz Family", serviceType: "Organization", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 1200, qty: 4, addOnPrice: 200 }] } },
    { id: "ORD-2026-008", item: "Blazer Repair", customer: "Lucia Mendoza", serviceType: "Repair", status: "Cancel/Incomplete", invoice: { status: "Unpaid", items: [{ unitPrice: 800, qty: 1, addOnPrice: 0 }] } },
];

const expenseBreakdown = [
    { name: "Materials", value: 38, color: "#3B82F6", amount: 6992 },
    { name: "Salaries", value: 32, color: "#8B5CF6", amount: 5888 },
    { name: "Utilities", value: 15, color: "#F59E0B", amount: 2760 },
    { name: "Rent", value: 10, color: "#10B981", amount: 1840 },
    { name: "Misc", value: 5, color: "#EF4444", amount: 920 },
];

const staffList = [
    { id: 1, name: "Jane Smith", role: "Senior Tailor", salary: 22000 },
    { id: 2, name: "Marco Rossi", role: "Tailor", salary: 18500 },
    { id: 3, name: "Remy Cruz", role: "Tailor", salary: 18500 },
    { id: 4, name: "Lina Torres", role: "Sales Associate", salary: 14000 },
    { id: 5, name: "Ben Aquino", role: "Cutter/Apprentice", salary: 12000 },
];

const monthlyFinancials = [
    { month: "Jan", revenue: 28000, expenses: 14000, profit: 14000 },
    { month: "Feb", revenue: 33000, expenses: 15500, profit: 17500 },
    { month: "Mar", revenue: 29500, expenses: 13200, profit: 16300 },
    { month: "Apr", revenue: 41000, expenses: 17800, profit: 23200 },
    { month: "May", revenue: 38500, expenses: 16400, profit: 22100 },
    { month: "Jun", revenue: 45000, expenses: 19200, profit: 25800 },
    { month: "Jul", revenue: 42000, expenses: 18000, profit: 24000 },
    { month: "Aug", revenue: 51000, expenses: 21500, profit: 29500 },
    { month: "Sep", revenue: 47500, expenses: 20100, profit: 27400 },
    { month: "Oct", revenue: 55000, expenses: 22800, profit: 32200 },
    { month: "Nov", revenue: 52000, expenses: 21000, profit: 31000 },
    { month: "Dec", revenue: 61000, expenses: 24500, profit: 36500 },
];

const dailyFinancials = [
    { day: "Mar 1", revenue: 1800, expenses: 900, profit: 900 },
    { day: "Mar 2", revenue: 2100, expenses: 1050, profit: 1050 },
    { day: "Mar 3", revenue: 1900, expenses: 950, profit: 950 },
    { day: "Mar 4", revenue: 2200, expenses: 1100, profit: 1100 },
    { day: "Mar 5", revenue: 2400, expenses: 1200, profit: 1200 },
    { day: "Mar 6", revenue: 2600, expenses: 1300, profit: 1300 },
    { day: "Mar 7", revenue: 2000, expenses: 1000, profit: 1000 },
];

const weeklyFinancials = [
    { week: "Week 1", revenue: 14900, expenses: 7450, profit: 7450 },
    { week: "Week 2", revenue: 16500, expenses: 8250, profit: 8250 },
    { week: "Week 3", revenue: 15800, expenses: 7900, profit: 7900 },
    { week: "Week 4", revenue: 19400, expenses: 9700, profit: 9700 },
    { week: "Week 5", revenue: 17200, expenses: 8600, profit: 8600 },
];

const yearlyFinancials = [
    { year: "2023", revenue: 420000, expenses: 210000, profit: 210000 },
    { year: "2024", revenue: 520000, expenses: 260000, profit: 260000 },
    { year: "2025", revenue: 580000, expenses: 290000, profit: 290000 },
];
 
const INITIAL_BILLS = [
    { id: 1, name: "Internet", icon: "wifi", amount: 1899, paid: true, dueDate: "Mar 15" },
    { id: 2, name: "Electricity", icon: "zap", amount: 4200, paid: false, dueDate: "Mar 18" },
    { id: 3, name: "Water Bill", icon: "droplet", amount: 850, paid: true, dueDate: "Mar 12" },
    { id: 4, name: "Phone / Landline", icon: "phone", amount: 999, paid: false, dueDate: "Mar 20" },
    { id: 5, name: "SSS Contribution", icon: "shield", amount: 2400, paid: true, dueDate: "Mar 10" },
    { id: 6, name: "Rent", icon: "package", amount: 12000, paid: false, dueDate: "Mar 1" },
];

const inventoryItems = [
    { id: "INV-001", name: "Sewing Needles (Pack)", quantity: 45, unitPrice: 150 },
    { id: "INV-002", name: "Cotton Thread (White)", quantity: 120, unitPrice: 55 },
    { id: "INV-003", name: "Cotton Thread (Black)", quantity: 85, unitPrice: 55 },
    { id: "INV-004", name: "Tailor's Chalk", quantity: 30, unitPrice: 25 },
    { id: "INV-005", name: "Measuring Tape", quantity: 15, unitPrice: 85 },
    { id: "INV-006", name: "Fabric Scissors", quantity: 8, unitPrice: 1250 },
    { id: "INV-007", name: "Pins (Box)", quantity: 25, unitPrice: 90 },
    { id: "INV-008", name: "Zippers (Assorted)", quantity: 200, unitPrice: 15 },
];

// Helpers 

const calcOrderTotal = (o) =>
    o.totalPrice || o.invoice?.total || o.invoice?.items?.reduce((s, i) => s + i.unitPrice * i.qty + (i.addOnPrice ?? 0), 0) || 0;

const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0 });
const todayStr = () => new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

const totalSale = orders.reduce((s, o) => s + calcOrderTotal(o), 0);
const revenue = orders.filter(o => o.invoice.status === "Paid").reduce((s, o) => s + calcOrderTotal(o), 0);
const TOTAL_EXPENSES = expenseBreakdown.reduce((s, e) => s + e.amount, 0);
const netProfit = revenue - TOTAL_EXPENSES;
const totalSalary = staffList.reduce((s, st) => s + st.salary, 0);
const successfulOrders = orders.filter(o => o.status === "Complete");
const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

const revExpData = [
    { name: "Revenue", value: revenue, color: "#2563EB" },
    { name: "Expenses", value: TOTAL_EXPENSES, color: "#EF4444" },
    { name: "Net Profit", value: Math.max(netProfit, 0), color: "#10B981" },
];


const FINANCE_CARDS = [
    { icon: DollarSign, label: "Total Sale", value: fmt(totalSale), sub: "All invoices", accent: "#3B82F6", bgAccent: "#EFF6FF", trend: 20 },
    { icon: TrendingDown, label: "Expenses", value: fmt(TOTAL_EXPENSES), sub: "Operational cost", accent: "#EF4444", bgAccent: "#FEF2F2", trend: -8 },
    { icon: Banknote, label: "Revenue", value: fmt(revenue), sub: "Paid invoices", accent: "#059669", bgAccent: "#ECFDF5", trend: 15 },
    { icon: TrendingUp, label: "Net Profit", value: fmt(netProfit), sub: "Revenue – Expenses", accent: "#F59E0B", bgAccent: "#FFFBEB", trend: netProfit >= 0 ? 10 : -10 },
];

const SERVICE_TYPE_COLORS = {
    "Repair": "bg-orange-100 text-orange-700",
    "Team Jersey": "bg-indigo-100 text-indigo-700",
    "Organization": "bg-teal-100 text-teal-700",
};

const BillIcon = ({ type, size = 13 }) => {
    const cls = `shrink-0`;
    if (type === "wifi") return <Wifi size={size} className={cls} />;
    if (type === "zap") return <Zap size={size} className={cls} />;
    if (type === "droplet") return <Droplets size={size} className={cls} />;
    if (type === "phone") return <Phone size={size} className={cls} />;
    if (type === "shield") return <ShieldCheck size={size} className={cls} />;
    return <Package size={size} className={cls} />;
};

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 rounded-xl px-3.5 py-2.5 text-white text-[11px] shadow-xl border border-slate-700">
            <div className="font-bold mb-1.5 text-slate-300">{label}</div>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <span>{p.name}: <span className="font-bold">{fmt(p.value)}</span></span>
                </div>
            ))}
        </div>
    );
};


export default function AdAnalytics() {
    const [activeRevIdx, setActiveRevIdx] = useState(null);
    const [activeExpIdx, setActiveExpIdx] = useState(null);
    const [bills, setBills] = useState(INITIAL_BILLS);
    const [newBillName, setNewBillName] = useState("");
    const [newBillAmt, setNewBillAmt] = useState("");
    const [addingBill, setAddingBill] = useState(false);
    const [timeRange, setTimeRange] = useState("Monthly");

    const getChartData = () => {
        switch (timeRange) {
            case "Daily":
                return dailyFinancials;
            case "Weekly":
                return weeklyFinancials;
            case "Yearly":
                return yearlyFinancials;
            default:
                return monthlyFinancials;
        }
    };

    const toggleBill = (id) => setBills(p => p.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
    const removeBill = (id) => setBills(p => p.filter(b => b.id !== id));
    const addBill = () => {
        if (!newBillName.trim()) return;
        setBills(p => [...p, { id: Date.now(), name: newBillName.trim(), icon: "zap", amount: parseFloat(newBillAmt) || 0, paid: false, dueDate: "—" }]);
        setNewBillName(""); setNewBillAmt(""); setAddingBill(false);
    };

    const paidCount = bills.filter(b => b.paid).length;
    const unpaidCount = bills.filter(b => !b.paid).length;
    const totalBillsAmt = bills.reduce((s, b) => s + b.amount, 0);
    const paidBillsAmt = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
    const progressPct = bills.length > 0 ? Math.round((paidCount / bills.length) * 100) : 0;

    return (
        <div className="font-[inter] min-h-screen bg-slate-50">
            <div className=" lg:px-2 py-2">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="flex flex-col items-start ">
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Analytics &amp; Reports</h1>
                            <p className="text-slate-500 text-[12px]">Monthly summary and stats</p>
                        </div>

                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl border-none cursor-pointer transition-colors shadow-sm">
                        <Download size={14} /> Export PDF
                    </button>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                    {FINANCE_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, trend }) => (
                        <div
                            key={label}
                            className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                        >
                            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: accent }} />
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: bgAccent }}>
                                        <Icon size={18} color={accent} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-[13px] font-semibold text-gray-500">{label}</span>
                                </div>
                                <div className={`flex items-center gap-0.5 text-[11px] font-bold rounded-lg px-2 py-0.5 shrink-0 ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                    {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(trend)}%
                                </div>
                            </div>
                            <div className="mt-[-14px] text-[22px] font-bold text-gray-900 leading-none tracking-tight pl-[45px]">{value}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 pl-[50px]">{sub}</div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col" style={{ minHeight: 450 }}>
                            <div className="mb-3 shrink-0 flex items-end justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="m-0 text-[15px] font-bold text-gray-900">Revenue &amp; Expense Breakdown</h2>
                                    <p className="mt-0.5 text-[11px] text-gray-400">Monthly revenue, expenses &amp; net profit overview</p>
                                </div>
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="px-3 py-2 text-[12px] font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer transition-colors focus:outline-none focus:border-blue-500 shrink-0"
                                    style={{ minWidth: "95px" }}
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>

                            <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;} .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
                            <div className="hide-scrollbar overflow-x-auto lg:overflow-x-visible" style={{ flex: 1, minHeight: 450, WebkitOverflowScrolling: "touch" }}>
                                <div style={{ minWidth: timeRange === "Yearly" ? "auto" : "820px" }}>
                                    <ResponsiveContainer width="100%" height={450}>
                                        <AreaChart data={getChartData()} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.03} />
                                                </linearGradient>
                                                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.20} />
                                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                                                </linearGradient>
                                                <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.22} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey={timeRange === "Daily" ? "day" : timeRange === "Weekly" ? "week" : timeRange === "Yearly" ? "year" : "month"} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={v => "₱" + (v / 1000) + "k"} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Legend
                                                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                                formatter={(v) => <span style={{ color: "#64748b" }}>{v}</span>}
                                            />
                                            <Area type="monotone" dataKey="revenue" name="Revenue"
                                                stroke="#2563EB" strokeWidth={2.5} fill="url(#gRev)"
                                                dot={false} activeDot={{ r: 5, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
                                            />
                                            <Area type="monotone" dataKey="expenses" name="Expenses"
                                                stroke="#EF4444" strokeWidth={2.5} strokeDasharray="5 3" fill="url(#gExp)"
                                                dot={false} activeDot={{ r: 5, fill: "#EF4444", stroke: "#fff", strokeWidth: 2 }}
                                            />
                                            <Area type="monotone" dataKey="profit" name="Net Profit"
                                                stroke="#10B981" strokeWidth={2.5} fill="url(#gPro)"
                                                dot={false} activeDot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/*Expense Breakdown */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col h-full">
                            <div className="mb-2 shrink-0">
                                <h2 className="m-0 text-[14px] font-bold text-gray-900">Expense Breakdown</h2>
                                <p className="mt-0.5 text-[10px] text-gray-400">{fmt(TOTAL_EXPENSES)} total expenses</p>
                            </div>
                            <div className="relative" style={{ height: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={revExpData}
                                            cx="50%" cy="50%"
                                            innerRadius={44} outerRadius={60}
                                            dataKey="value" paddingAngle={4}
                                            onMouseEnter={(_, i) => setActiveRevIdx(i)}
                                            onMouseLeave={() => setActiveRevIdx(null)}
                                            animationDuration={600}
                                        >
                                            {revExpData.map((e, i) => (
                                                <Cell key={i} fill={e.color} stroke="none"
                                                    opacity={activeRevIdx === null || activeRevIdx === i ? 1 : 0.28}
                                                    style={{ transition: "opacity 0.25s", cursor: "pointer" }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => fmt(v)} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: 250 }}>
                                    <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Net</div>
                                    <div className={`text-[14px] font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(netProfit)}</div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-1 mb-3">
                                {revExpData.map((e, i) => (
                                    <div key={i}
                                        className="flex items-center justify-between text-[10px] py-0.5 px-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                                        onMouseEnter={() => setActiveRevIdx(i)} onMouseLeave={() => setActiveRevIdx(null)}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                                            <span className="text-gray-600">{e.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{fmt(e.value)}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Expense category */}
                            <div className="border-t border-slate-100 pt-2 flex flex-col gap-1">
                                {expenseBreakdown.map((e, i) => (
                                    <div key={i}
                                        className="flex items-center justify-between text-[10px] py-0.5 px-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                                        onMouseEnter={() => setActiveExpIdx(i)} onMouseLeave={() => setActiveExpIdx(null)}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                                            <span className="text-gray-500">{e.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-gray-400">{fmt(e.amount)}</span>
                                            <span className="font-bold text-gray-700 w-6 text-right">{e.value}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-3 shrink-0">
                            <Users size={14} className="text-blue-600" />
                            <div>
                                <h2 className="m-0 text-[14px] font-bold text-gray-900">Staff &amp; Salary</h2>
                                <p className="text-[10px] text-gray-400">{staffList.length} team members</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            {staffList.map((s) => (
                                <div key={s.id} className="group flex items-center justify-between bg-slate-100/50 border border-slate-200 rounded-xl px-3.5 py-2.5 hover:bg-blue-50 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[11px] font-bold shrink-0">
                                            {s.name.split(" ").map(n => n[0]).join("")}
                                        </div>
                                        <div>
                                            <div className="text-[12px] font-bold text-gray-900">{s.name}</div>
                                            <div className="text-[10px] text-gray-400">{s.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <span className="text-[12px] font-bold text-gray-800">{fmt(s.salary)}</span>
                                        <button
                                            onClick={() => window.location.href = `/staff/${s.id}`}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 rounded-lg border-none cursor-pointer flex items-center justify-center"
                                            title="View Staff Details"
                                        >
                                            <Eye size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between bg-slate-200 rounded-xl px-3.5 py-2.5">
                            <span className="text-[11px] font-bold text-gray-800">Total Monthly Salary</span>
                            <span className="text-[14px] font-bold text-gray-800">{fmt(totalSalary)}</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <Package size={14} className="text-amber-600" />
                                <div>
                                    <h2 className="m-0 text-[14px] font-bold text-gray-900">Inventory Status</h2>
                                    <p className="text-[10px] text-gray-400">{inventoryItems.length} items logged</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full px-2.5 py-1">
                                Stock Count
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ maxHeight: 300 }}>
                            {inventoryItems.map((item) => {
                                const total = item.quantity * item.unitPrice;
                                return (
                                    <div key={item.id} className="flex items-center justify-between border border-slate-200 bg-slate-100/50 rounded-xl px-3.5 py-3 hover:bg-amber-50 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                                <Package size={13} className="text-amber-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[12px] font-bold text-gray-900 truncate">{item.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">Stock: {item.quantity} <span>· {fmt(item.unitPrice)}/ea</span></div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 ml-2">
                                            <span className="text-[13px] font-bold text-gray-900">{fmt(total)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-5 flex items-center justify-between bg-slate-200 rounded-xl px-3.5 py-3">
                            <span className="text-[11px] font-bold text-gray-800">Total Inventory Value</span>
                            <span className="text-[14px] font-bold text-gray-800">{fmt(totalInventoryValue)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}