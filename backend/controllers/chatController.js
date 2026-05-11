import mongoose from 'mongoose';
import chatConversationModel from '../models/chatConversationModel.js';
import chatMessageModel from '../models/chatMessageModel.js';
import userModel from '../models/userModel.js';
import bookingModel from '../models/bookingModel.js';
import orderModel from '../models/orderModel.js';

const ADMIN_ID = 'admin';
const SUPPORT_SCOPE = 'support';
const ORDER_SCOPE = 'order';

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const getDisplayName = (user) => {
  if (!user) return 'User';
  if (user.fullName?.trim()) return normalizeText(user.fullName);
  const combined = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (combined) return normalizeText(combined);
  return user.email || 'User';
};

const mapMessageForClient = (messageDoc, requesterId) => {
  const seenBy = Array.isArray(messageDoc.seenBy) ? messageDoc.seenBy : [];
  const isOwn = String(messageDoc.senderId) === String(requesterId);
  const seenByOthers = seenBy.some((entry) => String(entry) !== String(requesterId));

  return {
    id: messageDoc._id,
    _id: messageDoc._id,
    conversationId: messageDoc.conversationId,
    senderRole: messageDoc.senderRole,
    sender:
      messageDoc.senderRole === 'user'
        ? 'client'
        : messageDoc.senderRole === 'staff'
          ? 'staff'
          : messageDoc.senderRole === 'system'
            ? 'system'
            : 'admin',
    senderId: messageDoc.senderId,
    senderName: messageDoc.senderName || '',
    message: messageDoc.message || '',
    type: messageDoc.type || 'text',
    imageUrl: messageDoc.imageUrl || null,
    createdAt: messageDoc.createdAt,
    timestamp: messageDoc.createdAt,
    status: isOwn ? (seenByOthers ? 'read' : 'sent') : 'read',
    isEdited: Boolean(messageDoc.isEdited),
    isDeleted: Boolean(messageDoc.isDeleted),
  };
};

const mapConversationForClient = (conversationDoc, userInfo, unreadCount = 0, staffRole = '') => ({
  id: conversationDoc._id,
  _id: conversationDoc._id,
  scope: conversationDoc.scope || SUPPORT_SCOPE,
  subjectType: conversationDoc.subjectType || null,
  subjectId: conversationDoc.subjectId || null,
  subjectLabel: conversationDoc.subjectLabel || '',
  subjectTitle: conversationDoc.subjectTitle || '',
  assignedStaffId: conversationDoc.assignedStaffId || null,
  assignedStaffName: conversationDoc.assignedStaffName || '',
  assignedStaffRole: staffRole || conversationDoc.assignedStaffRole || '',
  user: userInfo
    ? {
      id: userInfo._id || userInfo.id,
      fullName: getDisplayName(userInfo),
      email: userInfo.email || '',
    }
    : null,
  unreadCount: Number(unreadCount) || 0,
  lastMessagePreview: conversationDoc.lastMessagePreview || '',
  lastMessageAt: conversationDoc.lastMessageAt || conversationDoc.updatedAt || conversationDoc.createdAt,
  isClosed: Boolean(conversationDoc.isClosed),
});

const normalizeMessageType = (type, imageUrl) => {
  const loweredType = String(type || '').toLowerCase();
  if (loweredType === 'system') return 'system';
  if (loweredType === 'image' || imageUrl) return 'image';
  return 'text';
};

const getRequesterContext = async (req, res) => {
  const tokenRole = String(req.userRole || '').toLowerCase();
  if (String(req.userId) === ADMIN_ID || tokenRole === 'admin') {
    return {
      id: ADMIN_ID,
      role: 'admin',
      displayName: 'Administrator',
      userDoc: null,
      userObjectId: null,
    };
  }

  const user = await userModel.findById(req.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return null;
  }

  return {
    id: user._id.toString(),
    role: user.role || tokenRole || 'user',
    displayName: getDisplayName(user),
    userDoc: user,
    userObjectId: user._id,
  };
};

const isAdminOrStaff = (ctx) => ctx.role === 'admin' || ctx.role === 'staff';

const getConversationQueryScope = (scope) => {
  const normalizedScope = String(scope || '').trim().toLowerCase();
  return normalizedScope === ORDER_SCOPE ? ORDER_SCOPE : SUPPORT_SCOPE;
};

const getOrderLabel = (order) => order.orderId || `Order ${String(order._id).slice(-6).toUpperCase()}`;
const getBookingLabel = (booking) =>
  booking.bookingId || `Booking ${String(booking._id).slice(-6).toUpperCase()}`;
const getOrderTitle = (order) => normalizeText(order.item || order.serviceType || 'Order');
const getBookingTitle = (booking) =>
  normalizeText(booking.service || booking.bookingType || 'Booking');

const getConversationSearchBlob = (conversation, userInfo) => {
  return [
    getDisplayName(userInfo),
    userInfo?.email || '',
    conversation.lastMessagePreview || '',
    conversation.subjectLabel || '',
    conversation.subjectTitle || '',
    conversation.assignedStaffName || '',
  ]
    .join(' ')
    .toLowerCase();
};

const findAssignedStaffUser = async (assignedTailor) => {
  const normalizedAssignedTailor = normalizeText(assignedTailor);
  if (!normalizedAssignedTailor) return null;

  if (mongoose.Types.ObjectId.isValid(normalizedAssignedTailor)) {
    const byId = await userModel.findOne({ _id: normalizedAssignedTailor, role: 'staff' });
    if (byId) return byId;
  }

  const byEmployeeId = await userModel.findOne({
    role: 'staff',
    employeeId: normalizedAssignedTailor,
  });
  if (byEmployeeId) return byEmployeeId;

  const staffUsers = await userModel
    .find({ role: 'staff' })
    .select('fullName firstName lastName employeeId email');

  const match = staffUsers.find((staffUser) => {
    const candidates = [
      staffUser._id?.toString(),
      staffUser.employeeId,
      staffUser.fullName,
      `${staffUser.firstName || ''} ${staffUser.lastName || ''}`,
      staffUser.email,
    ]
      .map((value) => normalizeKey(value))
      .filter(Boolean);

    return candidates.includes(normalizeKey(normalizedAssignedTailor));
  });

  return match || null;
};

const getSubjectDetails = async (subjectType, subjectId, res) => {
  const normalizedType = String(subjectType || '').trim().toLowerCase();
  if (!['booking', 'order'].includes(normalizedType)) {
    res.status(400).json({ success: false, message: 'subjectType must be booking or order' });
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    res.status(400).json({ success: false, message: 'Invalid subjectId' });
    return null;
  }

  if (normalizedType === 'booking') {
    const booking = await bookingModel.findById(subjectId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return null;
    }

    return {
      scope: ORDER_SCOPE,
      subjectType: normalizedType,
      subjectId: booking._id,
      userId: booking.userId,
      assignedTailor: booking.assignedTailor || '',
      subjectLabel: getBookingLabel(booking),
      subjectTitle: getBookingTitle(booking),
      sourceDoc: booking,
    };
  }

  const order = await orderModel.findById(subjectId);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return null;
  }

  return {
    scope: ORDER_SCOPE,
    subjectType: normalizedType,
    subjectId: order._id,
    userId: order.userId,
    assignedTailor: order.assignedTailor || '',
    subjectLabel: getOrderLabel(order),
    subjectTitle: getOrderTitle(order),
    sourceDoc: order,
  };
};

const canAccessSubjectConversation = (ctx, subjectDetails, staffUser) => {
  if (ctx.role === 'admin') return false;

  if (ctx.role === 'staff') {
    if (staffUser?._id && String(staffUser._id) === String(ctx.id)) return true;
    return normalizeKey(subjectDetails.assignedTailor) === normalizeKey(ctx.displayName);
  }

  return String(subjectDetails.userId) === String(ctx.userObjectId);
};

const syncConversationMetadata = async (conversation, metadata) => {
  if (!conversation) return null;

  const nextAssignedStaffId = metadata.assignedStaffId || null;
  const nextAssignedStaffName = metadata.assignedStaffName || metadata.assignedTailor || '';
  const nextAssignedStaffRole = metadata.assignedStaffRole || '';
  const nextSubjectLabel = metadata.subjectLabel || '';
  const nextSubjectTitle = metadata.subjectTitle || '';
  let shouldSave = false;

  if ((conversation.scope || SUPPORT_SCOPE) !== metadata.scope) {
    conversation.scope = metadata.scope;
    shouldSave = true;
  }
  if (String(conversation.assignedStaffId || '') !== String(nextAssignedStaffId || '')) {
    conversation.assignedStaffId = nextAssignedStaffId;
    shouldSave = true;
  }
  if ((conversation.assignedStaffName || '') !== nextAssignedStaffName) {
    conversation.assignedStaffName = nextAssignedStaffName;
    shouldSave = true;
  }
  if ((conversation.assignedStaffRole || '') !== nextAssignedStaffRole) {
    conversation.assignedStaffRole = nextAssignedStaffRole;
    shouldSave = true;
  }
  if ((conversation.subjectType || null) !== (metadata.subjectType || null)) {
    conversation.subjectType = metadata.subjectType || null;
    shouldSave = true;
  }
  if (String(conversation.subjectId || '') !== String(metadata.subjectId || '')) {
    conversation.subjectId = metadata.subjectId || null;
    shouldSave = true;
  }
  if ((conversation.subjectLabel || '') !== nextSubjectLabel) {
    conversation.subjectLabel = nextSubjectLabel;
    shouldSave = true;
  }
  if ((conversation.subjectTitle || '') !== nextSubjectTitle) {
    conversation.subjectTitle = nextSubjectTitle;
    shouldSave = true;
  }
  if (conversation.isClosed) {
    conversation.isClosed = false;
    shouldSave = true;
  }

  if (shouldSave) {
    await conversation.save();
  }

  return conversation;
};

const getOrCreateSupportConversation = async (userObjectId) => {
  if (!userObjectId) return null;

  let conversation = await chatConversationModel.findOne({
    userId: userObjectId,
    $or: [{ scope: SUPPORT_SCOPE }, { scope: { $exists: false } }],
  });

  if (conversation) {
    if (!conversation.scope) {
      conversation.scope = SUPPORT_SCOPE;
      await conversation.save();
    }
    return conversation;
  }

  try {
    conversation = await chatConversationModel.create({
      userId: userObjectId,
      scope: SUPPORT_SCOPE,
    });
    return conversation;
  } catch (error) {
    if (error?.code === 11000) {
      return chatConversationModel.findOne({
        userId: userObjectId,
        $or: [{ scope: SUPPORT_SCOPE }, { scope: { $exists: false } }],
      });
    }
    throw error;
  }
};

const getOrCreateOrderConversation = async (subjectDetails, staffUser) => {
  const metadata = {
    scope: ORDER_SCOPE,
    subjectType: subjectDetails.subjectType,
    subjectId: subjectDetails.subjectId,
    subjectLabel: subjectDetails.subjectLabel,
    subjectTitle: subjectDetails.subjectTitle,
    assignedStaffId: staffUser?._id?.toString() || null,
    assignedStaffName: staffUser ? getDisplayName(staffUser) : normalizeText(subjectDetails.assignedTailor),
    assignedStaffRole: 'Tailor',
    assignedTailor: subjectDetails.assignedTailor,
  };

  let conversation = await chatConversationModel.findOne({
    userId: subjectDetails.userId,
    scope: ORDER_SCOPE,
    assignedStaffId: metadata.assignedStaffId,
  });

  if (conversation) {
    if (String(conversation.subjectId || '') !== String(metadata.subjectId || '')) {
      await chatMessageModel.create({
        conversationId: conversation._id,
        senderId: 'system',
        senderRole: 'system',
        senderName: 'JJS Track',
        type: 'system',
        message: `This chat is now also linked to ${metadata.subjectLabel} (${metadata.subjectTitle}).`,
        seenBy: [String(subjectDetails.userId), metadata.assignedStaffId, ADMIN_ID].filter(Boolean),
      });
    }
    return syncConversationMetadata(conversation, metadata);
  }

  try {
    conversation = await chatConversationModel.create({
      userId: subjectDetails.userId,
      scope: ORDER_SCOPE,
      subjectType: metadata.subjectType,
      subjectId: metadata.subjectId,
      subjectLabel: metadata.subjectLabel,
      subjectTitle: metadata.subjectTitle,
      assignedStaffId: metadata.assignedStaffId,
      assignedStaffName: metadata.assignedStaffName,
      assignedStaffRole: metadata.assignedStaffRole,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    conversation = await chatConversationModel.findOne({
      userId: subjectDetails.userId,
      scope: ORDER_SCOPE,
      subjectType: metadata.subjectType,
      subjectId: metadata.subjectId,
      assignedStaffId: metadata.assignedStaffId,
    });
  }

  if (!conversation) return null;

  conversation = await syncConversationMetadata(conversation, metadata);

  const hasMessages = await chatMessageModel.exists({ conversationId: conversation._id });
  if (!hasMessages) {
    await chatMessageModel.create({
      conversationId: conversation._id,
      senderId: 'system',
      senderRole: 'system',
      senderName: 'JJS Track',
      type: 'system',
      message: `This is the start of your conversation with ${metadata.assignedStaffName || 'your assigned team member'}.`,
      seenBy: [String(subjectDetails.userId), metadata.assignedStaffId, ADMIN_ID].filter(Boolean),
    });
  }

  return conversation;
};

const canAccessConversation = (ctx, conversation) => {
  if (!conversation) return false;
  if (ctx.role === 'admin') {
    return true;
  }

  if (ctx.role === 'staff') {
    if ((conversation.scope || SUPPORT_SCOPE) === SUPPORT_SCOPE) {
      return String(conversation.userId?._id || conversation.userId) === String(ctx.userObjectId);
    }
    if ((conversation.scope || SUPPORT_SCOPE) !== ORDER_SCOPE) return false;
    if (String(conversation.assignedStaffId || '') === String(ctx.id)) return true;
    return normalizeKey(conversation.assignedStaffName) === normalizeKey(ctx.displayName);
  }

  return String(conversation.userId?._id || conversation.userId) === String(ctx.userObjectId);
};

const getConversationForRequest = async (ctx, req, res) => {
  const conversationId = req.query.conversationId || req.body.conversationId;

  if (conversationId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ success: false, message: 'Invalid conversationId' });
      return null;
    }

    const conversation = await chatConversationModel
      .findById(conversationId)
      .populate('userId', 'fullName firstName lastName email');

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return null;
    }

    if (!canAccessConversation(ctx, conversation)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return null;
    }

    return conversation;
  }

  if (isAdminOrStaff(ctx)) {
    res.status(400).json({ success: false, message: 'conversationId is required' });
    return null;
  }

  const scope = getConversationQueryScope(req.query.scope || req.body.scope);
  if (scope === SUPPORT_SCOPE) {
    const conversation = await getOrCreateSupportConversation(ctx.userObjectId);
    if (!conversation) {
      res.status(500).json({ success: false, message: 'Failed to open conversation' });
      return null;
    }
    return conversation;
  }

  res.status(400).json({ success: false, message: 'conversationId is required for order chats' });
  return null;
};

export const getOrCreateOrderConversationForSubject = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const subjectType = req.body.subjectType || req.query.subjectType;
    const subjectId = req.body.subjectId || req.query.subjectId;
    const subjectDetails = await getSubjectDetails(subjectType, subjectId, res);
    if (!subjectDetails) return;

    const targetStaffName = req.body.targetStaffName || subjectDetails.assignedTailor;
    const staffUser = await findAssignedStaffUser(targetStaffName);
    if (!targetStaffName || !staffUser) {
      res.status(400).json({
        success: false,
        message: 'This order does not have this staff member assigned yet.',
      });
      return;
    }

    const effectiveSubjectDetails = { ...subjectDetails, assignedTailor: targetStaffName };

    if (!canAccessSubjectConversation(ctx, effectiveSubjectDetails, staffUser)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const conversation = await getOrCreateOrderConversation(effectiveSubjectDetails, staffUser);
    if (!conversation) {
      res.status(500).json({ success: false, message: 'Failed to open order conversation' });
      return;
    }

    const populatedConversation = await chatConversationModel
      .findById(conversation._id)
      .populate('userId', 'fullName firstName lastName email');

    const conversationUserInfo = ctx.role === 'user' ? ctx.userDoc : populatedConversation.userId;
    const staffUserForRole = await findAssignedStaffUser(populatedConversation.assignedStaffId || populatedConversation.assignedStaffName);

    res.json({
      success: true,
      conversation: mapConversationForClient(populatedConversation, conversationUserInfo, 0, staffUserForRole?.position || ''),
    });
  } catch (error) {
    console.error('Get Or Create Order Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to open order conversation' });
  }
};

export const getOrCreateSupportConversationForTargetUser = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    if (ctx.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only admin can open support conversations for other users.' });
      return;
    }

    const targetUserId = req.body.targetUserId || req.query.targetUserId;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({ success: false, message: 'Invalid targetUserId' });
      return;
    }

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'Target user not found' });
      return;
    }

    const conversation = await getOrCreateSupportConversation(targetUser._id);
    if (!conversation) {
      res.status(500).json({ success: false, message: 'Failed to open conversation' });
      return;
    }

    const populatedConversation = await chatConversationModel
      .findById(conversation._id)
      .populate('userId', 'fullName firstName lastName email role employeeId');

    res.json({
      success: true,
      conversation: mapConversationForClient(populatedConversation, populatedConversation.userId, 0),
    });
  } catch (error) {
    console.error('Get Or Create Support Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to open support conversation' });
  }
};

export const listConversations = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const search = String(req.query.search || '').trim().toLowerCase();
    const filter = String(req.query.filter || '').trim().toLowerCase();
    const unreadOnly = filter === 'unread';
    const requestedScope = String(req.query.scope || '').trim().toLowerCase();

    if (ctx.role === 'admin') {
      const query = {};
      if (requestedScope === SUPPORT_SCOPE) {
        query.$or = [{ scope: SUPPORT_SCOPE }, { scope: { $exists: false } }];
      } else if (requestedScope === ORDER_SCOPE) {
        query.scope = ORDER_SCOPE;
      }

      const rawConversations = await chatConversationModel
        .find(query)
        .populate('userId', 'fullName firstName lastName email')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

      const finalConvs = [];
      const seenKeys = new Set();
      await Promise.all(
        rawConversations.map(async (conversation) => {
          const unreadCount = await chatMessageModel.countDocuments({
            conversationId: conversation._id,
            senderRole: { $ne: 'admin' },
            seenBy: { $ne: ctx.id },
          });

          const userInfo = conversation.userId;
          const searchable = getConversationSearchBlob(conversation, userInfo);

          if (search && !searchable.includes(search)) return null;
          if (unreadOnly && unreadCount <= 0) return null;

          const convObj = mapConversationForClient(conversation, userInfo, unreadCount);
          const key = `${convObj.scope}-${convObj.user?.id}-${convObj.assignedStaffId || 'none'}`;

          if (seenKeys.has(key)) {
            const existing = finalConvs.find(c => `${c.scope}-${c.user?.id}-${c.assignedStaffId || 'none'}` === key);
            if (existing) {
              existing.unreadCount += convObj.unreadCount;
              if (new Date(convObj.lastMessageAt) > new Date(existing.lastMessageAt)) {
                existing.lastMessageAt = convObj.lastMessageAt;
                existing.lastMessagePreview = convObj.lastMessagePreview;
                existing.id = convObj.id;
                existing._id = convObj._id;
              }
            }
            return;
          }

          seenKeys.add(key);
          finalConvs.push(convObj);
        })
      );

      res.json({ success: true, conversations: finalConvs });
      return;
    }

    if (ctx.role === 'staff') {
      const conversations = [];

      if (requestedScope !== ORDER_SCOPE) {
        const supportConversation = await getOrCreateSupportConversation(ctx.userObjectId);
        if (supportConversation) {
          const unreadCount = await chatMessageModel.countDocuments({
            conversationId: supportConversation._id,
            senderRole: 'admin',
            seenBy: { $ne: ctx.id },
          });

          const searchable = getConversationSearchBlob(supportConversation, ctx.userDoc);
          if ((!search || searchable.includes(search)) && (!unreadOnly || unreadCount > 0)) {
            conversations.push(mapConversationForClient(supportConversation, ctx.userDoc, unreadCount));
          }
        }
      }

      if (requestedScope !== SUPPORT_SCOPE) {
        const rawConversations = await chatConversationModel
          .find({
            scope: ORDER_SCOPE,
            assignedStaffId: ctx.id,
          })
          .populate('userId', 'fullName firstName lastName email')
          .sort({ lastMessageAt: -1, updatedAt: -1 })
          .lean();

        const finalOrderConvs = [];
        const seenOrderKeys = new Set();
        const mapped = await Promise.all(
          rawConversations.map(async (conversation) => {
            const unreadCount = await chatMessageModel.countDocuments({
              conversationId: conversation._id,
              senderRole: 'user',
              seenBy: { $ne: ctx.id },
            });

            const userInfo = conversation.userId;
            const searchable = getConversationSearchBlob(conversation, userInfo);

            if (search && !searchable.includes(search)) return null;
            if (unreadOnly && unreadCount <= 0) return null;

            const convObj = mapConversationForClient(conversation, userInfo, unreadCount);
            const key = `order-${convObj.user?.id}-${convObj.assignedStaffId || 'none'}`;

            if (seenOrderKeys.has(key)) {
              const existing = finalOrderConvs.find(c => `order-${c.user?.id}-${c.assignedStaffId || 'none'}` === key);
              if (existing) {
                existing.unreadCount += convObj.unreadCount;
                if (new Date(convObj.lastMessageAt) > new Date(existing.lastMessageAt)) {
                  existing.lastMessageAt = convObj.lastMessageAt;
                  existing.lastMessagePreview = convObj.lastMessagePreview;
                  existing.id = convObj.id;
                  existing._id = convObj._id;
                }
              }
              return null;
            }

            seenOrderKeys.add(key);
            finalOrderConvs.push(convObj);
            return convObj;
          })
        );

        conversations.push(...finalOrderConvs);
      }

      conversations.sort((first, second) => {
        if ((first.scope || SUPPORT_SCOPE) !== (second.scope || SUPPORT_SCOPE)) {
          return (first.scope || SUPPORT_SCOPE) === SUPPORT_SCOPE ? -1 : 1;
        }

        const firstTime = new Date(first?.lastMessageAt || 0).getTime();
        const secondTime = new Date(second?.lastMessageAt || 0).getTime();
        return secondTime - firstTime;
      });

      res.json({ success: true, conversations });
      return;
    }

    const includeSupportConversation = requestedScope !== ORDER_SCOPE;
    const includeOrderConversations = requestedScope !== SUPPORT_SCOPE;
    const conversations = [];

    if (includeSupportConversation) {
      const supportConversation = await getOrCreateSupportConversation(ctx.userObjectId);
      if (!supportConversation) {
        res.status(500).json({ success: false, message: 'Failed to load conversation' });
        return;
      }

      const unreadCount = await chatMessageModel.countDocuments({
        conversationId: supportConversation._id,
        senderRole: { $in: ['admin', 'staff'] },
        seenBy: { $ne: ctx.id },
      });

      const searchable = getConversationSearchBlob(supportConversation, ctx.userDoc);
      if ((!search || searchable.includes(search)) && (!unreadOnly || unreadCount > 0)) {
        conversations.push(mapConversationForClient(supportConversation, ctx.userDoc, unreadCount));
      }
    }

    if (includeOrderConversations) {
      const rawConversations = await chatConversationModel
        .find({
          userId: ctx.userObjectId,
          scope: ORDER_SCOPE,
        })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

      const finalOrderConvs = [];
      const seenOrderKeys = new Set();
      await Promise.all(
        rawConversations.map(async (conversation) => {
          const unreadCount = await chatMessageModel.countDocuments({
            conversationId: conversation._id,
            senderRole: { $in: ['admin', 'staff'] },
            seenBy: { $ne: ctx.id },
          });

          const staffUser = await findAssignedStaffUser(conversation.assignedStaffId || conversation.assignedStaffName);
          const searchable = getConversationSearchBlob(conversation, ctx.userDoc);
          if (search && !searchable.includes(search)) return null;
          if (unreadOnly && unreadCount <= 0) return null;

          const convObj = mapConversationForClient(conversation, ctx.userDoc, unreadCount, staffUser?.position || '');
          const key = `order-${convObj.user?.id}-${convObj.assignedStaffId || 'none'}`;

          if (seenOrderKeys.has(key)) {
            const existing = finalOrderConvs.find(c => `order-${c.user?.id}-${c.assignedStaffId || 'none'}` === key);
            if (existing) {
              existing.unreadCount += convObj.unreadCount;
              if (new Date(convObj.lastMessageAt) > new Date(existing.lastMessageAt)) {
                existing.lastMessageAt = convObj.lastMessageAt;
                existing.lastMessagePreview = convObj.lastMessagePreview;
                existing.id = convObj.id;
                existing._id = convObj._id;
              }
            }
            return;
          }

          seenOrderKeys.add(key);
          finalOrderConvs.push(convObj);
        })
      );

      conversations.push(...finalOrderConvs);
    }

    conversations.sort((first, second) => {
      const firstTime = new Date(first?.lastMessageAt || 0).getTime();
      const secondTime = new Date(second?.lastMessageAt || 0).getTime();
      return secondTime - firstTime;
    });

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('List Conversations Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const conversation = await getConversationForRequest(ctx, req, res);
    if (!conversation) return;

    await chatMessageModel.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: ctx.id },
        seenBy: { $ne: ctx.id },
      },
      { $addToSet: { seenBy: ctx.id } }
    );

    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 200)));
    const newestFirst = await chatMessageModel
      .find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const messages = newestFirst
      .reverse()
      .filter((messageDoc) => {
        const df = Array.isArray(messageDoc.deletedFor) ? messageDoc.deletedFor : [];
        return !df.some((uid) => String(uid) === String(ctx.id));
      })
      .map((messageDoc) => mapMessageForClient(messageDoc, ctx.id));

    const conversationUserInfo = isAdminOrStaff(ctx) ? conversation.userId : ctx.userDoc;
    const staffUserForRole = await findAssignedStaffUser(conversation.assignedStaffId || conversation.assignedStaffName);

    res.json({
      success: true,
      conversation: mapConversationForClient(conversation, conversationUserInfo, 0, staffUserForRole?.position || ''),
      messages,
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const rawMessage = typeof req.body.message === 'string' ? req.body.message : '';
    const cleanMessage = rawMessage.trim();
    const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
    const type = normalizeMessageType(req.body.type, imageUrl);

    if (!cleanMessage && !imageUrl) {
      res.status(400).json({ success: false, message: 'Message or image is required' });
      return;
    }

    const conversation = await getConversationForRequest(ctx, req, res);
    if (!conversation) return;

    const senderRole = ctx.role === 'admin' ? 'admin' : ctx.role === 'staff' ? 'staff' : 'user';
    const messageDoc = await chatMessageModel.create({
      conversationId: conversation._id,
      senderId: ctx.id,
      senderRole,
      senderName: ctx.displayName,
      type,
      message: cleanMessage,
      imageUrl,
      seenBy: [ctx.id],
    });

    const preview = cleanMessage || (type === 'image' ? '[Image]' : '[Message]');
    const updatePayload = {
      lastMessageAt: messageDoc.createdAt,
      lastMessagePreview: preview,
    };

    if (ctx.role === 'admin') {
      updatePayload.assignedAdminId = ctx.id;
    }

    await chatConversationModel.findByIdAndUpdate(conversation._id, updatePayload);

    const reloaded = await chatMessageModel.findById(messageDoc._id).lean();

    res.status(201).json({
      success: true,
      message: 'Message sent',
      chatMessage: mapMessageForClient(reloaded, ctx.id),
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const conversation = await getConversationForRequest(ctx, req, res);
    if (!conversation) return;

    const result = await chatMessageModel.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: ctx.id },
        seenBy: { $ne: ctx.id },
      },
      { $addToSet: { seenBy: ctx.id } }
    );

    res.json({
      success: true,
      markedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error('Mark Conversation Read Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
};

// ─── Edit Message ────────────────────────────────────────────────────────────
export const editMessage = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const { messageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Invalid messageId' });
    }

    const rawMessage = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!rawMessage) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const messageDoc = await chatMessageModel.findById(messageId);
    if (!messageDoc) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only the original sender may edit
    if (String(messageDoc.senderId) !== String(ctx.id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    // System messages cannot be edited
    if (messageDoc.senderRole === 'system') {
      return res.status(403).json({ success: false, message: 'System messages cannot be edited' });
    }

    messageDoc.message = rawMessage;
    messageDoc.isEdited = true;
    await messageDoc.save();

    const reloaded = await chatMessageModel.findById(messageDoc._id).lean();
    res.json({
      success: true,
      message: 'Message updated',
      chatMessage: mapMessageForClient(reloaded, ctx.id),
    });
  } catch (error) {
    console.error('Edit Message Error:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
};

// ─── Delete for Everyone ─────────────────────────────────────────────────────
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const { messageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Invalid messageId' });
    }

    const messageDoc = await chatMessageModel.findById(messageId);
    if (!messageDoc) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only the original sender may delete for everyone
    if (String(messageDoc.senderId) !== String(ctx.id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    // System messages cannot be deleted this way
    if (messageDoc.senderRole === 'system') {
      return res.status(403).json({ success: false, message: 'System messages cannot be deleted' });
    }

    const conversationId = messageDoc.conversationId;
    const originalCreatedAt = messageDoc.createdAt;
    const seenBy = messageDoc.seenBy;
    const senderId = messageDoc.senderId;
    const senderRole = messageDoc.senderRole;
    const senderName = messageDoc.senderName;

    // Hard-delete the original message
    await chatMessageModel.findByIdAndDelete(messageId);

    // Insert a system tombstone in its place but preserving the sender context
    const tombstone = await chatMessageModel.create({
      conversationId,
      senderId,
      senderRole,
      senderName,
      type: 'text',
      message: 'This message was deleted',
      seenBy,
      isDeleted: true,
      createdAt: originalCreatedAt
    });
    const conversation = await chatConversationModel.findById(conversationId);
    if (conversation) {
      await chatConversationModel.findByIdAndUpdate(conversationId, {
        lastMessagePreview: 'This message has been deleted',
        lastMessageAt: tombstone.createdAt,
      });
    }

    const reloaded = await chatMessageModel.findById(tombstone._id).lean();
    res.json({
      success: true,
      message: 'Message deleted for everyone',
      chatMessage: mapMessageForClient(reloaded, ctx.id),
    });
  } catch (error) {
    console.error('Delete For Everyone Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};
export const deleteMessageForMe = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const { messageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Invalid messageId' });
    }

    const messageDoc = await chatMessageModel.findById(messageId);
    if (!messageDoc) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    await chatMessageModel.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: ctx.id },
    });

    res.json({ success: true, message: 'Message hidden for you' });
  } catch (error) {
    console.error('Delete For Me Error:', error);
    res.status(500).json({ success: false, message: 'Failed to hide message' });
  }
};
