import appointmentModel from '../models/appointmentModel.js';

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const { service, date, time, notes } = req.body;

    const appointment = new appointmentModel({
      userId: req.userId,
      service,
      date,
      time,
      notes,
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (error) {
    console.error('Create Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
};

// Get all appointments (admin/staff) or user's appointments
export const getAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = {};

    // If not admin/staff, only return user's appointments
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      query.date = date;
    }

    const appointments = await appointmentModel.find(query).sort({ date: 1, time: 1 });

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error('Get Appointments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentModel.findById(id).populate('userId', 'fullName email phoneNumber');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if user owns the appointment or is admin/staff
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    if (user && user.role !== 'admin' && user.role !== 'staff' && appointment.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Get Appointment By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointment' });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { service, date, time, status, notes } = req.body;

    const appointment = await appointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (service) appointment.service = service;
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await appointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update appointment status' });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentModel.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Delete Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete appointment' });
  }
};

// Get available slots for a date
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const MAX_SLOTS = 10;

    // Get all appointments for the date
    const appointments = await appointmentModel.find({ 
      date,
      status: { $ne: 'Cancelled' }
    });

    const usedSlots = appointments.length;
    const remainingSlots = MAX_SLOTS - usedSlots;

    // Available time slots (9 AM to 5 PM, hourly)
    const allSlots = [
      '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];

    const bookedSlots = appointments.map(a => a.time);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      date,
      totalSlots: MAX_SLOTS,
      usedSlots,
      remainingSlots,
      bookedSlots,
      availableSlots,
    });
  } catch (error) {
    console.error('Get Available Slots Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available slots' });
  }
};

// Get appointment statistics
export const getAppointmentStats = async (req, res) => {
  try {
    const user = await import('../models/userModel.js').then(m => m.default.findById(req.userId));
    let query = {};

    // If not admin/staff, only return user's appointments
    if (user && user.role !== 'admin' && user.role !== 'staff') {
      query.userId = req.userId;
    }

    const totalAppointments = await appointmentModel.countDocuments(query);
    const approvedAppointments = await appointmentModel.countDocuments({ ...query, status: 'Approved' });
    const pendingAppointments = await appointmentModel.countDocuments({ ...query, status: 'Pending' });
    const completedAppointments = await appointmentModel.countDocuments({ ...query, status: 'Completed' });

    res.json({
      success: true,
      stats: {
        total: totalAppointments,
        approved: approvedAppointments,
        pending: pendingAppointments,
        completed: completedAppointments,
      },
    });
  } catch (error) {
    console.error('Get Appointment Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointment stats' });
  }
};
