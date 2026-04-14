import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ['support', 'order'],
      default: 'support',
      index: true,
    },
    subjectType: {
      type: String,
      enum: ['booking', 'order', null],
      default: null,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    subjectLabel: {
      type: String,
      default: '',
      trim: true,
    },
    subjectTitle: {
      type: String,
      default: '',
      trim: true,
    },
    assignedStaffId: {
      type: String,
      default: null,
      index: true,
    },
    assignedStaffName: {
      type: String,
      default: '',
      trim: true,
    },
    assignedAdminId: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      default: '',
      trim: true,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatConversationSchema.index(
  { userId: 1, scope: 1 },
  {
    unique: true,
    partialFilterExpression: { scope: 'support' },
  }
);

chatConversationSchema.index(
  { userId: 1, scope: 1, subjectType: 1, subjectId: 1 },
  {
    unique: true,
    partialFilterExpression: { scope: 'order' },
  }
);

chatConversationSchema.index({ assignedStaffId: 1, scope: 1, lastMessageAt: -1 });

export default mongoose.model('ChatConversation', chatConversationSchema);
