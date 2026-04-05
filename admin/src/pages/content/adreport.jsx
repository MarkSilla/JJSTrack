import { useState, useMemo } from "react";
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    TrendingUp, TrendingDown, Banknote,
    Download, ArrowUpRight, ArrowDownRight,
    PackageCheck, Receipt, Circle, Activity, Briefcase
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const orders = [
    { id: "ORD-2026-001", item: "3-Piece Suit", customer: "Maria Santos", serviceType: "Team Jersey", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 12500, qty: 1, addOnPrice: 500 }] }, date: "Mar 10" },
    { id: "ORD-2026-002", item: "Dress Shirt Repair", customer: "James Chen", serviceType: "Repair", status: "In-Progress", invoice: { status: "Pending", items: [{ unitPrice: 350, qty: 1, addOnPrice: 0 }] }, date: "Mar 11" },
    { id: "ORD-2026-003", item: "Team Jersey Set", customer: "Barangay FC", serviceType: "Team Jersey", status: "In-Progress", invoice: { status: "Pending", items: [{ unitPrice: 750, qty: 12, addOnPrice: 600 }] }, date: "Mar 12" },
    { id: "ORD-2026-004", item: "Formal Gown", customer: "Sofia Reyes", serviceType: "Organization", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 18000, qty: 1, addOnPrice: 0 }] }, date: "Mar 14" },
    { id: "ORD-2026-005", item: "Pants Repair", customer: "Robert Kim", serviceType: "Repair", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 450, qty: 2, addOnPrice: 0 }] }, date: "Mar 15" },
    { id: "ORD-2026-006", item: "Barong Tagalog", customer: "Eduardo Flores", serviceType: "Team Jersey", status: "Cancel/Incomplete", invoice: { status: "Unpaid", items: [{ unitPrice: 3500, qty: 1, addOnPrice: 0 }] }, date: "Mar 15" },
    { id: "ORD-2026-007", item: "School Uniform Set", customer: "Dela Cruz Family", serviceType: "Organization", status: "Complete", invoice: { status: "Paid", items: [{ unitPrice: 1200, qty: 4, addOnPrice: 200 }] }, date: "Mar 18" },
    { id: "ORD-2026-008", item: "Blazer Repair", customer: "Lucia Mendoza", serviceType: "Repair", status: "Cancel/Incomplete", invoice: { status: "Unpaid", items: [{ unitPrice: 800, qty: 1, addOnPrice: 0 }] }, date: "Mar 20" },
];

const expenseBreakdown = [
    { name: "Materials", value: 38, color: "#3B82F6", amount: 6992 },
    { name: "Salaries", value: 32, color: "#8B5CF6", amount: 5888 },
    { name: "Utilities", value: 15, color: "#F59E0B", amount: 2760 },
    { name: "Rent", value: 10, color: "#10B981", amount: 1840 },
    { name: "Misc", value: 5, color: "#EF4444", amount: 920 },
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

// Helpers 
const calcOrderTotal = (o) =>
    o.totalPrice || o.invoice?.total || o.invoice?.items?.reduce((s, i) => s + i.unitPrice * i.qty + (i.addOnPrice ?? 0), 0) || 0;

const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0 });

// Compute primary Data
const revenue = orders.filter(o => o.invoice.status === "Paid").reduce((s, o) => s + calcOrderTotal(o), 0);
const TOTAL_EXPENSES = expenseBreakdown.reduce((s, e) => s + e.amount, 0);
const netProfit = revenue - TOTAL_EXPENSES;
const totalOrders = orders.length;

const revExpData = [
    { name: "Revenue", value: revenue, color: "#2563EB" },
    { name: "Expenses", value: TOTAL_EXPENSES, color: "#EF4444" },
    { name: "Net Profit", value: Math.max(netProfit, 0), color: "#10B981" },
];

const FINANCE_CARDS = [
    { icon: Banknote, label: "Total Revenue", value: fmt(revenue), sub: "Paid invoices only", accent: "#2563EB", bgAccent: "#EFF6FF", trend: 15 },
    { icon: TrendingDown, label: "Total Expenses", value: fmt(TOTAL_EXPENSES), sub: "Operational costs", accent: "#EF4444", bgAccent: "#FEF2F2", trend: -8 },
    { icon: TrendingUp, label: "Net Profit", value: fmt(netProfit), sub: "Revenue – Expenses", accent: "#10B981", bgAccent: "#ECFDF5", trend: netProfit >= 0 ? 12 : -5 },
    { icon: PackageCheck, label: "Total Orders", value: totalOrders.toString(), sub: "Across all services", accent: "#8B5CF6", bgAccent: "#F5F3FF", trend: 5 },
];

// Chart Tooltip definition
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 rounded-xl px-3.5 py-2.5 text-white text-[11px] shadow-xl border border-slate-700 select-none">
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
    const [timeRange, setTimeRange] = useState("Monthly");

    const getChartData = () => {
        switch (timeRange) {
            case "Daily": return dailyFinancials;
            case "Weekly": return weeklyFinancials;
            case "Yearly": return yearlyFinancials;
            default: return monthlyFinancials;
        }
    };

    // Calculate informative breakdown
    const serviceStats = useMemo(() => {
        const stats = {
            "Repair": { revenue: 0, orders: 0, color: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-100" },
            "Team Jersey": { revenue: 0, orders: 0, color: "bg-indigo-500", text: "text-indigo-700", bgLight: "bg-indigo-100" },
            "Organization": { revenue: 0, orders: 0, color: "bg-teal-500", text: "text-teal-700", bgLight: "bg-teal-100" }
        };

        orders.forEach(o => {
            if (stats[o.serviceType]) {
                stats[o.serviceType].orders += 1;
                if (o.invoice.status === "Paid") {
                    stats[o.serviceType].revenue += calcOrderTotal(o);
                }
            }
        });

        const totalOrderCount = orders.length;

        return Object.entries(stats)
            .map(([name, data]) => ({ name, percentage: Math.round((data.orders / totalOrderCount) * 100) || 0, ...data }))
            .sort((a, b) => b.revenue - a.revenue);
    }, []);

    const recentPaid = useMemo(() => {
        return orders
            .filter(o => o.invoice.status === "Paid")
            .sort((a, b) => b.id.localeCompare(a.id))
            .slice(0, 5);
    }, []);

    return (
        <div className="font-[inter] min-h-screen bg-slate-50">
            <div className="lg:px-2 py-4">
                
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex flex-col items-start ">
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Financial Reports</h1>
                            <p className="text-slate-500 text-[12px]">Complete overview of business finances and order volumes</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl border-none cursor-pointer transition-colors shadow-sm">
                        <Download size={14} /> Export PDF
                    </button>
                </div>

                {/* Primary KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                    {FINANCE_CARDS.map(({ icon: Icon, label, value, sub, accent, bgAccent, trend }) => (
                        <div
                            key={label}
                            className="bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100"
                        >
                            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.05] group-hover:opacity-[0.10] transition-opacity duration-500" style={{ background: accent }} />
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110" style={{ background: bgAccent }}>
                                        <Icon size={18} color={accent} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-[13px] font-semibold text-slate-500">{label}</span>
                                </div>
                                <div className={`flex items-center gap-0.5 text-[11px] font-bold rounded-lg px-2 py-0.5 shrink-0 ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                    {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(trend)}%
                                </div>
                            </div>
                            <div className="text-2xl lg:text-3xl font-black text-slate-900 leading-none tracking-tight">{value}</div>
                            <div className="text-[11px] text-slate-400 mt-2 font-medium">{sub}</div>
                        </div>
                    ))}
                </div>

                {/* Financial Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
                    {/* Revenue/Expense Timeline */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col h-[450px]">
                            <div className="mb-4 shrink-0 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="m-0 text-[15px] font-bold text-slate-900 border-l-4 border-blue-500 pl-2">Revenue &amp; Expense Breakdown</h2>
                                    <p className="mt-1 text-[11px] text-slate-400 pl-3">Timeline view of total revenue compared against operational expenses</p>
                                </div>
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="px-3 py-2 text-[12px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shrink-0"
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>

                            <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;} .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
                            <div className="hide-scrollbar overflow-x-auto lg:overflow-x-visible flex-1">
                                <div className="h-full min-w-[700px] lg:min-w-0">
                                    <ResponsiveContainer width="100%" height="100%">
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                            <XAxis dataKey={timeRange === "Daily" ? "day" : timeRange === "Weekly" ? "week" : timeRange === "Yearly" ? "year" : "month"} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                                            <YAxis tickFormatter={v => "₱" + (v / 1000) + "k"} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={15} />
                                            <RechartsTooltip content={<ChartTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 15 }} formatter={(v) => <span className="text-slate-600">{v}</span>} />
                                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" strokeWidth={3} fill="url(#gRev)" dot={false} activeDot={{ r: 5, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }} />
                                            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 3" fill="url(#gExp)" dot={false} activeDot={{ r: 5, fill: "#EF4444", stroke: "#fff", strokeWidth: 2 }} />
                                            <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={3} fill="url(#gPro)" dot={false} activeDot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Source Breakdown  */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col h-[450px]">
                            <div className="mb-4 shrink-0 flex items-center justify-between">
                                <h2 className="m-0 text-[15px] font-bold text-slate-900 border-l-4 border-amber-500 pl-2">Expense Origination</h2>
                                <p className="mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold">{fmt(TOTAL_EXPENSES)} Total</p>
                            </div>
                            
                            <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={revExpData}
                                            cx="50%" cy="50%"
                                            innerRadius={65} outerRadius={85}
                                            dataKey="value" paddingAngle={5}
                                            onMouseEnter={(_, i) => setActiveRevIdx(i)}
                                            onMouseLeave={() => setActiveRevIdx(null)}
                                            animationDuration={800}
                                            stroke="none"
                                        >
                                            {revExpData.map((e, i) => (
                                                <Cell key={i} fill={e.color} stroke="none"
                                                    opacity={activeRevIdx === null || activeRevIdx === i ? 1 : 0.3}
                                                    style={{ transition: "all 0.3s ease", cursor: "pointer", filter: activeRevIdx === i ? "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))" : "none" }}
                                                />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "bold" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Value</div>
                                    <div className={`text-lg font-black ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(netProfit)}</div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1 shrink-0 mt-4">
                                {expenseBreakdown.map((e, i) => (
                                    <div key={i}
                                        className="flex items-center justify-between text-[11px] py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        onMouseEnter={() => setActiveExpIdx(i)} onMouseLeave={() => setActiveExpIdx(null)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-sm" style={{ background: e.color }} />
                                            <span className="text-slate-600 font-medium">{e.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-400 font-medium">{fmt(e.amount)}</span>
                                            <span className="font-bold text-slate-800 w-8 text-right bg-slate-100 px-1 py-0.5 rounded">{e.value}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations & Informative Metrics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    
                    {/* Revenue by Service Type */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
                        <div className="flex items-center justify-between mb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Activity size={18} />
                                </div>
                                <div>
                                    <h2 className="m-0 text-[15px] font-bold text-slate-900">Revenue by Service</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Which services bring in the most income / volume</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4 flex-1 justify-center">
                            {serviceStats.map((stat, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                                            <span className="font-bold text-slate-700">{stat.name}</span>
                                        </div>
                                        <span className="font-black text-slate-900">{fmt(stat.revenue)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${stat.color} transition-all duration-1000`} 
                                            style={{ width: `${stat.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                                        <span>Contribution: {stat.percentage}%</span>
                                        <span className={`px-2 py-0.5 rounded-md font-bold ${stat.bgLight} ${stat.text}`}>
                                            {stat.orders} Orders processed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Paid Invoices */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
                         <div className="flex items-center justify-between mb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Receipt size={18} />
                                </div>
                                <div>
                                    <h2 className="m-0 text-[15px] font-bold text-slate-900">Recent Paid Invoices</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Latest successful cash flow completions</p>
                                </div>
                            </div>
                            <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                View All
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                            {recentPaid.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                                    No recent paid invoices.
                                </div>
                            ) : (
                                recentPaid.map((order) => {
                                    const total = calcOrderTotal(order);
                                    return (
                                        <div key={order.id} className="flex items-center justify-between border border-slate-100 bg-slate-50/50 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300">
                                                    <Briefcase size={16} className="text-slate-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[13px] font-bold text-slate-900 truncate">{order.customer}</div>
                                                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                                        {order.id} • {order.item}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 ml-3">
                                                <span className="text-[14px] font-black text-slate-900">{fmt(total)}</span>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">Paid • {order.date}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}