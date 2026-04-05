import mongoose from 'mongoose';
import chatConversationModel from '../models/chatConversationModel.js';
import chatMessageModel from '../models/chatMessageModel.js';
import userModel from '../models/userModel.js';

const ADMIN_ID = 'admin';

const getDisplayName = (user) => {
  if (!user) return 'User';
  if (user.fullName?.trim()) return user.fullName.trim();
  const first = user.firstName?.trim() || '';
  const last = user.lastName?.trim() || '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
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
    sender: messageDoc.senderRole === 'user' ? 'client' : 'admin',
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

const mapConversationForClient = (conversationDoc, userInfo, unreadCount = 0) => {
  return {
    id: conversationDoc._id,
    _id: conversationDoc._id,
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
  };
};

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

const getOrCreateConversationForUser = async (userObjectId) => {
  if (!userObjectId) return null;

  let conversation = await chatConversationModel.findOne({ userId: userObjectId });
  if (conversation) return conversation;

  try {
    conversation = await chatConversationModel.create({ userId: userObjectId });
    return conversation;
  } catch (error) {
    if (error?.code === 11000) {
      return chatConversationModel.findOne({ userId: userObjectId });
    }
    throw error;
  }
};

const getConversationForRequest = async (ctx, req, res) => {
  if (isAdminOrStaff(ctx)) {
    const conversationId = req.query.conversationId || req.body.conversationId;
    if (!conversationId) {
      res.status(400).json({ success: false, message: 'conversationId is required' });
      return null;
    }
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ success: false, message: 'Invalid conversationId' });
      return null;
    }
    const conversation = await chatConversationModel.findById(conversationId).populate(
      'userId',
      'fullName firstName lastName email'
    );
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return null;
    }
    return conversation;
  }

  const conversation = await getOrCreateConversationForUser(ctx.userObjectId);
  if (!conversation) {
    res.status(500).json({ success: false, message: 'Failed to open conversation' });
    return null;
  }
  return conversation;
};

export const listConversations = async (req, res) => {
  try {
    const ctx = await getRequesterContext(req, res);
    if (!ctx) return;

    const search = String(req.query.search || '').trim().toLowerCase();
    const filter = String(req.query.filter || '').trim().toLowerCase();
    const unreadOnly = filter === 'unread';

    if (isAdminOrStaff(ctx)) {
      const rawConversations = await chatConversationModel
        .find()
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
          const userName = getDisplayName(userInfo);
          const searchable = `${userName} ${userInfo?.email || ''} ${conversation.lastMessagePreview || ''}`.toLowerCase();

          if (search && !searchable.includes(search)) return null;
          if (unreadOnly && unreadCount <= 0) return null;

          return mapConversationForClient(conversation, userInfo, unreadCount);
        })
      );

      res.json({
        success: true,
        conversations: mapped.filter(Boolean),
      });
      return;
    }

    const conversation = await getOrCreateConversationForUser(ctx.userObjectId);
    if (!conversation) {
      res.status(500).json({ success: false, message: 'Failed to load conversation' });
      return;
    }

    const unreadCount = await chatMessageModel.countDocuments({
      conversationId: conversation._id,
      senderRole: { $in: ['admin', 'staff'] },
      seenBy: { $ne: ctx.id },
    });

    res.json({
      success: true,
      conversations: [mapConversationForClient(conversation, ctx.userDoc, unreadCount)],
    });
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
    if (isAdminOrStaff(ctx)) {
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
