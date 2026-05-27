import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

const STAFF_FIELDS_TO_EXCLUDE =
  "-password -verificationCode -verificationCodeExpiry -resetCode -resetCodeExpiry -__v";

const isDuplicateKeyError = (error) => error?.code === 11000 || error?.code === 11001;

const normalizeStaffPhoneNumber = (value) => {
  const digits = String(value || "").trim();
  if (!digits) return "";
  return digits;
};

const isValidStaffPhoneNumber = (value) => /^\d{11}$/.test(String(value || "").trim());
const isTextOnly = (value) => /^[A-Za-z\s]+$/.test(String(value || "").trim());
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const hasLetter = (value) => /[A-Za-z]/.test(String(value || ""));

const validateStaffFields = (body = {}, { isCreate = false } = {}) => {
  const errors = [];
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim();
  const contact = body.contact ?? body.phoneNumber;
  const emergencyContact = body.emergencyContact?.contact ?? body.emergencyContactNum;
  const emergencyName = body.emergencyContact?.name ?? body.emergencyName;
  const emergencyRelation = body.emergencyContact?.relationship ?? body.emergencyRelation;

  if (firstName && !isTextOnly(firstName)) errors.push("First name must contain letters and spaces only");
  if (lastName && !isTextOnly(lastName)) errors.push("Last name must contain letters and spaces only");
  if (email && !isValidEmail(email)) errors.push("Email address must be valid");
  if (email && isValidEmail(email) && !hasLetter(email)) errors.push("Email address must contain letters");
  if (contact && !isValidStaffPhoneNumber(contact)) errors.push("Contact number must be exactly 11 digits");
  if (emergencyContact && !isValidStaffPhoneNumber(emergencyContact)) {
    errors.push("Emergency contact number must be exactly 11 digits");
  }
  if (emergencyName && !isTextOnly(emergencyName)) {
    errors.push("Emergency contact name must contain letters and spaces only");
  }
  if (emergencyRelation && !isTextOnly(emergencyRelation)) {
    errors.push("Emergency relationship must contain letters and spaces only");
  }

  if (isCreate && !contact) errors.push("Contact number is required");
  if (isCreate && !emergencyContact) errors.push("Emergency contact number is required");
  if (isCreate && !emergencyName) errors.push("Emergency contact name is required");
  if (isCreate && !emergencyRelation) errors.push("Emergency relationship is required");

  return errors;
};

const getDuplicateStaffMessage = (error) => {
  const duplicateField = Object.keys(error?.keyPattern || error?.keyValue || {})[0];

  if (duplicateField === "email") return "Email already in use";
  if (duplicateField === "employeeId") return "Employee ID already exists";
  if (duplicateField === "phoneNumber") return "Phone number already in use";

  return "Staff account details already exist";
};

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
  const contact = body.contact ?? body.phoneNumber;

  const payload = {
    firstName,
    lastName,
    fullName,
    email: body.email ? String(body.email).trim().toLowerCase() : undefined,
    phoneNumber: contact ? normalizeStaffPhoneNumber(contact) : undefined,
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
      name: String(body.emergencyContact?.name || body.emergencyName || "").trim(),
      relationship: String(body.emergencyContact?.relationship || body.emergencyRelation || "").trim(),
      contact: normalizeStaffPhoneNumber(body.emergencyContact?.contact || body.emergencyContactNum || ""),
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

const findExistingStaffPhone = (phoneNumber, currentUserId = null) => {
  if (!phoneNumber) return null;

  const query = { phoneNumber };
  if (currentUserId) {
    query._id = { $ne: currentUserId };
  }

  return userModel.findOne(query).select("_id");
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

    const fieldErrors = validateStaffFields(req.body, { isCreate: true });
    if (fieldErrors.length) {
      return res.status(400).json({
        success: false,
        message: fieldErrors[0],
      });
    }

    const payload = compactObject(buildStaffPayload(req.body, { isCreate: true }));

    const existingPhone = await findExistingStaffPhone(payload.phoneNumber);
    if (existingPhone) {
      return res.status(409).json({ success: false, message: "Phone number already in use" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

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
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: getDuplicateStaffMessage(error) });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }

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

    const fieldErrors = validateStaffFields(req.body);
    if (fieldErrors.length) {
      return res.status(400).json({
        success: false,
        message: fieldErrors[0],
      });
    }

    if (payload.email && payload.email !== existing.email) {
      const emailExists = await userModel.findOne({ email: payload.email, _id: { $ne: id } }).select("_id");
      if (emailExists) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
    }

    if (payload.phoneNumber) {
      if (!isValidStaffPhoneNumber(payload.phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: "Contact number must be exactly 11 digits",
        });
      }

      const phoneExists = await findExistingStaffPhone(payload.phoneNumber, id);
      if (phoneExists) {
        return res.status(409).json({ success: false, message: "Phone number already in use" });
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
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: getDuplicateStaffMessage(error) });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }

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
    staff.suspensionEndDate = undefined;
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

export const suspendStaff = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const { id } = req.params;
    const { days } = req.body;

    const staff = await userModel.findOne({ _id: id, role: "staff" });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    staff.accountStatus = "Suspended";
    if (days) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + Number(days));
      staff.suspensionEndDate = endDate;
    } else {
      staff.suspensionEndDate = undefined;
    }

    staff.updatedAt = new Date();
    await staff.save();

    const updated = await userModel.findById(id).select(STAFF_FIELDS_TO_EXCLUDE);
    res.status(200).json({
      success: true,
      message: `Staff suspended successfully${days ? ` for ${days} day(s)` : ''}`,
      staff: updated,
    });
  } catch (error) {
    console.error("Suspend Staff Error:", error);
    res.status(500).json({ success: false, message: "Failed to suspend staff account" });
  }
};

export const reactivateStaff = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const { id } = req.params;
    const staff = await userModel.findOne({ _id: id, role: "staff" });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    staff.accountStatus = "Active";
    staff.suspensionEndDate = undefined;
    staff.updatedAt = new Date();
    await staff.save();

    const updated = await userModel.findById(id).select(STAFF_FIELDS_TO_EXCLUDE);
    res.status(200).json({
      success: true,
      message: "Staff reactivated successfully",
      staff: updated,
    });
  } catch (error) {
    console.error("Reactivate Staff Error:", error);
    res.status(500).json({ success: false, message: "Failed to reactivate staff account" });
  }
};

export const resetStaffPassword = async (req, res) => {
  try {
    if (!(await ensureAdminAccess(req, res))) return;

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
    }

    const staff = await userModel.findOne({ _id: id, role: "staff" });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    staff.password = hashedPassword;
    staff.updatedAt = new Date();
    await staff.save();

    res.status(200).json({
      success: true,
      message: "Staff password reset successfully",
    });
  } catch (error) {
    console.error("Reset Staff Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to reset staff password" });
  }
};
