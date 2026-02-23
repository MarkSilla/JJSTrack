import orderModel from '../models/orderModel.js';
import invoiceModel from '../models/invoiceModel.js';

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { item, customer, date, estimatedCompletion, serviceType, assignedTailor, steps, players, notes } = req.body;

    const order = new orderModel({
      userId: req.userId,
      item,
      customer,
      date,
      estimatedCompletion,
      serviceType,
      assignedTailor,
      steps: steps || [
        { label: 'Dropped Off', done: true, date, time: '9:00 AM' },
        { label: 'Layout', done: false },
        { label: 'Printing', done: false },
        { label: 'Sewing', done: false },
        { label: 'Pick-up', done: false },
      ],
      players,
      notes,
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

// Get all orders (admin/staff) or user's orders
export const getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // If not admin/staff, only return user's orders
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
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

// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findById(id).populate('userId', 'fullName email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user owns the order or is admin/staff
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    if (user && user.role !== 'admin' && user.role !== 'staff' && order.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get associated invoice
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

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, stepIndex, assignedTailor, estimatedCompletion, notes } = req.body;

    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) order.status = status;
    if (assignedTailor) order.assignedTailor = assignedTailor;
    if (estimatedCompletion) order.estimatedCompletion = estimatedCompletion;
    if (notes) order.notes = notes;

    // Update step if provided
    if (stepIndex !== undefined && order.steps[stepIndex]) {
      order.steps.forEach((step, i) => {
        if (i < stepIndex) {
          step.done = true;
          step.active = false;
        } else if (i === stepIndex) {
          step.done = false;
          step.active = true;
        } else {
          step.done = false;
          step.active = false;
        }
      });

      // If all steps done, mark order as completed
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

// Update order steps
export const updateOrderSteps = async (req, res) => {
  try {
    const { id } = req.params;
    const { steps } = req.body;

    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.steps = steps;
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

// Delete order (admin only)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Also delete associated invoice
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

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    let query = {};

    // If not admin/staff, only return user's orders
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    const totalOrders = await orderModel.countDocuments(query);
    const inProgress = await orderModel.countDocuments({ ...query, status: 'In Progress' });
    const completed = await orderModel.countDocuments({ ...query, status: 'Completed' });
    const pending = await orderModel.countDocuments({ ...query, status: 'Pending' });

    // Calculate total spent from completed orders with invoices
    const completedOrders = await orderModel.find({ ...query, status: 'Completed' });
    let totalSpent = 0;
    for (const order of completedOrders) {
      const invoice = await invoiceModel.findOne({ orderId: order._id });
      if (invoice) {
        totalSpent += invoice.total;
      }
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
