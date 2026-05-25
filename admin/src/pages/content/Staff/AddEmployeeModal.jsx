import { useState, useEffect, useMemo } from "react";
import { Plus, X, Copy } from "lucide-react";
import { regions, provinces, cities, barangays } from "select-philippines-address";

const parseEmpSequence = (id = "") => {
    const match = /^EMP-(\d+)(?:-(\d{4}))?$/.exec(String(id).trim());
    return match ? Number(match[1]) : null;
};

const splitName = (name = "") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const formatPasswordBase = (lastName = "") => {
    const clean = String(lastName).trim().replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    if (!clean) return "Employee";
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const buildPassword = (lastName, sequenceLabel) => `${formatPasswordBase(lastName)}${sequenceLabel}`;

const EMP_TYPES = ["Full Time", "Part Time", "Contractual"];
const ROLES = ["Tailor", "Layout Artist", "Presser"];

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

const AddEmployeeModal = ({ employees = [], initialData, onClose, onAdd }) => {
    const currentYear = new Date().getFullYear();
    const existingName = useMemo(() => splitName(initialData?.name || ""), [initialData?.name]);

    const nextSequence = useMemo(() => {
        if (initialData?.id) {
            const currentSequence = parseEmpSequence(initialData.id);
            if (currentSequence) return currentSequence;
        }

        const maxSequence = employees.reduce((max, employee) => {
            const seq = parseEmpSequence(employee.id);
            if (!seq) return max;
            return Math.max(max, seq);
        }, 0);

        return maxSequence + 1;
    }, [employees, initialData?.id]);

    const sequenceLabel = String(nextSequence).padStart(3, "0");
    const generatedId = `EMP-${sequenceLabel}-${currentYear}`;

    const [form, setForm] = useState(() => {
        const init = initialData || {};
        return {
            firstName: init.firstName || existingName.firstName,
            lastName: init.lastName || existingName.lastName,
            id: init.id || generatedId,
            email: init.email || "",
            contact: init.contact || "",
            type: init.type || "Full Time",
            position: init.position || "Tailor",
            hired: init.hired || new Date().toISOString().split("T")[0],
            status: init.status || "Active",
            role: init.role || "Employee",
            password: init.password || (initialData ? "********" : buildPassword(init.lastName || existingName.lastName, sequenceLabel)),
            dob: init.dob || "",
            gender: init.gender || "Male",
            emergencyName: init.emergencyContact?.name || "",
            emergencyRelation: init.emergencyContact?.relationship || "",
            emergencyContactNum: init.emergencyContact?.contact || "",

            // Address parts
            regionCode: init.regionCode || "",
            regionName: init.regionName || "",
            provinceCode: init.provinceCode || "",
            provinceName: init.provinceName || "",
            cityCode: init.cityCode || "",
            cityName: init.cityName || "",
            brgyCode: init.brgyCode || "",
            brgyName: init.brgyName || "",
            street: init.street || init.address || ""
        };
    });
    const [errors, setErrors] = useState({});
    const [copied, setCopied] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) return;

        setForm((current) => {
            const nextPassword = buildPassword(current.lastName, sequenceLabel);
            if (current.id === generatedId && current.password === nextPassword) return current;
            return { ...current, id: generatedId, password: nextPassword };
        });
    }, [generatedId, initialData, sequenceLabel]);

    const set = (k, v) => {
        setForm((current) => {
            const updated = { ...current, [k]: v };
            if (!initialData && k === "lastName") {
                updated.password = buildPassword(v, sequenceLabel);
            }
            return updated;
        });
        if (submitError) setSubmitError("");
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

    const handleSubmit = async () => {
        const newErrors = {};
        if (!form.firstName.trim()) newErrors.firstName = "Required";
        if (!form.lastName.trim()) newErrors.lastName = "Required";
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

        const fullName = `${form.firstName} ${form.lastName}`.replace(/\s+/g, " ").trim();
        const addrParts = [form.street, form.brgyName, form.cityName, form.provinceName, form.regionName].filter(Boolean);
        const newEmp = {
            ...initialData,
            ...form,
            name: fullName,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            address: addrParts.join(", "),
            avatar: fullName.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2),
            color: initialData?.color || "#2563EB",
            orders: initialData?.orders ?? 0,
            productivity: initialData?.productivity ?? 0,
            tasks: initialData?.tasks ?? [],
            lastLogin: initialData?.lastLogin ?? "-",
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

        try {
            setIsSubmitting(true);
            setSubmitError("");
            await onAdd(newEmp);
            onClose();
        } catch (error) {
            setSubmitError(error?.message || "Failed to save employee account");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "100vh" }}>
                <div className="flex items-center justify-between px-4 sm:px-2 py-5 border-b border-slate-100 shrink-0">
                    <div className="pl-2 sm:pl-0">
                        <h2 className="text-[17px] font-bold text-slate-900 ml-0 sm:ml-[15px]">{initialData ? "Edit Employee Account" : "Create Employee Account"}</h2>
                        <p className="text-[12px] text-slate-400 mt-0.5 ml-0 sm:ml-[15px]">{initialData ? "Update the details of the employee." : "Fill in the details to register a new employee."}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 bg-transparent border-none cursor-pointer transition-colors mr-2">
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5">
                    <div className="space-y-5">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Personal Information</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First Name *" error={errors.firstName}>
                                    <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="First name" />
                                </Field>
                                <Field label="Last Name *" error={errors.lastName}>
                                    <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Last name" />
                                </Field>
                                <Field label="Employee ID" cls="col-span-2">
                                    <input value={form.id} readOnly className="bg-slate-50 text-slate-500 cursor-not-allowed" />
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
                                <button onClick={() => { navigator.clipboard?.writeText(form.password); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium cursor-pointer transition-colors border-none">
                                    <Copy size={11} /> {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                {initialData ? "The employee must change this password on first login." : "Auto-generated from Last Name + sequence (example: Silla001)."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
                    <div className="text-[11px] text-red-600 font-medium">
                        {submitError}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-[13px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors border-solid disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors border-none flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} /> {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Create Employee"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEmployeeModal;

