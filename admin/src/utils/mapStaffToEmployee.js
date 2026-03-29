const COLOR_PALETTE = ["#2563EB", "#0891B2", "#7C3AED", "#059669", "#D97706", "#BE185D", "#1D4ED8", "#0F766E", "#EA580C", "#64748B"];

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

const toDateOnly = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
};

export const mapStaffToEmployee = (staff, index = 0) => {
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
        avatar: getInitials(safeName),
        color: pickColor(staff._id || id),
    };
};
