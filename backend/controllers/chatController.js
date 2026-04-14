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
  };
};

const mapConversationForClient = (conversationDoc, userInfo, unreadCount = 0) => ({
  id: conversationDoc._id,
  _id: conversationDoc._id,
  scope: conversationDoc.scope || SUPPORT_SCOPE,
  subjectType: conversationDoc.subjectType || null,
  subjectId: conversationDoc.subjectId || null,
  subjectLabel: conversationDoc.subjectLabel || '',
  subjectTitle: conversationDoc.subjectTitle || '',
  assignedStaffId: conversationDoc.assignedStaffId || null,
  assignedStaffName: conversationDoc.assignedStaffName || '',
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
const getBookingLabel = (booking) => `Booking ${String(booking._id).slice(-6).toUpperCase()}`;
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
  const nextSubjectLabel = metadata.subjectLabel || '';
  const nextSubjectTitle = metadata.subjectTitle || '';
  let shouldSave = false;

  if ((conversation.scope || SUPPORT_SCOPE) !== metadata.scope) {
    conversation.scope = metadata.scope;
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
  if (String(conversation.assignedStaffId || '') !== String(nextAssignedStaffId || '')) {
    conversation.assignedStaffId = nextAssignedStaffId;
    shouldSave = true;
  }
  if ((conversation.assignedStaffName || '') !== nextAssignedStaffName) {
    conversation.assignedStaffName = nextAssignedStaffName;
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
    assignedTailor: subjectDetails.assignedTailor,
  };

  let conversation = await chatConversationModel.findOne({
    userId: subjectDetails.userId,
    scope: ORDER_SCOPE,
    subjectType: subjectDetails.subjectType,
    subjectId: subjectDetails.subjectId,
  });

  if (conversation) {
    return syncConversationMetadata(conversation, metadata);
  }

  try {
    conversation = await chatConversationModel.create({
      userId: subjectDetails.userId,
      scope: ORDER_SCOPE,
      subjectType: subjectDetails.subjectType,
      subjectId: subjectDetails.subjectId,
      subjectLabel: metadata.subjectLabel,
      subjectTitle: metadata.subjectTitle,
      assignedStaffId: metadata.assignedStaffId,
      assignedStaffName: metadata.assignedStaffName,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    conversation = await chatConversationModel.findOne({
      userId: subjectDetails.userId,
      scope: ORDER_SCOPE,
      subjectType: subjectDetails.subjectType,
      subjectId: subjectDetails.subjectId,
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
      message: `This chat is linked to ${metadata.subjectTitle} (${metadata.subjectLabel}) with ${metadata.assignedStaffName || 'your assigned tailor'}.`,
      seenBy: [String(subjectDetails.userId), metadata.assignedStaffId, ADMIN_ID].filter(Boolean),
    });
  }

  return conversation;
};

const canAccessConversation = (ctx, conversation) => {
  if (!conversation) return false;
  if (ctx.role === 'admin') {
    return (conversation.scope || SUPPORT_SCOPE) === SUPPORT_SCOPE;
  }

  if (ctx.role === 'staff') {
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

    const staffUser = await findAssignedStaffUser(subjectDetails.assignedTailor);
    if (!subjectDetails.assignedTailor || !staffUser) {
      res.status(400).json({
        success: false,
        message: 'This order does not have an assigned tailor yet.',
      });
      return;
    }

    if (!canAccessSubjectConversation(ctx, subjectDetails, staffUser)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const conversation = await getOrCreateOrderConversation(subjectDetails, staffUser);
    if (!conversation) {
      res.status(500).json({ success: false, message: 'Failed to open order conversation' });
      return;
    }

    const populatedConversation = await chatConversationModel
      .findById(conversation._id)
      .populate('userId', 'fullName firstName lastName email');

    const conversationUserInfo = ctx.role === 'user' ? ctx.userDoc : populatedConversation.userId;

    res.json({
      success: true,
      conversation: mapConversationForClient(populatedConversation, conversationUserInfo, 0),
    });
  } catch (error) {
    console.error('Get Or Create Order Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to open order conversation' });
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
      const query = {
        $or: [{ scope: SUPPORT_SCOPE }, { scope: { $exists: false } }],
      };

      const rawConversations = await chatConversationModel
        .find(query)
        .populate('userId', 'fullName firstName lastName email')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

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

          return mapConversationForClient(conversation, userInfo, unreadCount);
        })
      );

      res.json({ success: true, conversations: mapped.filter(Boolean) });
      return;
    }

    if (ctx.role === 'staff') {
      const rawConversations = await chatConversationModel
        .find({
          scope: ORDER_SCOPE,
          assignedStaffId: ctx.id,
        })
        .populate('userId', 'fullName firstName lastName email')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

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

          return mapConversationForClient(conversation, userInfo, unreadCount);
        })
      );

      res.json({ success: true, conversations: mapped.filter(Boolean) });
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

      const mapped = await Promise.all(
        rawConversations.map(async (conversation) => {
          const unreadCount = await chatMessageModel.countDocuments({
            conversationId: conversation._id,
            senderRole: { $in: ['admin', 'staff'] },
            seenBy: { $ne: ctx.id },
          });

          const searchable = getConversationSearchBlob(conversation, ctx.userDoc);
          if (search && !searchable.includes(search)) return null;
          if (unreadOnly && unreadCount <= 0) return null;

          return mapConversationForClient(conversation, ctx.userDoc, unreadCount);
        })
      );

      conversations.push(...mapped.filter(Boolean));
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
      .map((messageDoc) => mapMessageForClient(messageDoc, ctx.id));

    const conversationUserInfo = isAdminOrStaff(ctx) ? conversation.userId : ctx.userDoc;

    res.json({
      success: true,
      conversation: mapConversationForClient(conversation, conversationUserInfo, 0),
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
