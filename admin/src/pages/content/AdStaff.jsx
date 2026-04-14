import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Plus, ChevronDown, MoreHorizontal, Eye, Pencil, UserX, Hash, CheckCircle2, XCircle, AlertCircle, } from "lucide-react";
import StatCard from "./Staff/StatCard";
import AddEmployeeModal from "./Staff/AddEmployeeModal";
import ProfilePanel from "./Staff/ProfilePanel";
import { staffApi } from "../../services/staffApi";
import { bookingApi } from "../../services/bookingApi";

const EMP_TYPES = ["All Types", "Full Time", "Part Time", "Contractual"];
const STATUSES = ["All Status", "Active", "Inactive", "Suspended"];
const SORT_OPTS = ["Newest", "Oldest", "Name A-Z"];

const COLOR_PALETTE = ["#2563EB", "#0891B2", "#7C3AED", "#059669", "#D97706", "#BE185D", "#1D4ED8", "#0F766E", "#EA580C", "#64748B"];
const BOOKING_DONE_STATUSES = new Set(["completed", "released"]);
const BOOKING_EXCLUDED_STATUSES = new Set(["cancelled"]);

const toDateOnly = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
};

const toDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

const getInitials = (name = "") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "EM";
    return parts.map(part => part[0]).join("").toUpperCase().slice(0, 2);
};

const pickColor = (seed = "") => {
    if (!seed) return COLOR_PALETTE[0];
    const index = [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
};

const normalizeKey = (value = "") => String(value).trim().toLowerCase();

const clampPercentage = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const getEmployeeMatchKeys = (employee = {}) => {
    const fullName = employee.fullName || employee.name || `${employee.firstName || ""} ${employee.lastName || ""}`.replace(/\s+/g, " ").trim();
    return new Set(
        [
            employee._id,
            employee.id,
            employee.employeeId,
            employee.name,
            employee.fullName,
            fullName,
            employee.email,
            `${employee.firstName || ""} ${employee.lastName || ""}`.replace(/\s+/g, " ").trim(),
        ].map(normalizeKey).filter(Boolean)
    );
};

const matchesEmployeeBooking = (booking, employee) => {
    const assignedTailor = normalizeKey(booking?.assignedTailor);
    if (!assignedTailor) return false;
    return getEmployeeMatchKeys(employee).has(assignedTailor);
};

const getBookingReference = (booking = {}) => {
    const rawId = booking?._id || booking?.id || "";
    const suffix = String(rawId).slice(-6).toUpperCase();
    return suffix ? `BK-${suffix}` : "Booking";
};

const getBookingTaskLabel = (booking = {}) => {
    const steps = Array.isArray(booking.steps) ? booking.steps : [];
    const activeStep = steps.find((step) => step?.active) || steps.find((step) => !step?.done);
    const statusText = String(booking.status || "").trim();
    const stage = activeStep?.label || statusText || "Pending";
    const service = booking.service || booking.bookingType || "Service";
    return `${getBookingReference(booking)} • ${service} • ${stage}`;
};

const getCleanBookingTaskLabel = (booking = {}) =>
    String(getBookingTaskLabel(booking))
        .replace(/â€¢/g, "-")
        .replace(/\s+/g, " ")
        .trim();

const buildBookingTaskLabel = (booking = {}) => {
    const steps = Array.isArray(booking.steps) ? booking.steps : [];
    const activeStep = steps.find((step) => step?.active) || steps.find((step) => !step?.done);
    const statusText = String(booking.status || "").trim();
    const stage = activeStep?.label || statusText || "Pending";
    const service = booking.service || booking.bookingType || "Service";
    return `${getBookingReference(booking)} - ${service} - ${stage}`;
};

const deriveEmployeeMetrics = (employee, bookings) => {
    const matchedBookings = (Array.isArray(bookings) ? bookings : []).filter((booking) => matchesEmployeeBooking(booking, employee));
    const trackedBookings = matchedBookings.filter((booking) => !BOOKING_EXCLUDED_STATUSES.has(normalizeKey(booking.status)));
    const completedBookings = trackedBookings.filter((booking) => BOOKING_DONE_STATUSES.has(normalizeKey(booking.status)));
    const activeBookings = trackedBookings.filter((booking) => !BOOKING_DONE_STATUSES.has(normalizeKey(booking.status)));

    const bookingTasks = activeBookings.map(buildBookingTaskLabel);
    const storedTasks = Array.isArray(employee.tasks) ? employee.tasks.filter(Boolean) : [];
    const combinedTasks = Array.from(new Set([...bookingTasks, ...storedTasks]));

    return {
        orders: trackedBookings.length > 0 ? trackedBookings.length : employee.orders,
        productivity: trackedBookings.length > 0
            ? clampPercentage((completedBookings.length / trackedBookings.length) * 100)
            : clampPercentage(employee.productivity),
        tasks: combinedTasks,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
    };
};

const mapStaffToEmployee = (staff, index = 0) => {
    const sequence = String(index + 1).padStart(3, "0");
    const id = staff.employeeId || `EMP-${sequence}`;
    const fullName = staff.fullName || `${staff.firstName || ""} ${staff.lastName || ""}`.replace(/\s+/g, " ").trim();
    const safeName = fullName || "Unnamed Staff";
    return {
        ...staff,
        _id: staff._id,
        id,
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        name: safeName,
        email: staff.email || "",
        contact: staff.phoneNumber || "",
        type: staff.employmentType || "Full Time",
        position: staff.position || "Tailor",
        status: staff.accountStatus || "Active",
        hired: toDateOnly(staff.hiredDate || staff.createdAt) || "-",
        dob: toDateOnly(staff.dob) || "-",
        gender: staff.gender || "Male",
        address: staff.address || "-",
        role: staff.systemRole || "Employee",
        lastLogin: toDateTime(staff.lastLoginAt),
        created: toDateOnly(staff.createdAt) || "-",
        avatar: getInitials(safeName),
        color: pickColor(staff._id || id),
        orders: Number.isFinite(Number(staff.ordersCompleted)) ? Number(staff.ordersCompleted) : 0,
        productivity: Number.isFinite(Number(staff.productivityScore)) ? Number(staff.productivityScore) : 0,
        tasks: Array.isArray(staff.tasks) ? staff.tasks : [],
        emergencyContact: staff.emergencyContact || { name: "", relationship: "", contact: "" },
        regionCode: staff.regionCode || "",
        regionName: staff.regionName || "",
        provinceCode: staff.provinceCode || "",
        provinceName: staff.provinceName || "",
        cityCode: staff.cityCode || "",
        cityName: staff.cityName || "",
        brgyCode: staff.brgyCode || "",
        brgyName: staff.brgyName || "",
        street: staff.street || "",
    };
};

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
    const [employees, setEmployees] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [sortBy, setSortBy] = useState("Newest");
    const [showModal, setShowModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState(null);
    const [selected, setSelected] = useState(null);

    const readErrorMessage = (error, fallback = "Request failed") =>
        error?.response?.data?.message || error?.message || fallback;

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            setApiError("");
            const [staffResult, bookingResult] = await Promise.allSettled([
                staffApi.getAllStaff(),
                bookingApi.getAllBookings(),
            ]);

            if (staffResult.status !== "fulfilled") {
                throw staffResult.reason;
            }

            const response = staffResult.value;
            const rawStaff = Array.isArray(response?.staff) ? response.staff : Array.isArray(response) ? response : [];
            const mapped = rawStaff.map((staff, index) => mapStaffToEmployee(staff, index));
            setEmployees(mapped);
            setSelected(prev => (prev ? mapped.find(item => item._id === prev._id) || null : null));

            if (bookingResult.status === "fulfilled") {
                const rawBookings = Array.isArray(bookingResult.value?.bookings) ? bookingResult.value.bookings : [];
                setBookings(rawBookings);
            } else {
                console.error("Failed to fetch bookings for staff metrics:", bookingResult.reason);
                setBookings([]);
            }
        } catch (error) {
            console.error("Failed to fetch staff:", error);
            setApiError(readErrorMessage(error, "Failed to load staff list"));
            setEmployees([]);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // edit
    useEffect(() => {
        const handleEdit = (e) => {
            setEditingEmp(e.detail);
            setShowModal(true);
        };
        window.addEventListener('edit-staff', handleEdit);
        return () => window.removeEventListener('edit-staff', handleEdit);
    }, []);

    const employeesWithMetrics = useMemo(() => (
        employees.map((employee) => ({
            ...employee,
            ...deriveEmployeeMetrics(employee, bookings),
        }))
    ), [employees, bookings]);

    const filtered = useMemo(() => {
        let list = [...employeesWithMetrics];
        if (search) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));
        if (typeFilter !== "All Types") list = list.filter(e => e.type === typeFilter);
        if (statusFilter !== "All Status") list = list.filter(e => e.status === statusFilter);
        if (sortBy === "Newest") list.sort((a, b) => new Date(b.hired) - new Date(a.hired));
        if (sortBy === "Oldest") list.sort((a, b) => new Date(a.hired) - new Date(b.hired));
        if (sortBy === "Name A-Z") list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [employeesWithMetrics, search, typeFilter, statusFilter, sortBy]);

    const selectedEmployee = useMemo(() => {
        if (!selected?._id) return selected;
        return employeesWithMetrics.find((item) => item._id === selected._id) || selected;
    }, [employeesWithMetrics, selected]);

    const stats = useMemo(() => ([
        { label: "Total Employees", value: employees.length, icon: UsersIcon, color: "#2563EB", sub: `${employees.filter(e => e.status === "Active").length} currently active` },
        { label: "Active", value: employees.filter(e => e.status === "Active").length, icon: CheckCircle2, color: "#059669" },
        { label: "Inactive", value: employees.filter(e => e.status === "Inactive").length, icon: AlertCircle, color: "#64748B" },
        { label: "Suspended", value: employees.filter(e => e.status === "Suspended").length, icon: XCircle, color: "#DC2626" },
    ]), [employees]);

    const deactivate = async (id) => {
        const target = employees.find(emp => emp.id === id);
        if (!target?._id) return;

        try {
            const response = await staffApi.deactivateStaff(target._id);
            const updatedRaw = response?.staff || response;
            setEmployees(prev => prev.map((emp, index) => (
                emp._id === target._id ? mapStaffToEmployee(updatedRaw, index) : emp
            )));
            setSelected(prev => (prev && prev._id === target._id ? mapStaffToEmployee(updatedRaw) : prev));
        } catch (error) {
            console.error("Failed to deactivate staff:", error);
            setApiError(readErrorMessage(error, "Failed to deactivate staff account"));
        }
    };

    const saveEmployee = async (emp) => {
        setApiError("");
        try {
            if (editingEmp?._id) {
                const response = await staffApi.updateStaff(editingEmp._id, emp);
                const updatedRaw = response?.staff || response;
                setEmployees(prev => prev.map((item, index) => (
                    item._id === editingEmp._id ? mapStaffToEmployee(updatedRaw, index) : item
                )));
                setSelected(prev => (prev && prev._id === editingEmp._id ? mapStaffToEmployee(updatedRaw) : prev));
                setEditingEmp(null);
                return;
            }

            const response = await staffApi.createStaff(emp);
            const createdRaw = response?.staff || response;
            setEmployees(prev => [mapStaffToEmployee(createdRaw, prev.length), ...prev]);
        } catch (error) {
            console.error("Failed to save staff:", error);
            const message = readErrorMessage(error, "Failed to save staff account");
            setApiError(message);
            throw new Error(message);
        }
    };

    return (
        <div className="font-inter min-h-screen overflow-x-hidden">
            <div className="px-3 sm:px-6 lg:px-4 py-2">
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">Staff Management</h1>
                        <p className="text-[11px] sm:text-[13px] text-slate-500 mt-0.5">Manage employee accounts, roles, and system access.</p>
                    </div>
                    <button
                        onClick={() => { setEditingEmp(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl border-none cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
                    >
                        <Plus size={15} />
                        <span className="hidden xs:inline sm:inline">Add Employee</span>
                    </button>
                </div>
                {apiError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                        {apiError}
                    </div>
                )}
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
                                placeholder="Search by name or ID..."
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
                    {loading ? (
                        <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                <Search size={22} className="text-slate-200" />
                            </div>
                            <span className="text-[13px] font-medium">Loading staff...</span>
                        </div>
                    ) : filtered.length === 0 ? (
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
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <Search size={24} className="text-slate-200" />
                                                </div>
                                                <span className="text-[13px] font-medium">Loading staff list...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
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

            {showModal && (
                <AddEmployeeModal
                    employees={employees}
                    initialData={editingEmp}
                    onClose={() => { setShowModal(false); setEditingEmp(null); }}
                    onAdd={saveEmployee}
                />
            )}
            {selectedEmployee && <ProfilePanel emp={selectedEmployee} onClose={() => setSelected(null)} />}
        </div>
    );
};

export default AdStaff;


