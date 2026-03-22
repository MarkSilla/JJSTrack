import { useState } from "react";
import { Plus, X, RefreshCw, Copy } from "lucide-react";

const genPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const genId = () => "EMP-" + String(Math.floor(Math.random() * 100) + 10);

const DEPARTMENTS = ["Production", "Front Desk", "Design", "Operations", "Accounting", "Management"];

const Field = ({ label, children, cls = "" }) => (
    <div className={cls}>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">{label}</label>
        <div className="[&_input]:w-full [&_input]:px-3 [&_input]:py-2 [&_input]:bg-white [&_input]:border [&_input]:border-slate-200 [&_input]:rounded-lg [&_input]:text-[12px] [&_input]:text-slate-800 [&_input]:outline-none [&_input:focus]:border-blue-400 [&_input:focus]:ring-2 [&_input:focus]:ring-blue-50 [&_select]:w-full [&_select]:px-3 [&_select]:py-2 [&_select]:bg-white [&_select]:border [&_select]:border-slate-200 [&_select]:rounded-lg [&_select]:text-[12px] [&_select]:text-slate-800 [&_select]:outline-none [&_select:focus]:border-blue-400 [&_div_input]:flex-1">
            {children}
        </div>
    </div>
);

const AddEmployeeModal = ({ onClose, onAdd }) => {
    const [form, setForm] = useState({
        name: "", id: genId(), email: "", contact: "", address: "",
        type: "Tailor", dept: "Production", position: "", hired: new Date().toISOString().split("T")[0],
        status: "Active", role: "Employee", password: genPassword(), dob: "", gender: "Male",
    });
    const [copied, setCopied] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = () => {
        if (!form.name || !form.email) return;
        onAdd({ ...form, avatar: form.name.split(" ").map(n => n[0]).toUpperCase().join("").slice(0, 2), color: "#2563EB", orders: 0, productivity: 0, tasks: [], lastLogin: "—", created: form.hired });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
                <div className="flex items-center justify-between px-2 py-5 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Plus size={15} className="text-white" />
                            </div>
                            <h2 className="text-[17px] font-bold text-slate-900">Create Employee Account</h2>
                        </div>
                        <p className="text-[12px] text-slate-400 mt-0.5 ml-[42px]">Fill in the details to register a new employee.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 bg-transparent border-none cursor-pointer transition-colors">
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5">
                    <div className="space-y-5">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Personal Information</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Full Name *" placeholder="e.g. Maria Santos">
                                    <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Maria Santos" />
                                </Field>
                                <Field label="Employee ID">
                                    <div className="flex gap-2">
                                        <input value={form.id} onChange={e => set("id", e.target.value)} />
                                        <button onClick={() => set("id", genId())} className="px-2.5 py-0 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border-none cursor-pointer text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1">
                                            <RefreshCw size={11} /> Auto
                                        </button>
                                    </div>
                                </Field>
                                <Field label="Date of Birth">
                                    <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} />
                                </Field>
                                <Field label="Gender">
                                    <select value={form.gender} onChange={e => set("gender", e.target.value)}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </Field>
                                <Field label="Address" cls="col-span-2">
                                    <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, City, Province" />
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact & Account</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Email Address *" placeholder="employee@jjs.com">
                                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="employee@jjs.com" />
                                </Field>
                                <Field label="Contact Number">
                                    <input value={form.contact} onChange={e => set("contact", e.target.value)} placeholder="+63 9XX XXX XXXX" />
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Employment Details</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Employee Type">
                                    <select value={form.type} onChange={e => set("type", e.target.value)}>
                                        {["Tailor", "Printer", "Layout Artist", "Repair Specialist", "Staff", "Manager"].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Department">
                                    <select value={form.dept} onChange={e => set("dept", e.target.value)}>
                                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </Field>
                                <Field label="Position / Role">
                                    <input value={form.position} onChange={e => set("position", e.target.value)} placeholder="e.g. Senior Tailor" />
                                </Field>
                                <Field label="Date Hired">
                                    <input type="date" value={form.hired} onChange={e => set("hired", e.target.value)} />
                                </Field>
                                <Field label="Status">
                                    <select value={form.status} onChange={e => set("status", e.target.value)}>
                                        <option>Active</option><option>Inactive</option>
                                    </select>
                                </Field>
                                <Field label="System Role">
                                    <select value={form.role} onChange={e => set("role", e.target.value)}>
                                        <option>Employee</option><option>Manager</option>
                                    </select>
                                </Field>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Temporary Password</div>
                            <div className="flex items-center gap-3">
                                <code className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-mono text-slate-800 tracking-wider">
                                    {form.password}
                                </code>
                                <button onClick={() => set("password", genPassword())} className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 cursor-pointer transition-colors border-solid">
                                    <RefreshCw size={11} /> Regenerate
                                </button>
                                <button onClick={() => { navigator.clipboard?.writeText(form.password); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium cursor-pointer transition-colors border-none">
                                    <Copy size={11} /> {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">The employee must change this password on first login.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors border-solid">Cancel</button>
                    <button onClick={handleSubmit} className="px-5 py-2 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors border-none flex items-center gap-2">
                        <Plus size={14} /> Create Employee
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
