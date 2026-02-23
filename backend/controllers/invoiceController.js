import invoiceModel from '../models/invoiceModel.js';
import orderModel from '../models/orderModel.js';

// Create a new invoice
export const createInvoice = async (req, res) => {
  try {
    const { orderId, date, dueDate, billTo, items, taxRate, discount, payment, status } = req.body;

    // Calculate subtotal, tax, and total
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.qty * item.unitPrice) + ((item.addOnPrice || 0) * item.qty);
    }, 0);
    
    const tax = taxRate ? subtotal * taxRate : 0;
    const discountAmount = discount?.amount || 0;
    const total = subtotal + tax - discountAmount;

    const invoice = new invoiceModel({
      userId: req.userId,
      orderId,
      date,
      dueDate,
      billTo,
      items,
      taxRate,
      discount,
      payment,
      status: status || 'Pending',
      subtotal,
      tax,
      total,
    });

    await invoice.save();

    // If orderId provided, update the order with invoice reference
    if (orderId) {
      await orderModel.findByIdAndUpdate(orderId, {
        $set: { invoiceId: invoice._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error) {
    console.error('Create Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create invoice' });
  }
};

// Get all invoices (admin/staff) or user's invoices
export const getInvoices = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // If not admin/staff, only return user's invoices
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceId: { $regex: search, $options: 'i' } },
        { 'billTo.name': { $regex: search, $options: 'i' } },
        { 'billTo.email': { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await invoiceModel.find(query).sort({ createdAt: -1 }).populate('orderId');

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
};

// Get single invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceModel.findById(id).populate('orderId').populate('userId', 'fullName email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Check if user owns the invoice or is admin/staff
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    if (user && user.role !== 'admin' && user.role !== 'staff' && invoice.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Get Invoice By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate, status, billTo, items, taxRate, discount, payment } = req.body;

    const invoice = await invoiceModel.findById(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Update fields
    if (dueDate) invoice.dueDate = dueDate;
    if (status) invoice.status = status;
    if (billTo) invoice.billTo = billTo;
    if (items) invoice.items = items;
    if (taxRate !== undefined) invoice.taxRate = taxRate;
    if (discount) invoice.discount = discount;
    if (payment) invoice.payment = payment;

    // Recalculate totals
    invoice.subtotal = invoice.items.reduce((sum, item) => {
      return sum + (item.qty * item.unitPrice) + ((item.addOnPrice || 0) * item.qty);
    }, 0);
    
    invoice.tax = invoice.taxRate ? invoice.subtotal * invoice.taxRate : 0;
    const discountAmount = invoice.discount?.amount || 0;
    invoice.total = invoice.subtotal + invoice.tax - discountAmount;

    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice,
    });
  } catch (error) {
    console.error('Update Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update invoice' });
  }
};

// Update invoice status (e.g., mark as paid)
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment } = req.body;

    const invoice = await invoiceModel.findById(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = status;
    if (payment) invoice.payment = payment;

    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      invoice,
    });
  } catch (error) {
    console.error('Update Invoice Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update invoice status' });
  }
};

// Delete invoice (admin only)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceModel.findByIdAndDelete(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Delete Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete invoice' });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    let query = {};

    // If not admin/staff, only return user's invoices
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    const invoices = await invoiceModel.find(query);

    const paidAmount = invoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingAmount = invoices
      .filter(i => i.status === 'Pending')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    res.json({
      success: true,
      stats: {
        paid: paidAmount,
        pending: pendingAmount,
        total: totalAmount,
        count: invoices.length,
      },
    });
  } catch (error) {
    console.error('Get Invoice Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoice stats' });
  }
};
