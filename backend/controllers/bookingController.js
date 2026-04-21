import bookingModel, { generateUniqueBookingId } from '../models/bookingModel.js';
import orderModel from '../models/orderModel.js';
import invoiceModel from '../models/invoiceModel.js';
import QRCode from 'qrcode';
import pricingModel from '../models/pricingModel.js';
import userModel from '../models/userModel.js';
import { buildAssignmentQuery, isAssignedToUser } from '../utils/assignmentAccess.js';
import { resolveWorkflowStatus } from '../utils/workflowStatus.js';
import { createNotification } from '../utils/notificationHelpers.js';

const isEnvAdminRequest = (req) => req.userId === 'admin';

const getRequestUser = async (req) => {
  if (isEnvAdminRequest(req)) {
    return {
      _id: 'admin',
      role: 'admin',
      name: 'Admin',
      fullName: 'Admin',
      email: process.env.ADMIN_USERNAME || 'admin',
    };
  }

  return userModel.findById(req.userId);
};

const getBookingOwnerId = (booking) =>
  booking?.userId?._id?.toString?.() ||
  booking?.userId?.toString?.() ||
  '';

const ensureBookingId = async (booking) => {
  if (!booking?._id || booking.bookingId) {
    return booking;
  }

  const nextBookingId = await generateUniqueBookingId(bookingModel);
  const updateResult = await bookingModel.updateOne(
    {
      _id: booking._id,
      $or: [
        { bookingId: { $exists: false } },
        { bookingId: null },
        { bookingId: '' },
      ],
    },
    { $set: { bookingId: nextBookingId } },
    { timestamps: false }
  );

  if (updateResult.modifiedCount > 0) {
    booking.bookingId = nextBookingId;
    return booking;
  }

  const latestBooking = await bookingModel.findById(booking._id).select('bookingId');
  if (latestBooking?.bookingId) {
    booking.bookingId = latestBooking.bookingId;
  }

  return booking;
};

const ensureBookingIds = async (bookings = []) => {
  const bookingList = Array.isArray(bookings) ? bookings : [];

  await Promise.all(
    bookingList
      .filter((booking) => booking?._id && !booking.bookingId)
      .map((booking) =>
        ensureBookingId(booking).catch((error) => {
          console.error(`Failed to backfill bookingId for booking ${booking._id}:`, error);
        })
      )
  );

  return bookingList;
};

const normalizePositiveNumber = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeCurrency = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizeBookingItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      description: item?.description || 'Service Item',
      type: item?.type || 'Service',
      qty: normalizePositiveNumber(item?.qty, 1),
      unitPrice: normalizeCurrency(item?.unitPrice),
      size: item?.size || '',
      addOn: item?.addOn || 'None',
      addOnPrice: normalizeCurrency(item?.addOnPrice),
    }))
    .filter((item) => item.unitPrice >= 0);

const normalizeSelectedOptions = (selectedOptions = []) =>
  (Array.isArray(selectedOptions) ? selectedOptions : []).map((option) => ({
    name: String(option?.name || 'Repair Service').trim() || 'Repair Service',
    price: normalizeCurrency(option?.price),
    quantity: normalizePositiveNumber(option?.quantity, 1),
  }));

const getParticipantLabel = (participant = {}, fallback = 'Customer') => {
  const fullName = [participant.firstName, participant.surname]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || String(participant.name || fallback).trim() || fallback;
};

const formatBookingTypeLabel = (bookingType = '') => {
  if (bookingType === 'repair') return 'repair';
  if (bookingType === 'jersey') return 'team jersey';
  if (bookingType === 'organizational') return 'organizational';
  return 'booking';
};

const getBookingCustomerName = (booking = {}) =>
  String(booking?.contact?.fullName || 'Customer').trim() || 'Customer';

const getBookingDescriptor = (booking = {}) => {
  const typeLabel = formatBookingTypeLabel(booking?.bookingType);
  const serviceSuffix = booking?.service ? ` for ${booking.service}` : '';
  return `${typeLabel} booking${serviceSuffix}`;
};

const getBookingLabel = (booking = {}) =>
  `${getBookingCustomerName(booking)}'s ${getBookingDescriptor(booking)}`;

const formatPickupSchedule = (pickupDate = '', pickupSlot = '') =>
  [pickupDate, pickupSlot].filter(Boolean).join(' at ');

const resolveBookingNotificationRoute = (booking = {}, fallbackOrderId = '') => {
  const orderId =
    fallbackOrderId ||
    booking?.orderId?._id?.toString?.() ||
    booking?.orderId?.toString?.() ||
    '';

  return orderId ? `/admin/orders/${orderId}` : '/admin/orders';
};

const createBookingAdminNotification = async ({
  req,
  booking,
  title,
  message,
  route,
  metadata = {},
}) => {
  if (!booking?._id || !title || !message) return null;

  return createNotification({
    audience: 'admin',
    type: 'booking',
    title,
    message,
    route: route || resolveBookingNotificationRoute(booking),
    entityId: booking._id,
    entityModel: 'Booking',
    metadata: {
      bookingType: booking.bookingType,
      service: booking.service,
      status: booking.status,
      customerName: getBookingCustomerName(booking),
      ...metadata,
    },
    req,
  });
};

const maybeCreateBookingStatusNotification = async ({
  req,
  booking,
  previousStatus = '',
}) => {
  if (!booking?.status || booking.status === previousStatus) {
    return null;
  }

  let title = '';
  let message = '';

  switch (booking.status) {
    case 'Approved':
      title = 'Booking approved';
      message = `${getBookingLabel(booking)} was approved.`;
      break;
    case 'In Progress':
      title = 'Booking in progress';
      message = `Work has started on ${getBookingLabel(booking)}.`;
      break;
    case 'Completed':
      title = 'Booking completed';
      message = `${getBookingLabel(booking)} was marked completed and is ready for pickup.`;
      break;
    case 'Released':
      title = 'Booking released';
      message = booking.isPickedUp
        ? `${getBookingLabel(booking)} was released and picked up.`
        : `${getBookingLabel(booking)} was released.`;
      break;
    case 'Cancelled':
      title = 'Booking cancelled';
      message = `${getBookingLabel(booking)} was cancelled.`;
      break;
    default:
      return null;
  }

  return createBookingAdminNotification({
    req,
    booking,
    title,
    message,
    metadata: {
      event: 'status_changed',
      previousStatus,
      nextStatus: booking.status,
    },
  });
};

const maybeCreateBookingAssignmentNotification = async ({
  req,
  booking,
  previousAssignedTailor = '',
}) => {
  const previousTailor = String(previousAssignedTailor || '').trim();
  const nextTailor = String(booking?.assignedTailor || '').trim();

  if (!nextTailor || previousTailor === nextTailor) {
    return null;
  }

  return createBookingAdminNotification({
    req,
    booking,
    title: previousTailor ? 'Booking reassigned' : 'Booking assigned',
    message: previousTailor
      ? `${getBookingLabel(booking)} was reassigned from ${previousTailor} to ${nextTailor}.`
      : `${getBookingLabel(booking)} was assigned to ${nextTailor}.`,
    metadata: {
      event: previousTailor ? 'reassigned' : 'assigned',
      previousAssignedTailor: previousTailor,
      assignedTailor: nextTailor,
    },
  });
};

const maybeCreateBookingPickupNotification = async ({
  req,
  booking,
  previousPickupDate = '',
  previousPickupSlot = '',
}) => {
  const previousDate = String(previousPickupDate || '').trim();
  const previousSlot = String(previousPickupSlot || '').trim();
  const nextDate = String(booking?.pickupDate || '').trim();
  const nextSlot = String(booking?.pickupSlot || '').trim();

  if (previousDate === nextDate && previousSlot === nextSlot) {
    return null;
  }

  const nextSchedule = formatPickupSchedule(nextDate, nextSlot);
  if (!nextSchedule) {
    return null;
  }

  const previousSchedule = formatPickupSchedule(previousDate, previousSlot);

  return createBookingAdminNotification({
    req,
    booking,
    title: previousSchedule ? 'Booking pickup rescheduled' : 'Booking pickup scheduled',
    message: previousSchedule
      ? `${getBookingLabel(booking)} pickup moved from ${previousSchedule} to ${nextSchedule}.`
      : `${getBookingLabel(booking)} pickup was set for ${nextSchedule}.`,
    metadata: {
      event: previousSchedule ? 'pickup_rescheduled' : 'pickup_scheduled',
      previousPickupDate: previousDate || null,
      previousPickupSlot: previousSlot || null,
      pickupDate: nextDate || null,
      pickupSlot: nextSlot || null,
    },
  });
};

const maybeCreateBookingCapacityNotification = async ({ req, booking }) => {
  if (!booking?.pickupDate) {
    return null;
  }

  if (booking.bookingType === 'repair') {
    const repairCount = await bookingModel.countDocuments({
      pickupDate: booking.pickupDate,
      bookingType: 'repair',
      status: { $ne: 'Cancelled' },
    });

    if (repairCount !== 7) {
      return null;
    }

    return createBookingAdminNotification({
      req,
      booking,
      title: 'Repair slots full',
      message: `Repair bookings for ${booking.pickupDate} are now fully booked.`,
      metadata: {
        event: 'pickup_capacity_full',
        pickupDate: booking.pickupDate,
        slotGroup: 'repair',
        activeBookings: repairCount,
      },
    });
  }

  if (booking.bookingType === 'jersey' || booking.bookingType === 'organizational') {
    const jerseyOrgCount = await bookingModel.countDocuments({
      pickupDate: booking.pickupDate,
      bookingType: { $in: ['jersey', 'organizational'] },
      status: { $ne: 'Cancelled' },
    });

    if (jerseyOrgCount !== 3) {
      return null;
    }

    return createBookingAdminNotification({
      req,
      booking,
      title: 'Custom booking slots full',
      message: `Jersey and organizational bookings for ${booking.pickupDate} are now fully booked.`,
      metadata: {
        event: 'pickup_capacity_full',
        pickupDate: booking.pickupDate,
        slotGroup: 'jersey_organizational',
        activeBookings: jerseyOrgCount,
      },
    });
  }

  return null;
};

const createBookingConvertedNotification = async ({
  req,
  booking,
  order,
}) => {
  if (!booking?._id || !order?._id) {
    return null;
  }

  return createBookingAdminNotification({
    req,
    booking,
    title: 'Booking converted to order',
    message: `${getBookingLabel(booking)} was converted to order ${order.orderId}.`,
    route: resolveBookingNotificationRoute(booking, order._id.toString()),
    metadata: {
      event: 'converted_to_order',
      orderId: order._id,
      orderNumber: order.orderId,
    },
  });
};

// Create a new booking (from repair form, team jersey, or organizational)
export const createBooking = async (req, res) => {
  try {
    console.log('=== CREATE BOOKING START ===');
    console.log('Request userId:', req.userId);
    console.log('Request body:', req.body);

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
      items,
    } = req.body;

    const normalizeStringArray = (value) => {
      if (Array.isArray(value)) {
        return value
          .flat(Infinity)
          .map((item) => (item == null ? '' : String(item).trim()))
          .filter(Boolean)
      }

      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            return parsed
              .flat(Infinity)
              .map((item) => (item == null ? '' : String(item).trim()))
              .filter(Boolean)
          }
        } catch (err) {
          return [value.trim()].filter(Boolean)
        }
      }

      return []
    }

    const normalizedPhotos = normalizeStringArray(photos)

    // Log request data
    console.log('Creating booking with data:', {
      bookingType,
      service,
      userId: req.userId,
      contact
    });

    // Validate required fields
    if (!bookingType || !service) {
      console.log('Validation failed: missing bookingType or service');
      return res.status(400).json({ 
        success: false, 
        message: 'bookingType and service are required',
        received: { bookingType, service }
      });
    }

    // Validate bookingType enum
    const validBookingTypes = ['repair', 'jersey', 'organizational'];
    if (!validBookingTypes.includes(bookingType)) {
      console.log('Validation failed: invalid bookingType', bookingType);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid bookingType. Must be one of: ${validBookingTypes.join(', ')}`,
        received: bookingType
      });
    }

    // Validate contact exists - at least fullName and one contact method
    if (!contact) {
      console.log('Validation failed: no contact object');
      return res.status(400).json({
        success: false,
        message: 'Contact information is required',
        received: contact
      });
    }

    if (!contact.fullName) {
      console.log('Validation failed: no fullName in contact');
      return res.status(400).json({
        success: false,
        message: 'Contact full name is required',
        received: contact
      });
    }

    // Check for at least one contact method
    if (!contact.email && !contact.phone) {
      console.log('Validation failed: no email or phone in contact');
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required in contact information',
        received: contact
      });
    }

    // For jersey/organizational, no pickup required (admin sets later)
    if (bookingType === 'repair' && (!pickupDate || !pickupSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date and slot required for repair bookings',
        received: { pickupDate, pickupSlot }
      });
    }

    // Check daily slot limits
    // Repair: max 7 slots per day
    // Jersey + Organizational: max 3 slots combined per day
    if (bookingType === 'repair' && pickupDate) {
      const repairSlotsOnDate = await bookingModel.countDocuments({
        pickupDate: pickupDate,
        bookingType: 'repair',
        status: { $ne: 'Cancelled' }
      });
      
      if (repairSlotsOnDate >= 7) {
        console.log(`Repair slot limit reached for ${pickupDate}. Current repair bookings: ${repairSlotsOnDate}`);
        return res.status(400).json({
          success: false,
          message: `Repair slots are fully booked for this date (max 7). Please choose another date.`,
          date: pickupDate,
          availableSlots: 0,
          slotType: 'repair'
        });
      }
    }

    // For jersey/organizational bookings from frontend pickup selection
    if ((bookingType === 'jersey' || bookingType === 'organizational') && pickupDate) {
      const jerseyOrgSlotsOnDate = await bookingModel.countDocuments({
        pickupDate: pickupDate,
        bookingType: { $in: ['jersey', 'organizational'] },
        status: { $ne: 'Cancelled' }
      });
      
      if (jerseyOrgSlotsOnDate >= 3) {
        console.log(`Jersey/Organizational slot limit reached for ${pickupDate}. Current bookings: ${jerseyOrgSlotsOnDate}`);
        return res.status(400).json({
          success: false,
          message: `Jersey/Organization slots are fully booked for this date (max 3). Please choose another date.`,
          date: pickupDate,
          availableSlots: 0,
          slotType: 'jersey_org'
        });
      }
    }

    console.log('Validation passed, creating booking document...');

    // Fetch pricing from database with fallbacks
    let pricingJersey = await pricingModel.findOne({ serviceType: 'jersey' });
    let pricingOrg = await pricingModel.findOne({ serviceType: 'organizational' });
    
    // Use database pricing or fallback to hardcoded defaults
    const jerseyPrice = pricingJersey?.basePerPlayer || 650;
    const pocketPrice = pricingJersey?.pocketPrice || 100;
    const orgPrice = pricingOrg?.basePerItem || 650;
    const orgPocketPrice = pricingOrg?.pocketPrice || 100;

    const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions);
    let normalizedItems = normalizeBookingItems(items);

    if (normalizedItems.length === 0 && bookingType === 'repair' && normalizedSelectedOptions.length > 0) {
      normalizedItems = normalizedSelectedOptions.map((option) => ({
        description:
          option.name.toLowerCase() === 'others'
            ? String(repairDescription || 'Other Repair').trim() || 'Other Repair'
            : option.name,
        type: 'Repair',
        qty: option.quantity,
        unitPrice: option.price,
        size: '',
        addOn: 'None',
        addOnPrice: 0,
      }));
    } else if (normalizedItems.length === 0 && bookingType === 'jersey' && players) {
      const playerArray = Array.isArray(players) ? players : [players];
      normalizedItems = playerArray.map((player, index) => {
        const hasPocket = Boolean(player?.hasPocketShorts || player?.pockets);
        const playerName = getParticipantLabel(player, `Player ${index + 1}`);
        return {
          description: `Jersey (${playerName}${player?.number ? ` #${player.number}` : ''})`,
          type: 'Custom',
          qty: 1,
          unitPrice: jerseyPrice,
          size: player?.jerseySize || player?.size || '',
          addOn: hasPocket ? `Pocket Short (+${pocketPrice})` : 'None',
          addOnPrice: hasPocket ? pocketPrice : 0,
        };
      });
    } else if (normalizedItems.length === 0 && bookingType === 'organizational' && members) {
      const memberArray = Array.isArray(members) ? members : [members];
      normalizedItems = memberArray.map((member, index) => {
        const hasPocket = Boolean(member?.hasPocketShorts || member?.pockets);
        const memberName = getParticipantLabel(member, `Member ${index + 1}`);
        return {
          description: `Uniform (${memberName}${member?.number ? ` #${member.number}` : ''})`,
          type: 'Custom',
          qty: 1,
          unitPrice: orgPrice,
          size: member?.size || member?.jerseySize || '',
          addOn: hasPocket ? `Pocket Short (+${orgPocketPrice})` : 'None',
          addOnPrice: hasPocket ? orgPocketPrice : 0,
        };
      });
    }

    // Calculate total price based on provided items first, then fallback logic.
    let totalPrice = 0;

    if (normalizedItems.length > 0) {
      totalPrice = normalizedItems.reduce((sum, item) => {
        return sum + ((item.unitPrice * item.qty) + ((item.addOnPrice || 0) * item.qty));
      }, 0);
    } else if (bookingType === 'repair' && normalizedSelectedOptions.length > 0) {
      totalPrice = normalizedSelectedOptions.reduce((sum, option) => {
        return sum + (option.price * option.quantity);
      }, 0);
    } else if (bookingType === 'jersey' && players) {
      const playerArray = Array.isArray(players) ? players : [players];
      totalPrice = playerArray.reduce((sum, player) => {
        const addOnPrice = player.hasPocketShorts ? pocketPrice : 0;
        return sum + jerseyPrice + addOnPrice;
      }, 0);
    } else if (bookingType === 'organizational' && members) {
      const memberArray = Array.isArray(members) ? members : [members];
      totalPrice = memberArray.reduce((sum, member) => {
        const addOnPrice = member.hasPocketShorts ? orgPocketPrice : 0;
        return sum + orgPrice + addOnPrice;
      }, 0);
    }

    const bookingData = {
      userId: req.userId,
      bookingType,
      service,
      selectedOptions: normalizedSelectedOptions,
      repairDescription,
      photos: normalizedPhotos,
      teamName,
      players,
      designFile,
      driveLink,
      orgName,
      members,
      orgDesignFile,
      orgDriveLink,
      contact,
      items: normalizedItems,
      notes,
      totalPrice,
    };

    // Only add pickup for repair
    if (bookingType === 'repair') {
      bookingData.pickupDate = pickupDate;
      bookingData.pickupSlot = pickupSlot;
    }

    const booking = new bookingModel(bookingData);

    console.log('Booking object created, saving to database...');
    await booking.save();
    console.log('Booking saved successfully:', booking._id);

    await createBookingAdminNotification({
      req,
      booking,
      title: 'New booking submitted',
      message: `${contact.fullName} submitted a ${bookingType} booking for ${service}.`,
      route: '/admin/orders',
      metadata: {
        event: 'submitted',
      },
    });
    await maybeCreateBookingCapacityNotification({ req, booking });

    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully',
      booking,
    });
  } catch (error) {
    console.error('=== CREATE BOOKING ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      console.error('MongoDB ValidationError detected');
      const messages = Object.values(error.errors).map(err => {
        console.error(`  - ${err.path}: ${err.message}`);
        return `${err.path}: ${err.message}`;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all bookings (admin/staff) or user's bookings
export const getBookings = async (req, res) => {
  try {
    const { status, bookingType } = req.query;
    const userId = req.userId;
    let query = {};

    // Only filter by userId if the user is NOT an admin or staff
    if (userId !== 'admin') {
      try {
        const user = await userModel.findById(userId);
        if (user) {
          if (user.role === 'staff') {
            const assignmentQuery = buildAssignmentQuery(user);
            console.log('🔍 Staff Booking Query:', {
              userId: userId,
              fullName: user.fullName,
              firstName: user.firstName,
              lastName: user.lastName,
              employeeId: user.employeeId,
              email: user.email,
              assignmentQuery
            });
            if (assignmentQuery) {
              Object.assign(query, assignmentQuery);
            } else {
              query._id = null;
            }
          } else if (user.role !== 'admin') {
            query.userId = userId;
          }
        } else {
          // If user not found, filter by userId (for customers)
          query.userId = userId;
        }
      } catch (err) {
        // If user lookup fails, filter by userId (for customers)
        query.userId = userId;
      }
    }
    // If userId is 'admin', no filtering - show all bookings

    if (status) {
      query.status = status;
    }

    if (bookingType) {
      query.bookingType = bookingType;
    }

    console.log('getBookings called with userId:', userId, 'query:', query);

    const bookings = await bookingModel.find(query).sort({ createdAt: -1 });
    await ensureBookingIds(bookings);

    // Debug: Check all bookings if none found for staff member
    if (bookings.length === 0 && query.assignedTailor) {
      const allBookings = await bookingModel.find({}).select('_id service assignedTailor status').limit(10);
      console.log('⚠️  No bookings found with query. All bookings in DB:', allBookings.map(b => ({
        id: b._id,
        service: b.service,
        assignedTailor: b.assignedTailor || '[EMPTY]',
        status: b.status
      })));
    }

    console.log('📊 Booking Query Results:', {
      query: query,
      bookingsFound: bookings.length,
      bookingDetails: bookings.slice(0, 5).map(b => ({
        id: b._id,
        service: b.service,
        assignedTailor: b.assignedTailor,
        status: b.status
      }))
    });

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

    // Check if user owns the booking or is the assigned staff/admin
    const user = await getRequestUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'staff' && !isAssignedToUser(booking.assignedTailor, user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (user.role !== 'admin' && user.role !== 'staff' && getBookingOwnerId(booking) !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await ensureBookingId(booking);

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
    const { status, adminNotes, contact, pickupDate, pickupSlot, steps, assignedTailor } = req.body;

    console.log('📝 UpdateBooking request:', { id, assignedTailor, status, hasAssignedTailor: !!assignedTailor });

    const booking = await bookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const user = await getRequestUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isAdmin = user.role === 'admin';
    const isStaff = user.role === 'staff';
    const isOwner = getBookingOwnerId(booking) === req.userId;

    if (isStaff && !isAssignedToUser(booking.assignedTailor, user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!isAdmin && !isStaff && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const previousStatus = booking.status;
    const previousAssignedTailor = booking.assignedTailor;
    const previousPickupDate = booking.pickupDate;
    const previousPickupSlot = booking.pickupSlot;
    const nextSteps = steps || booking.steps;
    const nextStatus = resolveWorkflowStatus({
      currentStatus: booking.status,
      requestedStatus: status,
      steps: nextSteps,
    });

    if (nextStatus) booking.status = nextStatus;
    if (adminNotes !== undefined) booking.adminNotes = adminNotes;
    if (contact !== undefined) booking.contact = contact;
    if (pickupDate !== undefined) booking.pickupDate = pickupDate;
    if (pickupSlot !== undefined) booking.pickupSlot = pickupSlot;
    if (steps !== undefined) booking.steps = steps;
    if (assignedTailor !== undefined) {
      console.log('🎯 Setting assignedTailor:', assignedTailor);
      booking.assignedTailor = assignedTailor;
    }

    console.log('💾 Saving booking with status:', booking.status, 'steps:', booking.steps);
    booking.steps = booking.steps || [];
    await booking.save();

    console.log('✅ Booking saved with assignedTailor:', booking.assignedTailor);
    await maybeCreateBookingStatusNotification({
      req,
      booking,
      previousStatus,
    });
    await maybeCreateBookingAssignmentNotification({
      req,
      booking,
      previousAssignedTailor,
    });
    await maybeCreateBookingPickupNotification({
      req,
      booking,
      previousPickupDate,
      previousPickupSlot,
    });

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

    const user = await getRequestUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isAdmin = user.role === 'admin';
    const isStaff = user.role === 'staff';
    const isOwner = getBookingOwnerId(booking) === req.userId;

    if (isStaff && !isAssignedToUser(booking.assignedTailor, user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!isAdmin && !isStaff && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const previousStatus = booking.status;
    booking.status = resolveWorkflowStatus({
      currentStatus: booking.status,
      requestedStatus: status,
      steps: booking.steps,
    });
    if (adminNotes) booking.adminNotes = adminNotes;

    await booking.save();
    await maybeCreateBookingStatusNotification({
      req,
      booking,
      previousStatus,
    });

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
      bookingId: booking._id,
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

    // Create invoice for the order
    const items = Array.isArray(booking.items) && booking.items.length > 0
      ? booking.items.map((item) => ({
          description: item.description || 'Service Item',
          type: item.type || 'Service',
          qty: item.qty || 1,
          unitPrice: item.unitPrice || 0,
          size: item.size || '',
          addOn: item.addOn || 'None',
          addOnPrice: item.addOnPrice || 0,
        }))
      : [];
    
    // Fetch pricing from database with fallbacks
    let pricingJersey = await pricingModel.findOne({ serviceType: 'jersey' });
    let pricingOrg = await pricingModel.findOne({ serviceType: 'organizational' });
    
    const jerseyPrice = pricingJersey?.basePerPlayer || 650;
    const pocketPrice = pricingJersey?.pocketPrice || 100;
    const orgPrice = pricingOrg?.basePerItem || 650;
    const orgPocketPrice = pricingOrg?.pocketPrice || 100;
    
    if (items.length === 0 && booking.bookingType === 'jersey' && booking.players) {
      for (const player of booking.players) {
        const unitPrice = jerseyPrice;
        const hasPocket = player.hasPocketShorts || player.pockets;
        const addOnPrice = hasPocket ? pocketPrice : 0;
        const playerName = [player.firstName, player.surname].filter(Boolean).join(' ') || player.name || 'Player';
        items.push({
          description: `Jersey (${playerName}${player.number ? ` #${player.number}` : ''})`,
          type: 'Custom',
          qty: 1,
          unitPrice,
          size: player.jerseySize || player.size || '',
          addOn: hasPocket ? `Pocket Short (+${pocketPrice})` : 'None',
          addOnPrice,
        });
      }
    } else if (items.length === 0 && booking.bookingType === 'organizational' && booking.members) {
      for (const member of booking.members) {
        const unitPrice = orgPrice;
        const hasPocket = member.hasPocketShorts || member.pockets;
        const addOnPrice = hasPocket ? orgPocketPrice : 0;
        const memberName = [member.firstName, member.surname].filter(Boolean).join(' ') || member.name || 'Member';
        items.push({
          description: `Jersey (${memberName}${member.number ? ` #${member.number}` : ''})`,
          type: 'Custom',
          qty: 1,
          unitPrice,
          size: member.size || member.jerseySize || '',
          addOn: hasPocket ? `Pocket Short (+${orgPocketPrice})` : 'None',
          addOnPrice,
        });
      }
    } else if (items.length === 0 && booking.bookingType === 'repair' && booking.selectedOptions) {
      for (const option of booking.selectedOptions) {
        items.push({
          description: `${booking.service} - ${option.name}`,
          type: 'Repair',
          qty: option.quantity || 1,
          unitPrice: option.price,
        });
      }
    }

    // Calculate total price from items
    const totalPrice = items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice * item.qty) + (item.addOnPrice || 0);
      return sum + itemTotal;
    }, 0);

    booking.totalPrice = totalPrice;
    await booking.save();
    await createBookingConvertedNotification({
      req,
      booking,
      order,
    });

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

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Handle special case where userId is 'admin' (string)
    let isAdminStaff = false;
    if (isEnvAdminRequest(req)) {
      isAdminStaff = true;
    } else {
      const user = await userModel.findById(req.userId);
      isAdminStaff = user && (user.role === 'admin' || user.role === 'staff');
    }

    // Check ownership - allow if user owns booking or is admin/staff
    if (!isAdminStaff && booking.userId?.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already ${booking.status}`
      });
    }

    // Update booking status
    const previousStatus = booking.status;
    booking.status = 'Cancelled';
    await booking.save();
    await maybeCreateBookingStatusNotification({
      req,
      booking,
      previousStatus,
    });

    // If there's an associated order, cancel it too
    if (booking.orderId) {
      await orderModel.findByIdAndUpdate(
        booking.orderId,
        { status: 'Cancelled' },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });

  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
};

// Get available slots for a specific date
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // Count repair bookings for the date
    const repairBookedSlots = await bookingModel.countDocuments({
      pickupDate: date,
      bookingType: 'repair',
      status: { $ne: 'Cancelled' }
    });

    // Count jersey + organizational bookings for the date
    const jerseyOrgBookedSlots = await bookingModel.countDocuments({
      pickupDate: date,
      bookingType: { $in: ['jersey', 'organizational'] },
      status: { $ne: 'Cancelled' }
    });

    const maxRepairSlots = 7;
    const maxJerseyOrgSlots = 3;

    const availableRepairSlots = Math.max(0, maxRepairSlots - repairBookedSlots);
    const availableJerseyOrgSlots = Math.max(0, maxJerseyOrgSlots - jerseyOrgBookedSlots);

    const repairIsFull = repairBookedSlots >= maxRepairSlots;
    const jerseyOrgIsFull = jerseyOrgBookedSlots >= maxJerseyOrgSlots;

    res.json({
      success: true,
      date,
      repair: {
        booked: repairBookedSlots,
        available: availableRepairSlots,
        max: maxRepairSlots,
        isFull: repairIsFull
      },
      jerseyOrg: {
        booked: jerseyOrgBookedSlots,
        available: availableJerseyOrgSlots,
        max: maxJerseyOrgSlots,
        isFull: jerseyOrgIsFull
      },
      totalBooked: repairBookedSlots + jerseyOrgBookedSlots,
      totalMax: maxRepairSlots + maxJerseyOrgSlots,
      totalAvailable: availableRepairSlots + availableJerseyOrgSlots,
      allSlotsFull: repairIsFull && jerseyOrgIsFull
    });

  } catch (error) {
    console.error('Get Available Slots Error:', error);
    res.status(500).json({ success: false, message: 'Failed to check available slots' });
  }
};

// Generate QR code for a booking
const generateBookingQR = async (bookingId) => {
  try {
    const qrData = JSON.stringify({ bookingId, timestamp: new Date().toISOString() });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    return null;
  }
};

// Get QR code for a booking
export const getBookingQR = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Generate QR code if not already generated
    if (!booking.qrCode) {
      const qrCode = await generateBookingQR(booking._id.toString());
      booking.qrCode = qrCode;
      await booking.save();
    }

    res.json({
      success: true,
      qrCode: booking.qrCode,
      bookingId: booking._id.toString(),
    });

  } catch (error) {
    console.error('Get Booking QR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking QR code' });
  }
};

// Mark booking as picked up by scanning QR code
export const markAsPickedUp = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await bookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if already picked up
    if (booking.isPickedUp) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already marked as picked up',
        booking
      });
    }

    const previousStatus = booking.status;
    booking.isPickedUp = true;
    booking.pickedUpAt = new Date();
    booking.status = 'Released';  // Set status to Released when QR is scanned
    booking.paid = true;  // Mark as paid when scanned
    booking.paidAt = new Date();
    await booking.save();
    await maybeCreateBookingStatusNotification({
      req,
      booking,
      previousStatus,
    });

    // Update associated invoice status to "Paid"
    await invoiceModel.findOneAndUpdate(
      { orderId: booking._id },
      { status: 'Paid', updatedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Booking marked as picked up successfully',
      booking,
    });

  } catch (error) {
    console.error('Mark As Picked Up Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark booking as picked up' });
  }
};

// Generate QR codes for all bookings that don't have one
export const generateMissingBookingQRCodes = async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can generate QR codes'
      });
    }

    const bookingsWithoutQR = await bookingModel.find({ qrCode: { $exists: false } });
    let generated = 0;

    for (const booking of bookingsWithoutQR) {
      const qrCode = await generateBookingQR(booking._id.toString());
      if (qrCode) {
        booking.qrCode = qrCode;
        await booking.save();
        generated++;
      }
    }

    res.json({
      success: true,
      message: `Generated ${generated} QR codes`,
      generated,
    });

  } catch (error) {
    console.error('Generate Missing Booking QR Codes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate QR codes' });
  }
};

// Archive a booking
export const archiveBooking = async (req, res) => {
  try {
    console.log('Archive booking request - params:', req.params, 'userId:', req.userId);
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    const user = await getRequestUser(req);
    console.log('User found:', user?.name, 'role:', user?.role);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can archive bookings'
      });
    }

    const booking = await bookingModel.findByIdAndUpdate(
      id,
      {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: user.fullName || user.name || user.email || 'admin'
      },
      { new: true }
    );

    if (!booking) {
      console.log('Booking not found:', id);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log('Booking archived successfully:', booking._id);
    res.json({
      success: true,
      message: 'Booking archived successfully',
      booking
    });
  } catch (error) {
    console.error('Archive Booking Error:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Failed to archive booking: ' + error.message });
  }
};

// Unarchive a booking
export const unarchiveBooking = async (req, res) => {
  try {
    console.log('Unarchive booking request - params:', req.params, 'userId:', req.userId);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }
    
    const user = await getRequestUser(req);
    console.log('User found:', user?.name, 'role:', user?.role);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can unarchive bookings'
      });
    }

    const booking = await bookingModel.findByIdAndUpdate(
      id,
      {
        isArchived: false,
        archivedAt: null,
        archivedBy: null
      },
      { new: true }
    );

    if (!booking) {
      console.log('Booking not found:', id);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log('Booking unarchived successfully:', booking._id);
    res.json({
      success: true,
      message: 'Booking unarchived successfully',
      booking
    });
  } catch (error) {
    console.error('Unarchive Booking Error:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Failed to unarchive booking: ' + error.message });
  }
};
