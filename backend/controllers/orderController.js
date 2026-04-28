import mongoose from 'mongoose';
import orderModel from '../models/orderModel.js';
import invoiceModel from '../models/invoiceModel.js';
import userModel from '../models/userModel.js';
import QRCode from 'qrcode';
import { v2 as cloudinary } from 'cloudinary';
import { buildStaffAssignmentQuery, isAssignedToUser } from '../utils/assignmentAccess.js';
import { getRequestActor } from '../utils/requestActor.js';
import {
  resolveEntityWorkflowStatus,
  resolveWorkflowStatus,
} from '../utils/workflowStatus.js';
import {
  validateWorkflowStepMutation,
} from '../utils/workflowStepAccess.js';
import {
  maybeCreateAdminOrderReadyForPickupNotification,
  maybeCreateOrderReadyForPickupNotification,
  maybeCreateOrderReleasedNotification,
} from '../utils/userNotificationEvents.js';
import {
  emitBackofficeOrdersFeedRefresh,
  emitOrderTrackingUpdate,
} from '../utils/trackingUpdateEvents.js';
import {
  maybeCreateStaffAssignmentNotification,
  maybeCreateWorkflowStepReadyNotification,
} from '../utils/staffNotificationEvents.js';

const getOrderOwnerId = (order = {}) =>
  String(order?.userId?._id || order?.userId || '');

const normalizeStepLabel = (label = '') =>
  String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

const normalizeStaffAssignments = (staffAssignments = {}, fallbackTailor = '') => ({
  tailor: String(staffAssignments?.tailor ?? fallbackTailor ?? '').trim(),
  presser: String(staffAssignments?.presser ?? '').trim(),
  layoutArtist: String(staffAssignments?.layoutArtist ?? '').trim(),
});

const hasReachedDropOffStep = (steps = []) =>
  Array.isArray(steps) &&
  steps.some((step) => {
    const label = normalizeStepLabel(step?.label);
    return ['dropped off', 'drop off'].includes(label) && Boolean(step?.done || step?.active);
  });

const serializeOrderWithWorkflowStatus = (order = {}, invoice = null) => ({
  ...(typeof order?.toObject === 'function' ? order.toObject() : order),
  status: resolveEntityWorkflowStatus(order),
  invoice,
});

const buildOrderLookupQuery = (rawId = '') => {
  const id = String(rawId || '').trim();

  if (!id) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(id)) {
    return {
      $or: [
        { _id: id },
        { orderId: id },
      ],
    };
  }

  return { orderId: id };
};

export const getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const userId = req.userId;

    let query = {};

    // Only filter by userId if the user is NOT an admin
    if (userId !== 'admin') {
      try {
        const user = await userModel.findById(userId);
        if (user) {
          if (user.role === 'staff') {
            const assignmentQuery = buildStaffAssignmentQuery(user);
            if (assignmentQuery) {
              Object.assign(query, assignmentQuery);
            } else {
              query._id = null;
            }
          } else if (user.role !== 'admin') {
            query.userId = userId;
          }
        }
      } catch (err) {
        // If user lookup fails, still proceed- filter by userId
        query.userId = userId;
      }
    }
    // If userId is 'admin', no filtering - show all orders

    if (status) {
      query.status = status;
    }

    if (search) {
      query = {
        $and: [
          query,
          {
            $or: [
              { item: { $regex: search, $options: 'i' } },
              { orderId: { $regex: search, $options: 'i' } },
              { customer: { $regex: search, $options: 'i' } },
            ],
          },
        ],
      };
    }

    const orders = await orderModel.find(query).sort({ createdAt: -1 });

    // Fetch invoice for each order
    const ordersWithInvoice = await Promise.all(
      orders.map(async (order) => {
        const invoice = await invoiceModel.findOne({ orderId: order._id });
        return serializeOrderWithWorkflowStatus(order, invoice);
      })
    );

    res.json({
      success: true,
      data: ordersWithInvoice,
      orders: ordersWithInvoice, // for compatibility
    });

  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const lookupQuery = buildOrderLookupQuery(id);

    if (!lookupQuery) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = await orderModel
      .findOne(lookupQuery)
      .populate('userId', 'fullName email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await getRequestActor(req);
    const isAdminStaff = user && (user.role === 'admin' || user.role === 'staff');

    if (user?.role === 'staff' && !isAssignedToUser(order, user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check ownership
    if (!isAdminStaff && getOrderOwnerId(order) !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const invoice = await invoiceModel.findOne({ orderId: order._id });

    res.json({
      success: true,
      order: serializeOrderWithWorkflowStatus(order, invoice),
      invoice,
    });

  } catch (error) {
    console.error('Get Order By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      stepIndex,
      steps,
      assignedTailor,
      staffAssignments,
      estimatedCompletion,
      pickupDate,
      pickupSlot,
      notes,
      isArchived,
      completedAt,
      archivedAt,
      archivedBy,
    } = req.body;

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await getRequestActor(req);
    const isAdminStaff = user && (user.role === 'admin' || user.role === 'staff');

    // Restrict tracking updates
    if ((assignedTailor !== undefined || staffAssignments !== undefined || stepIndex !== undefined || steps !== undefined) && !isAdminStaff) {
      return res.status(403).json({
        success: false,
        message: 'Only admin/staff can update order tracking'
      });
    }

    if (user?.role === 'staff' && !isAssignedToUser(order, user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const previousStatus = order.status;
    const previousAssignedTailor = order.assignedTailor;
    const previousOrderSnapshot = order.toObject();

    if (assignedTailor !== undefined || staffAssignments !== undefined) {
      const nextStaffAssignments = normalizeStaffAssignments(
        staffAssignments ?? order.staffAssignments,
        assignedTailor !== undefined ? assignedTailor : order.assignedTailor
      );

      order.staffAssignments = nextStaffAssignments;
      order.assignedTailor = assignedTailor !== undefined
        ? String(assignedTailor || '').trim()
        : nextStaffAssignments.tailor;
    }
    if (estimatedCompletion !== undefined) order.estimatedCompletion = estimatedCompletion;
    if (pickupDate !== undefined) order.pickupDate = pickupDate;
    if (pickupSlot !== undefined) order.pickupSlot = pickupSlot;
    if (notes) order.notes = notes;
    if (isArchived !== undefined) order.isArchived = isArchived;
    if (completedAt !== undefined) order.completedAt = completedAt;
    if (archivedAt !== undefined) order.archivedAt = archivedAt;
    if (archivedBy !== undefined) order.archivedBy = archivedBy;

    if (user?.role === 'staff' && stepIndex !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can directly reposition workflow steps.',
      });
    }

    if (steps !== undefined) {
      const workflowAccess = validateWorkflowStepMutation({
        user,
        previousSteps: order.steps,
        nextSteps: steps,
      });

      if (!workflowAccess.allowed) {
        return res.status(403).json({
          success: false,
          message: workflowAccess.message,
        });
      }
    }

    // Step update
    if (steps !== undefined) {
      order.steps = steps;
    } else if (isAdminStaff && stepIndex !== undefined && order.steps[stepIndex]) {
      order.steps.forEach((step, i) => {
        step.done = i < stepIndex;
        step.active = i === stepIndex;
      });
    }

    const nextStatus = resolveWorkflowStatus({
      currentStatus: order.status,
      requestedStatus: status,
      steps: order.steps,
    });

    if (nextStatus) order.status = nextStatus;

    await order.save();
    emitOrderTrackingUpdate(order);
    await maybeCreateStaffAssignmentNotification({
      req,
      entityType: 'order',
      entity: order,
      previousAssignedTailor,
    });
    await maybeCreateWorkflowStepReadyNotification({
      req,
      entityType: 'order',
      previousEntity: previousOrderSnapshot,
      entity: order,
    });
    await maybeCreateOrderReadyForPickupNotification({
      req,
      order,
      previousStatus,
    });
    await maybeCreateAdminOrderReadyForPickupNotification({
      req,
      order,
      previousStatus,
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      order,
    });

  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};

export const updateOrderSteps = async (req, res) => {
  try {
    const { id } = req.params;
    const { steps, players } = req.body;

    const user = await getRequestActor(req);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({
        success: false,
        message: 'Only admin/staff can update order steps'
      });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (user.role === 'staff' && !isAssignedToUser(order, user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (steps) {
      const workflowAccess = validateWorkflowStepMutation({
        user,
        previousSteps: order.steps,
        nextSteps: steps,
      });

      if (!workflowAccess.allowed) {
        return res.status(403).json({
          success: false,
          message: workflowAccess.message,
        });
      }
    }

    const previousStatus = order.status;
    const nextSteps = steps || order.steps;
    const previousOrderSnapshot = order.toObject();

    const nextStatus = resolveWorkflowStatus({
      currentStatus: order.status,
      steps: nextSteps,
    });

    if (nextStatus) order.status = nextStatus;
    if (steps) order.steps = steps;
    if (players) order.players = players;

    await order.save();
    emitOrderTrackingUpdate(order);
    await maybeCreateWorkflowStepReadyNotification({
      req,
      entityType: 'order',
      previousEntity: previousOrderSnapshot,
      entity: order,
    });
    await maybeCreateOrderReadyForPickupNotification({
      req,
      order,
      previousStatus,
    });
    await maybeCreateAdminOrderReadyForPickupNotification({
      req,
      order,
      previousStatus,
    });

    res.json({
      success: true,
      message: 'Order steps updated successfully',
      order,
    });

  } catch (error) {
    console.error('Update Order Steps Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order steps' });
  }
};


export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Handle special case where userId is 'admin' (string)
    const user = await getRequestActor(req);
    const isAdminStaff = user && (user.role === 'admin' || user.role === 'staff');

    // Check ownership - allow if user owns order or is admin/staff
    if (!isAdminStaff && getOrderOwnerId(order) !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!isAdminStaff && hasReachedDropOffStep(order.steps)) {
      return res.status(400).json({
        success: false,
        message: 'This order can no longer be cancelled after it has been dropped off'
      });
    }

    // Check if order can be cancelled
    if (['Completed', 'Released', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already ${order.status}`
      });
    }

    order.status = 'Cancelled';
    await order.save();
    emitOrderTrackingUpdate(order);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });

  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getRequestActor(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete orders'
      });
    }

    const order = await orderModel.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await invoiceModel.deleteMany({ orderId: id });
    emitBackofficeOrdersFeedRefresh();

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });

  } catch (error) {
    console.error('Delete Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

export const assignEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    const user = await getRequestActor(req);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({
        success: false,
        message: 'Only admin/staff can assign employees'
      });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousOrderSnapshot = order.toObject();
    const previousAssignedTailor = order.assignedTailor;
    order.assignedTailor = employeeId;
    order.staffAssignments = normalizeStaffAssignments(order.staffAssignments, employeeId);
    await order.save();
    emitOrderTrackingUpdate(order);
    await maybeCreateStaffAssignmentNotification({
      req,
      entityType: 'order',
      entity: order,
      previousAssignedTailor,
    });
    await maybeCreateWorkflowStepReadyNotification({
      req,
      entityType: 'order',
      previousEntity: previousOrderSnapshot,
      entity: order,
    });

    res.json({
      success: true,
      message: 'Employee assigned successfully',
      order,
    });

  } catch (error) {
    console.error('Assign Employee Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign employee' });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const user = await getRequestActor(req);
    let query = {};

    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    const totalOrders = await orderModel.countDocuments(query);
    const inProgress = await orderModel.countDocuments({ ...query, status: 'In Progress' });
    const completed = await orderModel.countDocuments({
      ...query,
      status: { $in: ['Completed', 'Released'] }
    });
    const pending = await orderModel.countDocuments({ ...query, status: 'Pending' });
    const cancelled = await orderModel.countDocuments({ ...query, status: 'Cancelled' });

    // Optimized total spent calculation
    const invoices = await invoiceModel.find();
    let totalSpent = 0;

    for (const invoice of invoices) {
      totalSpent += invoice.total || 0;
    }

    res.json({
      success: true,
      stats: {
        total: totalOrders,
        inProgress,
        completed,
        pending,
        cancelled,
        spent: totalSpent,
      },
    });

  } catch (error) {
    console.error('Get Order Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order stats' });
  }
};

// Generate QR code for an order
const generateOrderQR = async (orderId) => {
  try {
    const qrData = JSON.stringify({ orderId, timestamp: new Date().toISOString() });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    return null;
  }
};

// Mark order as released by scanning QR code
export const markAsReleased = async (req, res) => {
  try {
    const { orderId, releaseProofImage, releaseNotes } = req.body;

    const order = await orderModel.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if already released
    if (order.isReleased) {
      return res.status(400).json({
        success: false,
        message: 'Order is already released',
        order
      });
    }

    const previousReleased = order.isReleased;
    order.isReleased = true;
    order.releasedAt = new Date();
    order.status = 'Released';  // Set status to Released when QR is scanned
    order.paid = true;  // Mark as paid when scanned
    order.paidAt = new Date();

    if (releaseProofImage) {
      if (releaseProofImage.startsWith('data:image')) {
        const uploadResponse = await cloudinary.uploader.upload(releaseProofImage, {
          folder: 'release_proofs',
          resource_type: 'auto'
        });
        order.releaseProofImage = uploadResponse.secure_url;
      } else {
        order.releaseProofImage = releaseProofImage;
      }
    }
    if (releaseNotes) order.releaseNotes = releaseNotes;
    await order.save();
    emitOrderTrackingUpdate(order, 'released');

    // Update associated invoice status to "Paid"
    await invoiceModel.findOneAndUpdate(
      { orderId: order._id },
      { status: 'Paid', updatedAt: new Date() },
      { new: true }
    );
    await maybeCreateOrderReleasedNotification({
      req,
      order,
      previousReleased,
    });

    res.json({
      success: true,
      message: 'Order marked as released successfully',
      order,
    });

  } catch (error) {
    console.error('Mark As Released Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark order as released' });
  }
};

// Get QR code for an order
export const getOrderQR = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Generate QR code if not already generated
    if (!order.qrCode) {
      const qrCode = await generateOrderQR(order.orderId);
      order.qrCode = qrCode;
      await order.save();
    }

    res.json({
      success: true,
      qrCode: order.qrCode,
      orderId: order.orderId,
    });

  } catch (error) {
    console.error('Get Order QR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get order QR code' });
  }
};

// Generate QR codes for all orders that don't have one
export const generateMissingQRCodes = async (req, res) => {
  try {
    const user = await getRequestActor(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can generate QR codes'
      });
    }

    const ordersWithoutQR = await orderModel.find({ qrCode: { $exists: false } });
    let generated = 0;

    for (const order of ordersWithoutQR) {
      const qrCode = await generateOrderQR(order.orderId);
      if (qrCode) {
        order.qrCode = qrCode;
        await order.save();
        generated++;
      }
    }

    res.json({
      success: true,
      message: `Generated ${generated} QR codes`,
      generated,
    });

  } catch (error) {
    console.error('Generate Missing QR Codes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate QR codes' });
  }
};
