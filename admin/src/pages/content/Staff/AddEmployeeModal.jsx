import { useState, useEffect } from "react";
import { Plus, X, RefreshCw, Copy } from "lucide-react";
import { regions, provinces, cities, barangays } from "select-philippines-address";

const genPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const genId = () => "EMP-" + String(Math.floor(Math.random() * 100) + 10);

const EMP_TYPES = ["Full Time", "Part Time", "Contractual"];
const ROLES = ["Tailor", "Layout Artist", "Bookkeeper", "Presser", "Repair Technician"];

const Field = ({ label, error, children, cls = "" }) => (
    <div className={cls}>
        <label className="text-[11px] font-semibold text-slate-600 mb-1.5 flex justify-between items-center">
            <span>{label}</span>
            {error && <span className="text-[10px] text-red-500 font-medium">{error}</span>}
        </label>
        <div className={`[&_input]:w-full [&_input]:px-3 [&_input]:py-2 [&_input]:bg-white [&_input]:border ${error ? '[&_input]:border-red-400 [&_input]:ring-1 [&_input]:ring-red-400/10' : '[&_input]:border-slate-200'} [&_input]:rounded-lg [&_input]:text-[12px] [&_input]:text-slate-800 [&_input]:outline-none [&_input:focus]:border-blue-400 [&_input:focus]:ring-2 [&_input:focus]:ring-blue-50 [&_select]:w-full [&_select]:px-3 [&_select]:py-2 [&_select]:bg-white [&_select]:border ${error ? '[&_select]:border-red-400 [&_select]:ring-1 [&_select]:ring-red-400/10' : '[&_select]:border-slate-200'} [&_select]:rounded-lg [&_select]:text-[12px] [&_select]:text-slate-800 [&_select]:outline-none [&_select:focus]:border-blue-400 [&_div_input]:flex-1`}>
            {children}
        </div>
    </div>
);

const AddEmployeeModal = ({ initialData, onClose, onAdd }) => {
    const [form, setForm] = useState(() => {
        const init = initialData || {};
        return {
            name: init.name || "", id: init.id || genId(), email: init.email || "", contact: init.contact || "",
            type: init.type || "Full Time", position: init.position || "Tailor", hired: init.hired || new Date().toISOString().split("T")[0],
            status: init.status || "Active", role: init.role || "Employee", password: init.password || genPassword(), dob: init.dob || "", gender: init.gender || "Male",
            emergencyName: init.emergencyContact?.name || "", emergencyRelation: init.emergencyContact?.relationship || "", emergencyContactNum: init.emergencyContact?.contact || "",

            // Address parts
            regionCode: init.regionCode || "", regionName: init.regionName || "",
            provinceCode: init.provinceCode || "", provinceName: init.provinceName || "",
            cityCode: init.cityCode || "", cityName: init.cityName || "",
            brgyCode: init.brgyCode || "", brgyName: init.brgyName || "",
            street: init.street || init.address || ""
        };
    });
    const [errors, setErrors] = useState({});
    const [copied, setCopied] = useState(false);
    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    const [regionList, setRegionList] = useState([]);
    const [provinceList, setProvinceList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [brgyList, setBrgyList] = useState([]);

    useEffect(() => {
        regions().then(res => setRegionList(res));
        if (form.regionCode) provinces(form.regionCode).then(res => setProvinceList(res));
        if (form.provinceCode) cities(form.provinceCode).then(res => setCityList(res));
        if (form.cityCode) barangays(form.cityCode).then(res => setBrgyList(res));
    }, []);

    const handleRegion = (e) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setForm(f => ({ ...f, regionCode: code, regionName: code ? name : "", provinceCode: "", provinceName: "", cityCode: "", cityName: "", brgyCode: "", brgyName: "" }));
        if (code) provinces(code).then(res => setProvinceList(res));
        else setProvinceList([]);
        setCityList([]); setBrgyList([]);
    };
    const handleProvince = (e) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setForm(f => ({ ...f, provinceCode: code, provinceName: code ? name : "", cityCode: "", cityName: "", brgyCode: "", brgyName: "" }));
        if (code) cities(code).then(res => setCityList(res));
        else setCityList([]);
        setBrgyList([]);
    };
    const handleCity = (e) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setForm(f => ({ ...f, cityCode: code, cityName: code ? name : "", brgyCode: "", brgyName: "" }));
        if (code) barangays(code).then(res => setBrgyList(res));
        else setBrgyList([]);
    };
    const handleBrgy = (e) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        setForm(f => ({ ...f, brgyCode: code, brgyName: code ? name : "" }));
    };

    const handleSubmit = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Required";
        if (!form.dob) newErrors.dob = "Required";
        if (!form.email.trim()) newErrors.email = "Required";
        if (!form.contact.trim()) newErrors.contact = "Required";
        if (!form.hired) newErrors.hired = "Required";
        if (!form.emergencyName.trim()) newErrors.emergencyName = "Required";
        if (!form.emergencyRelation.trim()) newErrors.emergencyRelation = "Required";
        if (!form.emergencyContactNum.trim()) newErrors.emergencyContactNum = "Required";
        if (!form.regionCode) newErrors.regionCode = "Required";
        if (!form.provinceCode) newErrors.provinceCode = "Required";
        if (!form.cityCode) newErrors.cityCode = "Required";
        if (!form.brgyCode) newErrors.brgyCode = "Required";
        if (!form.street.trim()) newErrors.street = "Required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const addrParts = [form.street, form.brgyName, form.cityName, form.provinceName, form.regionName].filter(Boolean);
        const newEmp = {
            ...initialData,
            ...form,
            address: addrParts.join(", "),
            avatar: form.name.split(" ").map(n => n[0]).toUpperCase().join("").slice(0, 2),
            color: initialData?.color || "#2563EB",
            orders: initialData?.orders ?? 0,
            productivity: initialData?.productivity ?? 0,
            tasks: initialData?.tasks ?? [],
            lastLogin: initialData?.lastLogin ?? "—",
            created: initialData?.created || form.hired,
            emergencyContact: {
                name: form.emergencyName,
                relationship: form.emergencyRelation,
                contact: form.emergencyContactNum
            }
        };
        delete newEmp.emergencyName;
        delete newEmp.emergencyRelation;
        delete newEmp.emergencyContactNum;

        onAdd(newEmp);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
                <div className="flex items-center justify-between px-2 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-[17px] font-bold text-slate-900 ml-[15px]">{initialData ? "Edit Employee Account" : "Create Employee Account"}</h2>
                        <p className="text-[12px] text-slate-400 mt-0.5 ml-[15px]">{initialData ? "Update the details of the employee." : "Fill in the details to register a new employee."}</p>
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
                                <Field label="Full Name *" placeholder="Name" error={errors.name}>
                                    <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name" />
                                </Field>
                                <Field label="Employee ID">
                                    <div className="flex gap-2">
                                        <input value={form.id} onChange={e => set("id", e.target.value)} />
                                        <button onClick={() => set("id", genId())} className="px-2.5 py-0 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border-none cursor-pointer text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1">
                                            <RefreshCw size={11} /> Auto
                                        </button>
                                    </div>
                                </Field>
                                <Field label="Date of Birth *" error={errors.dob}>
                                    <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} />
                                </Field>
                                <Field label="Gender">
                                    <select value={form.gender} onChange={e => set("gender", e.target.value)}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Address</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Region *" error={errors.regionCode}>
                                    <select value={form.regionCode} onChange={handleRegion}>
                                        <option value="">Select Region</option>
                                        {regionList.map(r => <option key={r.region_code} value={r.region_code}>{r.region_name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Province *" error={errors.provinceCode}>
                                    <select value={form.provinceCode} onChange={handleProvince} disabled={!form.regionCode}>
                                        <option value="">Select Province</option>
                                        {provinceList.map(p => <option key={p.province_code} value={p.province_code}>{p.province_name}</option>)}
                                    </select>
                                </Field>
                                <Field label="City / Municipality *" error={errors.cityCode}>
                                    <select value={form.cityCode} onChange={handleCity} disabled={!form.provinceCode}>
                                        <option value="">Select City</option>
                                        {cityList.map(c => <option key={c.city_code} value={c.city_code}>{c.city_name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Barangay *" error={errors.brgyCode}>
                                    <select value={form.brgyCode} onChange={handleBrgy} disabled={!form.cityCode}>
                                        <option value="">Select Barangay</option>
                                        {brgyList.map(b => <option key={b.brgy_code} value={b.brgy_code}>{b.brgy_name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Street / House No. / Building *" cls="col-span-2" error={errors.street}>
                                    <input value={form.street} onChange={e => set("street", e.target.value)} placeholder="e.g. #123 Gordon Heights, Street" />
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact & Account</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Email Address *" placeholder="employee@jjs.com" error={errors.email}>
                                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="employee@jjs.com" />
                                </Field>
                                <Field label="Contact Number *" error={errors.contact}>
                                    <input value={form.contact} onChange={e => set("contact", e.target.value)} placeholder="+63 9XX XXX XXXX" />
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Employment Details</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Employee Type">
                                    <select value={form.type} onChange={e => set("type", e.target.value)}>
                                        {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Role">
                                    <select value={form.position} onChange={e => set("position", e.target.value)}>
                                        {ROLES.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </Field>
                                <Field label="Date Hired *" error={errors.hired}>
                                    <input type="date" value={form.hired} onChange={e => set("hired", e.target.value)} />
                                </Field>
                                <Field label="Status">
                                    <select value={form.status} onChange={e => set("status", e.target.value)}>
                                        <option>Active</option><option>Inactive</option>
                                    </select>
                                </Field>
                                <Field label="System Role" cls="col-span-2">
                                    <select value={form.role} onChange={e => set("role", e.target.value)}>
                                        <option>Employee</option><option>Manager</option>
                                    </select>
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Emergency Contact</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Contact Name *" error={errors.emergencyName}>
                                    <input value={form.emergencyName} onChange={e => set("emergencyName", e.target.value)} placeholder="Name" />
                                </Field>
                                <Field label="Relationship *" error={errors.emergencyRelation}>
                                    <input value={form.emergencyRelation} onChange={e => set("emergencyRelation", e.target.value)} placeholder="e.g. Mother" />
                                </Field>
                                <Field label="Contact Number *" cls="col-span-2" error={errors.emergencyContactNum}>
                                    <input value={form.emergencyContactNum} onChange={e => set("emergencyContactNum", e.target.value)} placeholder="+63 9XX XXX XXXX" />
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
                        <Plus size={14} /> {initialData ? "Save Changes" : "Create Employee"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
