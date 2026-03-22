import { useState } from "react";
import { ArrowLeft, Pencil, X, Mail, Phone, MapPin, Calendar, User, Activity, Briefcase, Building2, Star, CheckCircle2, Shield, Clock, KeyRound, UserX, Package, TrendingUp, BadgeCheck } from "lucide-react";

const Avatar = ({ initials, color, size = 36 }) => (
    <div style={{ width: size, height: size, background: color + "18", border: `1.5px solid ${color}30`, borderRadius: size * 0.3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color, fontSize: size * 0.33, fontWeight: 700, letterSpacing: "0.02em" }}>{initials}</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const STATUS_CONFIG = {
        Active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
        Inactive: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", border: "border-slate-200" },
        Suspended: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
    };
    const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.Inactive;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {status}
        </span>
    );
};

const TypeBadge = ({ type }) => {
    const TYPE_CONFIG = {
        "Tailor": { bg: "bg-blue-50", text: "text-blue-700" },
        "Printer": { bg: "bg-cyan-50", text: "text-cyan-700" },
        "Layout Artist": { bg: "bg-violet-50", text: "text-violet-700" },
        "Repair Specialist": { bg: "bg-orange-50", text: "text-orange-700" },
        "Staff": { bg: "bg-slate-100", text: "text-slate-600" },
        "Manager": { bg: "bg-indigo-50", text: "text-indigo-700" },
    };
    const c = TYPE_CONFIG[type] ?? { bg: "bg-slate-100", text: "text-slate-600" };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${c.bg} ${c.text}`}>
            {type}
        </span>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-0.5">
        <Icon size={13} className="text-slate-400 mt-0.5 shrink-0" />
        <span className="text-[11px] text-slate-400 w-24 shrink-0">{label}</span>
        <span className="text-[12px] text-slate-800 font-medium flex-1">{value}</span>
    </div>
);

const Section = ({ title, icon: Icon, children }) => (
    <div>
        <div className="flex items-center gap-2 mb-3">
            <Icon size={13} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 space-y-2">{children}</div>
    </div>
);

const ProfilePanel = ({ emp, onClose }) => {
    const tabs = ["Overview", "Employment", "System"];
    const [tab, setTab] = useState("Overview");

    return (
        <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-900/35 backdrop-blur-[2px]">
            <div className="w-full max-w-xl bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <button onClick={onClose} className="flex items-center gap-2 text-[12px] font-medium text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer transition-colors">
                        <ArrowLeft size={14} /> Back to list
                    </button>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border-none cursor-pointer transition-colors flex items-center gap-1.5">
                            <Pencil size={11} /> Edit
                        </button>
                        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 bg-transparent border-none cursor-pointer">
                            <X size={15} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-4">
                        <Avatar initials={emp.avatar} color={emp.color} size={58} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-[18px] font-bold text-slate-900">{emp.name}</h2>
                                {emp.role === "Manager" && (
                                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                                        <BadgeCheck size={10} /> Manager
                                    </span>
                                )}
                            </div>
                            <div className="text-[12px] text-slate-500 mt-0.5">{emp.position} · {emp.dept}</div>
                            <div className="flex items-center gap-3 mt-2">
                                <StatusBadge status={emp.status} />
                                <TypeBadge type={emp.type} />
                                <span className="text-[11px] text-slate-400 font-mono">{emp.id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                            { label: "Orders Worked", value: emp.orders, icon: Package, color: "#2563EB" },
                            { label: "Productivity", value: emp.productivity + "%", icon: TrendingUp, color: "#059669" },
                            { label: "Tasks", value: emp.tasks.length, icon: CheckCircle2, color: "#7C3AED" },
                        ].map(s => (
                            <div key={s.label} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <s.icon size={12} style={{ color: s.color }} />
                                    <span className="text-[10px] text-slate-400">{s.label}</span>
                                </div>
                                <div className="text-[17px] font-bold text-slate-900">{s.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex border-b border-slate-100 px-6">
                    {tabs.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-3 text-[12px] font-semibold border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0
                ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {tab === "Overview" && (
                        <div className="space-y-5">
                            <Section title="Contact Information" icon={Phone}>
                                <InfoRow icon={Mail} label="Email" value={emp.email} />
                                <InfoRow icon={Phone} label="Contact" value={emp.contact} />
                                <InfoRow icon={MapPin} label="Address" value={emp.address} />
                                <InfoRow icon={Calendar} label="Birthday" value={emp.dob || "—"} />
                                <InfoRow icon={User} label="Gender" value={emp.gender} />
                            </Section>
                            <Section title="Recent Tasks" icon={Activity}>
                                {emp.tasks.length > 0 ? emp.tasks.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 py-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                        <span className="text-[12px] text-slate-700">{t}</span>
                                    </div>
                                )) : <div className="text-[12px] text-slate-400">No tasks assigned.</div>}
                            </Section>
                            <Section title="Performance" icon={TrendingUp}>
                                <div className="mt-1">
                                    <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                                        <span>Productivity Score</span>
                                        <span className="font-semibold text-slate-800">{emp.productivity}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: emp.productivity + "%", background: emp.productivity >= 80 ? "#10B981" : emp.productivity >= 60 ? "#F59E0B" : "#EF4444" }} />
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}
                    {tab === "Employment" && (
                        <div className="space-y-5">
                            <Section title="Employment Details" icon={Briefcase}>
                                <InfoRow icon={Briefcase} label="Type" value={emp.type} />
                                <InfoRow icon={Building2} label="Department" value={emp.dept} />
                                <InfoRow icon={Star} label="Position" value={emp.position} />
                                <InfoRow icon={Calendar} label="Date Hired" value={emp.hired} />
                                <InfoRow icon={CheckCircle2} label="Status" value={emp.status} />
                            </Section>
                        </div>
                    )}
                    {tab === "System" && (
                        <div className="space-y-5">
                            <Section title="System Access" icon={Shield}>
                                <InfoRow icon={Shield} label="System Role" value={emp.role} />
                                <InfoRow icon={Clock} label="Last Login" value={emp.lastLogin} />
                                <InfoRow icon={Calendar} label="Account Created" value={emp.created} />
                            </Section>
                            <div className="flex flex-col gap-2">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 cursor-pointer transition-colors text-left border-solid">
                                    <KeyRound size={14} className="text-slate-500" /> Reset Employee Password
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-[12px] font-medium text-red-700 cursor-pointer transition-colors text-left border-solid">
                                    <UserX size={14} className="text-red-500" /> Deactivate Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePanel;
