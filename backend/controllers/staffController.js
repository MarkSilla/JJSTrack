import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

const STAFF_FIELDS_TO_EXCLUDE =
  "-password -verificationCode -verificationCodeExpiry -resetCode -resetCodeExpiry -__v";

const parseDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const composeFullName = (firstName = "", lastName = "") =>
  `${String(firstName).trim()} ${String(lastName).trim()}`.replace(/\s+/g, " ").trim();

const ensureAdminAccess = async (req, res) => {
  if (req.userId === "admin") return true;

  const requester = await userModel.findById(req.userId).select("role");
  if (!requester || requester.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return false;
  }

  return true;
};

const buildStaffPayload = (body = {}, { isCreate = false } = {}) => {
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const fullName = composeFullName(firstName, lastName);

  const payload = {
    firstName,
    lastName,
    fullName,
    email: body.email ? String(body.email).trim().toLowerCase() : undefined,
    phoneNumber: body.contact ? String(body.contact).trim() : undefined,
    address: body.address ? String(body.address).trim() : undefined,
    employeeId: body.id ? String(body.id).trim() : undefined,
    employmentType: body.type,
    position: body.position,
    accountStatus: body.status,
    systemRole: body.role,
    hiredDate: parseDate(body.hired),
    dob: parseDate(body.dob),
    gender: body.gender,
    emergencyContact: {
      name: body.emergencyContact?.name || body.emergencyName || "",
      relationship: body.emergencyContact?.relationship || body.emergencyRelation || "",
      contact: body.emergencyContact?.contact || body.emergencyContactNum || "",
    },
    regionCode: body.regionCode || "",
    regionName: body.regionName || "",
    provinceCode: body.provinceCode || "",
    provinceName: body.provinceName || "",
    cityCode: body.cityCode || "",
    cityName: body.cityName || "",
    brgyCode: body.brgyCode || "",
    brgyName: body.brgyName || "",
    street: body.street || "",
    tasks: Array.isArray(body.tasks) ? body.tasks : undefined,
    ordersCompleted: Number.isFinite(Number(body.orders)) ? Number(body.orders) : undefined,
    productivityScore: Number.isFinite(Number(body.productivity)) ? Number(body.productivity) : undefined,
    updatedAt: new Date(),
  };

  if (isCreate) {
    payload.role = "staff";
    payload.isVerified = true;
  }

  return payload;
};

const compactObject = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );

export const getMyStaff = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const staff = await userModel
      .find({ 
        role: "staff", 
        $or: [
          { createdBy: req.userId === "admin" ? { $exists: false } : req.userId },
          { createdBy: null }
        ],
        accountStatus: "Active"
      })
      .select(STAFF_FIELDS_TO_EXCLUDE)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("Get My Staff Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch my staff" });
  }
};

export const getStaff = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const staff = await userModel
      .find({ role: "staff" })
      .select(STAFF_FIELDS_TO_EXCLUDE)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("Get Staff Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch staff" });
  }
};

export const createStaff = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const { firstName, lastName, email, password, id } = req.body;

    if (!firstName || !lastName || !email || !password || !id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, email, password, and id",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingEmail = await userModel.findOne({ email: normalizedEmail }).select("_id");
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    const employeeId = String(id).trim();
    const existingEmployeeId = await userModel.findOne({ employeeId }).select("_id");
    if (existingEmployeeId) {
      return res.status(409).json({ success: false, message: "Employee ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const payload = compactObject(buildStaffPayload(req.body, { isCreate: true }));

const staff = await userModel.create({
      ...payload,
      createdBy: req.userId === "admin" ? null : req.userId,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const publicStaff = await userModel.findById(staff._id).select(STAFF_FIELDS_TO_EXCLUDE);

    res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      staff: publicStaff,
    });
  } catch (error) {
    console.error("Create Staff Error:", error);
    res.status(500).json({ success: false, message: "Failed to create staff account" });
  }
};

export const updateStaff = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const { id } = req.params;
    const existing = await userModel.findOne({ _id: id, role: "staff" });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const payload = compactObject(buildStaffPayload(req.body));
    delete payload.employeeId;
    delete payload.role;
    delete payload.password;

    if (payload.email && payload.email !== existing.email) {
      const emailExists = await userModel.findOne({ email: payload.email, _id: { $ne: id } }).select("_id");
      if (emailExists) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
    }

    Object.assign(existing, payload);
    if (!existing.fullName) {
      existing.fullName = composeFullName(existing.firstName, existing.lastName);
    }

    await existing.save();
    const updated = await userModel.findById(id).select(STAFF_FIELDS_TO_EXCLUDE);

    res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      staff: updated,
    });
  } catch (error) {
    console.error("Update Staff Error:", error);
    res.status(500).json({ success: false, message: "Failed to update staff account" });
  }
};

export const deactivateStaff = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const { id } = req.params;
    const staff = await userModel.findOne({ _id: id, role: "staff" });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    staff.accountStatus = "Inactive";
    staff.updatedAt = new Date();
    await staff.save();

    const updated = await userModel.findById(id).select(STAFF_FIELDS_TO_EXCLUDE);
    res.status(200).json({
      success: true,
      message: "Staff deactivated successfully",
      staff: updated,
    });
  } catch (error) {
    console.error("Deactivate Staff Error:", error);
    res.status(500).json({ success: false, message: "Failed to deactivate staff account" });
  }
};
