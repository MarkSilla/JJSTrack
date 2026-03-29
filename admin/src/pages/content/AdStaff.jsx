import { useState, useMemo, useEffect } from "react";
import { Search, Plus, ChevronDown, MoreHorizontal, Eye, Pencil, UserX, Hash, CheckCircle2, XCircle, AlertCircle, } from "lucide-react";
import StatCard from "./Staff/StatCard";
import AddEmployeeModal from "./Staff/AddEmployeeModal";
import ProfilePanel from "./Staff/ProfilePanel";

// Mock Data
const MOCK_EMPLOYEES = [
    { id: "EMP-001", name: "Jane Smith", email: "jane.s@jjs.com", contact: "+63 912 345 6789", type: "Full Time", position: "Tailor", status: "Active", hired: "2022-03-15", dob: "1990-07-22", gender: "Female", address: "123 Gordon Heights, Olongapo City", role: "Employee", lastLogin: "2026-03-10 09:14", created: "2022-03-15", avatar: "JS", color: "#2563EB", orders: 142, productivity: 94, tasks: ["Suit tailoring", "Gown fitting", "Fabric cutting"], emergencyContact: { name: "John Smith", relationship: "Spouse", contact: "+63 912 000 0001" } },
    { id: "EMP-002", name: "Marco Rossi", email: "marco.r@jjs.com", contact: "+63 917 234 5678", type: "Part Time", position: "Tailor", status: "Active", hired: "2023-01-08", dob: "1988-11-04", gender: "Male", address: "456 Gordon Heights, Olongapo City", role: "Employee", lastLogin: "2026-03-10 08:52", created: "2023-01-08", avatar: "MR", color: "#0891B2", orders: 98, productivity: 87, tasks: ["Shirt repairs", "Pants repair"], emergencyContact: { name: "Anna Rossi", relationship: "Sister", contact: "+63 917 000 0002" } },
    { id: "EMP-003", name: "Remy Cruz", email: "remy.c@jjs.com", contact: "+63 918 876 5432", type: "Full Time", position: "Tailor", status: "Active", hired: "2023-06-20", dob: "1993-04-15", gender: "Male", address: "789 Gordon Heights, Olongapo City", role: "Employee", lastLogin: "2026-03-09 17:30", created: "2023-06-20", avatar: "RC", color: "#7C3AED", orders: 76, productivity: 82, tasks: ["Jersey printing", "Team uniforms"], emergencyContact: { name: "Elena Cruz", relationship: "Mother", contact: "+63 918 000 0003" } },
    { id: "EMP-004", name: "Lina Torres", email: "lina.t@jjs.com", contact: "+63 919 765 4321", type: "Full Time", position: "Presser", status: "Active", hired: "2023-09-01", dob: "1995-02-28", gender: "Female", address: "321 Gordon Heights, Olongapo City", role: "Employee", lastLogin: "2026-03-10 07:45", created: "2023-09-01", avatar: "LT", color: "#059669", orders: 0, productivity: 91, tasks: ["Customer intake", "Order processing", "Scheduling"], emergencyContact: { name: "Mark Torres", relationship: "Husband", contact: "+63 919 000 0004" } },
    { id: "EMP-005", name: "Ben Aquino", email: "ben.a@jjs.com", contact: "+63 920 654 3210", type: "Part Time", position: "Presser", status: "Active", hired: "2024-02-14", dob: "1998-09-10", gender: "Male", address: "654 Gordon Heights, Olongapo City", role: "Employee", lastLogin: "2026-03-08 16:22", created: "2024-02-14", avatar: "BA", color: "#D97706", orders: 34, productivity: 78, tasks: ["Fabric cutting", "Basic repairs"], emergencyContact: { name: "Sarah Aquino", relationship: "Mother", contact: "+63 920 000 0005" } },
    { id: "EMP-006", name: "Sofia Villanueva", email: "sofia.v@jjs.com", contact: "+63 921 543 2109", type: "Full Time", position: "Layout Artist", status: "Active", hired: "2022-11-03", dob: "1991-06-18", gender: "Female", address: "987 Gordon Heights, Olongapo City", role: "Manager", lastLogin: "2026-03-10 10:01", created: "2022-11-03", avatar: "SV", color: "#BE185D", orders: 58, productivity: 96, tasks: ["Jersey layout", "Design proofing", "Client mockups"], emergencyContact: { name: "Jose Villanueva", relationship: "Father", contact: "+63 921 000 0006" } },
    { id: "EMP-007", name: "Carlos Mendez", email: "carlos.m@jjs.com", contact: "+63 922 432 1098", type: "Contractual", position: "Presser", status: "Inactive", hired: "2023-04-17", dob: "1987-12-05", gender: "Male", address: "147 Gordon Heights, Olongapo City", role: "Employee", lastLogin: "2026-02-28 14:10", created: "2023-04-17", avatar: "CM", color: "#64748B", orders: 61, productivity: 72, tasks: ["Screen printing", "Heat transfer"], emergencyContact: { name: "Maria Mendez", relationship: "Wife", contact: "+63 922 000 0007" } },
    { id: "EMP-008", name: "Rita Guzman", email: "rita.g@jjs.com", contact: "+63 923 321 0987", type: "Full Time", position: "Bookkeeper", status: "Active", hired: "2021-08-09", dob: "1985-03-14", gender: "Female", address: "258 Gordon Heights, Olongapo City", role: "Manager", lastLogin: "2026-03-10 11:30", created: "2021-08-09", avatar: "RG", color: "#1D4ED8", orders: 0, productivity: 99, tasks: ["Staff management", "Quality control", "Reporting"], emergencyContact: { name: "Luis Guzman", relationship: "Brother", contact: "+63 923 000 0008" } },
    { id: "EMP-009", name: "Danny Pascual", email: "danny.p@jjs.com", contact: "+63 924 210 9876", type: "Contractual", position: "Repair Technician", status: "Suspended", hired: "2023-07-22", dob: "1992-08-30", gender: "Male", address: "369 Aurora Blvd, Cubao", role: "Employee", lastLogin: "2026-01-15 09:00", created: "2023-07-22", avatar: "DP", color: "#64748B", orders: 22, productivity: 55, tasks: ["Zipper repair", "Stitching fixes"], emergencyContact: { name: "Nina Pascual", relationship: "Sister", contact: "+63 924 000 0009" } },
    { id: "EMP-010", name: "Grace Lim", email: "grace.lim@jjs.com", contact: "+63 925 109 8765", type: "Full Time", position: "Bookkeeper", status: "Active", hired: "2022-05-30", dob: "1994-01-07", gender: "Female", address: "741 Ortigas Ave, Pasig", role: "Employee", lastLogin: "2026-03-09 15:45", created: "2022-05-30", avatar: "GL", color: "#0F766E", orders: 0, productivity: 88, tasks: ["Invoice processing", "Payroll tracking"], emergencyContact: { name: "Robert Lim", relationship: "Father", contact: "+63 925 000 0010" } },
];

const EMP_TYPES = ["All Types", "Full Time", "Part Time", "Contractual"];
const STATUSES = ["All Status", "Active", "Inactive", "Suspended"];
const SORT_OPTS = ["Newest", "Oldest", "Name A–Z"];
const POSITIONS = ["Tailor", "Layout Artist", "Bookkeeper", "Presser", "Repair Technician"];

// Helpers
const STATUS_CONFIG = {
    Active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
    Inactive: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", border: "border-slate-200" },
    Suspended: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
};

const TYPE_CONFIG = {
    "Full Time": { bg: "bg-blue-50", text: "text-blue-700" },
    "Part Time": { bg: "bg-cyan-50", text: "text-cyan-700" },
    "Contractual": { bg: "bg-orange-50", text: "text-orange-700" },
};

const genPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const genId = () => "EMP-" + String(Math.floor(Math.random() * 900) + 100);

const Avatar = ({ initials, color, size = 36 }) => (
    <div style={{ width: size, height: size, background: color + "18", border: `1.5px solid ${color}30`, borderRadius: size * 0.3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color, fontSize: size * 0.33, fontWeight: 700, letterSpacing: "0.02em" }}>{initials}</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.Inactive;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {status}
        </span>
    );
};

const TypeBadge = ({ type }) => {
    const c = TYPE_CONFIG[type] ?? { bg: "bg-slate-100", text: "text-slate-600" };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${c.bg} ${c.text}`}>
            {type}
        </span>
    );
};

const Dropdown = ({ label, options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer w-full"
            >
                <span className="flex-1 text-left">{value}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-[60] py-1 min-w-[140px]">
                    {options.map(opt => (
                        <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-left px-3.5 py-2.5 text-[12px] transition-colors border-none cursor-pointer
                                ${value === opt ? "bg-blue-50 text-blue-700 font-semibold" : "bg-white text-slate-700 hover:bg-slate-50"}`}>
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const RowMenu = ({ emp, onView, onDeactivate }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 bg-transparent border-none cursor-pointer transition-colors">
                <MoreHorizontal size={15} className="text-slate-400" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-[70] py-1 min-w-[170px]" onClick={e => e.stopPropagation()}>
                    {[
                        { icon: Eye, label: "View Profile", action: () => { onView(emp); setOpen(false); }, cls: "text-slate-700" },
                        { icon: Pencil, label: "Edit Employee", action: () => { window.dispatchEvent(new CustomEvent('edit-staff', { detail: emp })); setOpen(false); }, cls: "text-slate-700" },
                        { icon: UserX, label: "Deactivate", action: () => { onDeactivate(emp.id); setOpen(false); }, cls: "text-red-600" },
                    ].map(item => (
                        <button key={item.label} onClick={item.action}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium hover:bg-slate-50 bg-transparent border-none cursor-pointer text-left ${item.cls}`}>
                            <item.icon size={13} /> {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const UsersIcon = ({ size, className, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const EmployeeCard = ({ emp, onView, onDeactivate }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div
            className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 cursor-pointer active:bg-slate-50 transition-colors"
            onClick={() => onView(emp)}
        >
            <div className="flex items-center gap-3">
                <Avatar initials={emp.avatar} color={emp.color} size={42} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[14px] font-bold text-slate-900 leading-tight truncate">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <Hash size={9} />{emp.id}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                            <StatusBadge status={emp.status} />
                            <RowMenu emp={emp} onView={() => onView(emp)} onDeactivate={() => onDeactivate(emp.id)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <TypeBadge type={emp.type} />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{emp.position}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{emp.contact}</div>
                </div>
            </div>
        </div>
    );
};

const AdStaff = () => {
    const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [sortBy, setSortBy] = useState("Newest");
    const [showModal, setShowModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState(null);
    const [selected, setSelected] = useState(null);

    //  edit
    useEffect(() => {
        const handleEdit = (e) => {
            setEditingEmp(e.detail);
            setShowModal(true);
        };
        window.addEventListener('edit-staff', handleEdit);
        return () => window.removeEventListener('edit-staff', handleEdit);
    }, []);

    const filtered = useMemo(() => {
        let list = [...employees];
        if (search) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));
        if (typeFilter !== "All Types") list = list.filter(e => e.type === typeFilter);
        if (statusFilter !== "All Status") list = list.filter(e => e.status === statusFilter);
        if (sortBy === "Newest") list.sort((a, b) => new Date(b.hired) - new Date(a.hired));
        if (sortBy === "Oldest") list.sort((a, b) => new Date(a.hired) - new Date(b.hired));
        if (sortBy === "Name A–Z") list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [employees, search, typeFilter, statusFilter, sortBy]);

    const stats = useMemo(() => ([
        { label: "Total Employees", value: employees.length, icon: UsersIcon, color: "#2563EB", sub: `${employees.filter(e => e.status === "Active").length} currently active` },
        { label: "Active", value: employees.filter(e => e.status === "Active").length, icon: CheckCircle2, color: "#059669" },
        { label: "Inactive", value: employees.filter(e => e.status === "Inactive").length, icon: AlertCircle, color: "#64748B" },
        { label: "Suspended", value: employees.filter(e => e.status === "Suspended").length, icon: XCircle, color: "#DC2626" },
    ]), [employees]);

    const deactivate = (id) => setEmployees(p => p.map(e => e.id === id ? { ...e, status: "Inactive" } : e));
    const activeFiltersCount = [typeFilter !== "All Types", statusFilter !== "All Status", sortBy !== "Newest"].filter(Boolean).length;

    return (
        <div className="font-inter min-h-screen overflow-x-hidden">
            <div className="px-3 sm:px-6 lg:px-4 py-2">
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">Staff Management</h1>
                        <p className="text-[11px] sm:text-[13px] text-slate-500 mt-0.5">Manage employee accounts, roles, and system access.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl border-none cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
                    >
                        <Plus size={15} />
                        <span className="hidden xs:inline sm:inline">Add Employee</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {stats.map((s, i) => (
                        <StatCard key={i} {...s} />
                    ))}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4 shadow-sm relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name or ID…"
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex items-center gap-2 w-full lg:w-auto">
                            <div className="w-full sm:w-[130px]">
                                <Dropdown label="Type" options={EMP_TYPES} value={typeFilter} onChange={setTypeFilter} />
                            </div>
                            <div className="w-full sm:w-[130px]">
                                <Dropdown label="Status" options={STATUSES} value={statusFilter} onChange={setStatusFilter} />
                            </div>
                            <div className="w-full sm:w-[130px]">
                                <Dropdown label="Sort" options={SORT_OPTS} value={sortBy} onChange={setSortBy} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:hidden space-y-3">
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                <Search size={22} className="text-slate-200" />
                            </div>
                            <span className="text-[13px] font-medium">No team members found.</span>
                        </div>
                    ) : (
                        filtered.map(emp => (
                            <EmployeeCard
                                key={emp.id}
                                emp={emp}
                                onView={setSelected}
                                onDeactivate={deactivate}
                            />
                        ))
                    )}
                    {filtered.length > 0 && (
                        <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest py-2">
                            Showing {filtered.length} of {employees.length} staff
                        </div>
                    )}
                </div>
                <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm relative z-0 pb-16">
                    <div className="overflow-visible min-w-full">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    {["Employee", "Contact Info", "Role", "Account Status", "Hired Date", "Actions"].map(h => (
                                        <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <Search size={24} className="text-slate-200" />
                                                </div>
                                                <span className="text-[13px] font-medium">No team members matched your criteria.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map((emp) => (
                                    <tr key={emp.id} className="group border-b border-slate-50 hover:bg-slate-50/80 transition-all cursor-pointer" onClick={() => setSelected(emp)}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar initials={emp.avatar} color={emp.color} size={34} />
                                                <div className="min-w-0">
                                                    <div className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{emp.name}</div>
                                                    <div className="text-[10px] text-slate-400 mono mt-0.5 flex items-center gap-1">
                                                        <Hash size={9} />{emp.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[12px] font-medium text-slate-700 truncate max-w-[180px]">{emp.email}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{emp.contact}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <TypeBadge type={emp.type} />
                                            <div className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{emp.position}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge status={emp.status} />
                                        </td>
                                        <td className="px-5 py-4 text-[12px] font-semibold text-slate-500 whitespace-nowrap">{emp.hired}</td>
                                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setSelected(emp)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                                                    <Eye size={13} />
                                                </button>
                                                <RowMenu emp={emp} onView={() => setSelected(emp)} onDeactivate={() => deactivate(emp.id)} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {filtered.length} of {employees.length} Staff</span>
                            <div className="flex gap-1">
                                <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-[12px] font-bold border-none shadow-sm">1</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showModal && <AddEmployeeModal initialData={editingEmp} onClose={() => { setShowModal(false); setEditingEmp(null); }} onAdd={(emp) => {
                if (editingEmp) {
                    setEmployees(p => p.map(e => e.id === emp.id ? emp : e));
                } else {
                    setEmployees(p => [emp, ...p]);
                }
            }} />}
            {selected && <ProfilePanel emp={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};

export default AdStaff;