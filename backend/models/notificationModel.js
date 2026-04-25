import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    audience: {
      type: String,
      enum: ['admin', 'staff', 'user'],
      default: 'admin',
      index: true,
    },
    type: {
      type: String,
      enum: ['booking', 'appointment', 'order', 'inventory', 'system'],
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    route: {
      type: String,
      default: '',
      trim: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityModel: {
      type: String,
      default: '',
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdByRole: {
      type: String,
      enum: ['admin', 'staff', 'user', 'system'],
      default: 'system',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
