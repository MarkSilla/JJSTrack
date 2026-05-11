import mongoose from 'mongoose';
import chatConversationModel from '../models/chatConversationModel.js';
import chatMessageModel from '../models/chatMessageModel.js';
import userModel from '../models/userModel.js';

const ADMIN_ID = 'admin';
const ORDER_SCOPE = 'order';

const ASSIGNMENT_ROLE_LABELS = {
  layoutArtist: 'Layout Artist',
  presser: 'Presser',
  tailor: 'Tailor',
};

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const getDisplayName = (user) => {
  if (!user) return 'User';
  if (user.fullName?.trim()) return normalizeText(user.fullName);
  const combined = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (combined) return normalizeText(combined);
  return user.email || 'User';
};

const getOrderLabel = (order) => order.orderId || `Order ${String(order._id).slice(-6).toUpperCase()}`;
const getBookingLabel = (booking) => booking.bookingId || `Booking ${String(booking._id).slice(-6).toUpperCase()}`;
const getOrderTitle = (order) => normalizeText(order.item || order.serviceType || 'Order');
const getBookingTitle = (booking) => normalizeText(booking.service || booking.bookingType || 'Booking');

const getSubjectMetadata = ({ subjectType, subjectDoc }) => {
  const normalizedType = String(subjectType || '').trim().toLowerCase();
  if (!subjectDoc?._id || !subjectDoc?.userId) return null;

  if (normalizedType === 'booking') {
    return {
      scope: ORDER_SCOPE,
      subjectType: 'booking',
      subjectId: subjectDoc._id,
      userId: subjectDoc.userId,
      subjectLabel: getBookingLabel(subjectDoc),
      subjectTitle: getBookingTitle(subjectDoc),
    };
  }

  return {
    scope: ORDER_SCOPE,
    subjectType: 'order',
    subjectId: subjectDoc._id,
    userId: subjectDoc.userId,
    subjectLabel: getOrderLabel(subjectDoc),
    subjectTitle: getOrderTitle(subjectDoc),
  };
};

const findAssignedStaffUser = async (assignedStaff) => {
  const normalizedAssignedStaff = normalizeText(assignedStaff);
  if (!normalizedAssignedStaff) return null;

  if (mongoose.Types.ObjectId.isValid(normalizedAssignedStaff)) {
    const byId = await userModel.findOne({ _id: normalizedAssignedStaff, role: 'staff' });
    if (byId) return byId;
  }

  const byEmployeeId = await userModel.findOne({
    role: 'staff',
    employeeId: normalizedAssignedStaff,
  });
  if (byEmployeeId) return byEmployeeId;

  const staffUsers = await userModel
    .find({ role: 'staff' })
    .select('fullName firstName lastName employeeId email');

  return (
    staffUsers.find((staffUser) => {
      const candidates = [
        staffUser._id?.toString(),
        staffUser.employeeId,
        staffUser.fullName,
        `${staffUser.firstName || ''} ${staffUser.lastName || ''}`,
        staffUser.email,
      ]
        .map((value) => normalizeKey(value))
        .filter(Boolean);

      return candidates.includes(normalizeKey(normalizedAssignedStaff));
    }) || null
  );
};

const getAssignedStaffEntries = (subjectDoc = {}) => {
  const assignments = {
    layoutArtist: normalizeText(subjectDoc?.staffAssignments?.layoutArtist),
    presser: normalizeText(subjectDoc?.staffAssignments?.presser),
    tailor: normalizeText(subjectDoc?.staffAssignments?.tailor || subjectDoc?.assignedTailor),
  };

  const groupedByStaff = new Map();

  Object.entries(assignments).forEach(([roleKey, staffName]) => {
    if (!staffName) return;

    const mapKey = normalizeKey(staffName);
    if (!mapKey) return;

    const currentEntry = groupedByStaff.get(mapKey) || {
      rawStaffName: staffName,
      roleKeys: [],
    };

    if (!currentEntry.roleKeys.includes(roleKey)) {
      currentEntry.roleKeys.push(roleKey);
    }

    groupedByStaff.set(mapKey, currentEntry);
  });

  return Array.from(groupedByStaff.values()).map((entry) => ({
    assignedStaffName: entry.rawStaffName,
    assignedStaffRole: entry.roleKeys
      .map((roleKey) => ASSIGNMENT_ROLE_LABELS[roleKey] || roleKey)
      .join(' / '),
  }));
};

const ensureConversationForAssignedStaff = async (subjectMetadata, assignedStaffEntry) => {
  const staffUser = await findAssignedStaffUser(assignedStaffEntry.assignedStaffName);
  if (!staffUser?._id) return null;

  const metadata = {
    ...subjectMetadata,
    assignedStaffId: staffUser._id.toString(),
    assignedStaffName: getDisplayName(staffUser),
    assignedStaffRole: assignedStaffEntry.assignedStaffRole || '',
  };

  let conversation = await chatConversationModel.findOne({
    userId: metadata.userId,
    scope: ORDER_SCOPE,
    subjectType: metadata.subjectType,
    subjectId: metadata.subjectId,
    assignedStaffId: metadata.assignedStaffId,
  });

  if (!conversation) {
    try {
      conversation = await chatConversationModel.create(metadata);
    } catch (error) {
      if (error?.code !== 11000) throw error;
      conversation = await chatConversationModel.findOne({
        userId: metadata.userId,
        scope: ORDER_SCOPE,
        subjectType: metadata.subjectType,
        subjectId: metadata.subjectId,
        assignedStaffId: metadata.assignedStaffId,
      });
    }
  }

  if (!conversation) return null;

  conversation.scope = metadata.scope;
  conversation.subjectType = metadata.subjectType;
  conversation.subjectId = metadata.subjectId;
  conversation.subjectLabel = metadata.subjectLabel;
  conversation.subjectTitle = metadata.subjectTitle;
  conversation.assignedStaffId = metadata.assignedStaffId;
  conversation.assignedStaffName = metadata.assignedStaffName;
  conversation.assignedStaffRole = metadata.assignedStaffRole;
  conversation.isClosed = false;
  await conversation.save();

  const hasMessages = await chatMessageModel.exists({ conversationId: conversation._id });
  if (!hasMessages) {
    await chatMessageModel.create({
      conversationId: conversation._id,
      senderId: 'system',
      senderRole: 'system',
      senderName: 'JJS Track',
      type: 'system',
      message: `This is the start of your conversation with ${metadata.assignedStaffName || 'your assigned team member'}.`,
      seenBy: [String(subjectMetadata.userId), metadata.assignedStaffId, ADMIN_ID].filter(Boolean),
    });
  }

  return conversation;
};

export const syncSubjectChatConversations = async ({ subjectType, subjectDoc }) => {
  const subjectMetadata = getSubjectMetadata({ subjectType, subjectDoc });
  if (!subjectMetadata) return [];

  const assignedStaffEntries = getAssignedStaffEntries(subjectDoc);
  if (assignedStaffEntries.length === 0) return [];

  const conversations = [];
  for (const assignedStaffEntry of assignedStaffEntries) {
    const conversation = await ensureConversationForAssignedStaff(subjectMetadata, assignedStaffEntry);
    if (conversation) {
      conversations.push(conversation);
    }
  }

  return conversations;
};
