import bookingModel from '../models/bookingModel.js';
import orderModel from '../models/orderModel.js';
import invoiceModel from '../models/invoiceModel.js';

// Create a new booking (from repair form, team jersey, or organizational)
export const createBooking = async (req, res) => {
  try {
    const {
      bookingType,
      service,
      selectedOptions,
      repairDescription,
      photos,
      teamName,
      players,
      designFile,
      driveLink,
      orgName,
      members,
      orgDesignFile,
      orgDriveLink,
      contact,
      pickupDate,
      pickupSlot,
      notes,
    } = req.body;

    const booking = new bookingModel({
      userId: req.userId,
      bookingType,
      service,
      selectedOptions,
      repairDescription,
      photos,
      teamName,
      players,
      designFile,
      driveLink,
      orgName,
      members,
      orgDesignFile,
      orgDriveLink,
      contact,
      pickupDate,
      pickupSlot,
      notes,
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully',
      booking,
    });
  } catch (error) {
    console.error('Create Booking Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
};

// Get all bookings (admin/staff) or user's bookings
export const getBookings = async (req, res) => {
  try {
    const { status, bookingType } = req.query;
    let query = {};

    // If not admin/staff, only return user's bookings
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    if (status) {
      query.status = status;
    }

    if (bookingType) {
      query.bookingType = bookingType;
    }

    const bookings = await bookingModel.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Get Bookings Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

// Get single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingModel.findById(id).populate('userId', 'fullName email phoneNumber');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin/staff
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    if (user && user.role !== 'admin' && user.role !== 'staff' && booking.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Get Booking By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
};

// Update booking
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, contact, pickupDate, pickupSlot } = req.body;

    const booking = await bookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (status) booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    if (contact) booking.contact = contact;
    if (pickupDate) booking.pickupDate = pickupDate;
    if (pickupSlot) booking.pickupSlot = pickupSlot;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Update Booking Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const booking = await bookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
};

// Delete booking
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingModel.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    console.error('Delete Booking Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
};

// Convert booking to order (admin/staff only)
export const convertBookingToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedCompletion, assignedTailor } = req.body;

    const booking = await bookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Create order from booking
    let item = '';
    let players = [];
    let steps = [
      { label: 'Dropped Off', done: true, date: new Date().toLocaleDateString(), time: '9:00 AM' },
      { label: 'Layout', done: false },
      { label: 'Printing', done: false },
      { label: 'Sewing', done: false },
      { label: 'Pick-up', done: false },
    ];

    if (booking.bookingType === 'repair') {
      item = `Repair - ${booking.service}`;
      steps = [
        { label: 'Drop Off', done: true, date: new Date().toLocaleDateString(), time: '9:00 AM' },
        { label: 'Sewing', done: false },
        { label: 'Pick-up', done: false },
      ];
    } else if (booking.bookingType === 'jersey') {
      item = `Team Jersey - ${booking.teamName}`;
      players = booking.players || [];
    } else if (booking.bookingType === 'organizational') {
      item = `Organizational - ${booking.orgName}`;
      players = booking.members || [];
    }

    const order = new orderModel({
      userId: booking.userId,
      item,
      customer: booking.contact?.fullName,
      date: new Date().toLocaleDateString(),
      estimatedCompletion,
      serviceType: booking.bookingType === 'repair' ? 'Repair' : booking.bookingType === 'jersey' ? 'Team Jersey' : 'Custom',
      assignedTailor,
      status: 'In Progress',
      steps,
      players,
    });

    await order.save();

    // Update booking with order reference
    booking.orderId = order._id;
    booking.status = 'Approved';
    await booking.save();

    // Create invoice for the order
    const items = [];
    
    if (booking.bookingType === 'jersey' && booking.players) {
      for (const player of booking.players) {
        const unitPrice = 650; // Base jersey price
        const addOnPrice = player.hasPocketShorts ? 100 : 0;
        items.push({
          description: `Jersey (${player.name} #${player.number})`,
          type: 'Custom',
          qty: 1,
          unitPrice,
          size: player.size,
          addOn: player.hasPocketShorts ? 'Pocket Short (+100)' : 'None',
          addOnPrice,
        });
      }
    } else if (booking.bookingType === 'organizational' && booking.members) {
      for (const member of booking.members) {
        const unitPrice = 650;
        const addOnPrice = member.hasPocketShorts ? 100 : 0;
        items.push({
          description: `Jersey (${member.name} #${member.number})`,
          type: 'Custom',
          qty: 1,
          unitPrice,
          size: member.size,
          addOn: member.hasPocketShorts ? 'Pocket Short (+100)' : 'None',
          addOnPrice,
        });
      }
    } else if (booking.bookingType === 'repair' && booking.selectedOptions) {
      for (const option of booking.selectedOptions) {
        items.push({
          description: `${booking.service} - ${option.name}`,
          type: 'Repair',
          qty: option.quantity || 1,
          unitPrice: option.price,
        });
      }
    }

    const invoice = new invoiceModel({
      userId: booking.userId,
      orderId: order._id,
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      billTo: {
        name: booking.contact?.fullName || '',
        address: booking.contact?.address || '',
        city: booking.contact?.city || '',
        phone: booking.contact?.phone || '',
        email: booking.contact?.email || '',
      },
      items,
      status: 'Pending',
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Booking converted to order successfully',
      order,
      invoice,
    });
  } catch (error) {
    console.error('Convert Booking To Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to convert booking to order' });
  }
};
