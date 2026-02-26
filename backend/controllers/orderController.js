import orderModel from '../models/orderModel.js';
import invoiceModel from '../models/invoiceModel.js';
import userModel from '../models/userModel.js';

export const getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const user = await userModel.findById(req.userId);

    let query = {};
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { item: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { customer: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await orderModel.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderModel
      .findById(id)
      .populate('userId', 'fullName email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await userModel.findById(req.userId);
    const isAdminStaff = user && (user.role === 'admin' || user.role === 'staff');

    // Check ownership
    if (!isAdminStaff && order.userId._id.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const invoice = await invoiceModel.findOne({ orderId: order._id });

    res.json({
      success: true,
      order,
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
    const { status, stepIndex, assignedTailor, estimatedCompletion, notes } = req.body;

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await userModel.findById(req.userId);
    const isAdminStaff = user && (user.role === 'admin' || user.role === 'staff');

    // Restrict tracking updates
    if ((assignedTailor || stepIndex !== undefined) && !isAdminStaff) {
      return res.status(403).json({
        success: false,
        message: 'Only admin/staff can update order tracking'
      });
    }

    if (status) order.status = status;
    if (assignedTailor) order.assignedTailor = assignedTailor;
    if (estimatedCompletion) order.estimatedCompletion = estimatedCompletion;
    if (notes) order.notes = notes;

    // Step update
    if (isAdminStaff && stepIndex !== undefined && order.steps[stepIndex]) {
      order.steps.forEach((step, i) => {
        step.done = i < stepIndex;
        step.active = i === stepIndex;
      });

      if (stepIndex >= order.steps.length - 1) {
        order.status = 'Completed';
      }
    }

    await order.save();

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

    const user = await userModel.findById(req.userId);
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

    if (steps) order.steps = steps;
    if (players) order.players = players;

    await order.save();

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

    const user = await userModel.findById(req.userId);
    const isAdminStaff = user && (user.role === 'admin' || user.role === 'staff');

    // Check ownership - allow if user owns order or is admin/staff
    if (!isAdminStaff && order.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if order can be cancelled
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already ${order.status}`
      });
    }

    order.status = 'Cancelled';
    await order.save();

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

    const user = await userModel.findById(req.userId);
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

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });

  } catch (error) {
    console.error('Delete Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    let query = {};

    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    const totalOrders = await orderModel.countDocuments(query);
    const inProgress = await orderModel.countDocuments({ ...query, status: 'In Progress' });
    const completed = await orderModel.countDocuments({ ...query, status: 'Completed' });
    const pending = await orderModel.countDocuments({ ...query, status: 'Pending' });

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
        spent: totalSpent,
      },
    });

  } catch (error) {
    console.error('Get Order Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order stats' });
  }
};