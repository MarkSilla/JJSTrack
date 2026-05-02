const capitalize = (value = '') => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';
  return rawValue.charAt(0).toUpperCase() + rawValue.slice(1).toLowerCase();
};

export const getBookingDisplayLabel = (booking = {}) => {
  if (booking.bookingType === 'jersey') {
    return booking.teamName || booking.service || 'Team Jersey';
  }

  if (booking.bookingType === 'organizational') {
    return booking.orgName || booking.service || 'Organization';
  }

  if (booking.bookingType === 'repair') {
    return booking.service || booking.repairDescription || 'Repair';
  }

  return booking.service || booking.teamName || booking.orgName || booking.bookingType || 'Service';
};

export const getBookingServiceTypeLabel = (booking = {}) => {
  if (booking.bookingType === 'jersey') return 'Team Jersey';
  if (booking.bookingType === 'organizational') return 'Organization';
  if (booking.bookingType === 'repair') return 'Repair';
  return capitalize(booking.bookingType) || booking.serviceType || 'Service';
};

export const isStandaloneBookingTask = (booking = {}) => !booking?.orderId;

export const mapBookingToTask = (booking = {}) => ({
  id: booking._id || booking.id,
  _id: booking._id || booking.id,
  displayId: booking.bookingId || booking._id || booking.id,
  customer: booking.contact?.fullName || booking.customerName || 'Unknown',
  customerName: booking.contact?.fullName || booking.customerName || 'Unknown',
  item: getBookingDisplayLabel(booking),
  status: booking.status || 'Pending',
  date: booking.pickupDate || booking.createdAt,
  steps: booking.steps || [],
  assignedTailor: booking.assignedTailor || '',
  serviceType: getBookingServiceTypeLabel(booking),
  serviceTitle: booking.service || booking.bookingType || 'Service',
  dueDate: booking.pickupDate || booking.dueDate || booking.createdAt,
  pickupDate: booking.pickupDate || '',
  pickupSlot: booking.pickupSlot || '',
  contact: booking.contact || {},
  phone: booking.contact?.phone || booking.phone || 'N/A',
  notes: booking.notes || '',
  adminNotes: booking.adminNotes || '',
  players: booking.players || booking.members || [],
  teamRoster: booking.players || booking.members || [],
  items: booking.items || [],
  photos: booking.photos || [],
  designImages: booking.photos || [],
  designFile: booking.designFile || booking.orgDesignFile || '',
  driveLink: booking.driveLink || booking.orgDriveLink || '',
  repairDescription: booking.repairDescription || '',
  bookingType: booking.bookingType || '',
  assignedBy: booking.assignedTailor || 'Admin',
  isBooking: true,
  createdAt: booking.createdAt,
  ...booking,
});

export const mapOrderToTask = (order = {}) => ({
  id: order._id || order.id,
  _id: order._id || order.id,
  displayId: order.orderId || order._id || order.id,
  customer: order.customer || order.userId?.fullName || 'Unknown',
  customerName: order.customer || order.userId?.fullName || 'Unknown',
  item: order.item || order.serviceType || 'Order',
  status: order.status || 'Pending',
  date: order.estimatedCompletion || order.createdAt || order.date,
  steps: order.steps || [],
  assignedTailor: order.assignedTailor || '',
  serviceType: order.serviceType || 'Service',
  serviceTitle: order.serviceType || order.item || 'Service',
  dueDate: order.estimatedCompletion || order.invoice?.dueDate || order.createdAt,
  estimatedCompletion: order.estimatedCompletion || '',
  contact: order.contact || {},
  phone: order.phone || order.userId?.phoneNumber || 'N/A',
  notes: order.notes || '',
  players: order.players || [],
  teamRoster: order.players || [],
  items: order.items || order.invoice?.items || [],
  invoice: order.invoice || null,
  bookingId: order.bookingId || null,
  assignedBy: 'Admin',
  isBooking: false,
  createdAt: order.createdAt,
  ...order,
});

export const mapBookingToTaskDetail = (booking = {}) => ({
  id: booking._id || booking.id,
  _id: booking._id,
  displayId: booking.bookingId || booking.orderId || booking._id || booking.id,
  teamName: booking.teamName || booking.orgName || booking.service || 'Order',
  team: booking.teamName || booking.orgName,
  category: booking.bookingType || 'Service',
  customer: booking.contact?.fullName || 'Unknown',
  customerName: booking.contact?.fullName || 'Unknown',
  contact: booking.contact || { fullName: 'Unknown', phone: 'N/A' },
  service: booking.service || booking.bookingType || 'Service',
  serviceType: getBookingServiceTypeLabel(booking),
  serviceTitle: booking.service || booking.bookingType || 'Service',
  bookingType: booking.bookingType,
  type: booking.bookingType,
  teamRoster: booking.players || booking.members || [],
  players: booking.players || booking.members || [],
  items: booking.items || [],
  steps: booking.steps || [],
  productionProgress: booking.steps || [],
  pickupDate: booking.pickupDate,
  pickupSlot: booking.pickupSlot,
  dropDate: booking.createdAt,
  dueDate: booking.pickupDate || booking.createdAt,
  createdAt: booking.createdAt,
  status: booking.status || 'Pending',
  photos: booking.photos || [],
  designImages: booking.photos || [],
  designFile: booking.designFile || booking.orgDesignFile,
  driveLink: booking.driveLink || booking.orgDriveLink,
  assignedBy: booking.assignedTailor || 'Admin',
  assignedTailor: booking.assignedTailor,
  notes: booking.notes,
  adminNotes: booking.adminNotes,
  repairDescription: booking.repairDescription,
  isBooking: true,
  ...booking,
});

export const mapOrderToTaskDetail = (order = {}, invoice = null) => ({
  id: order._id || order.id,
  _id: order._id || order.id,
  displayId: order.orderId || order._id || order.id,
  teamName: order.item || order.serviceType || 'Order',
  team: order.item || order.serviceType || 'Order',
  category: order.serviceType || 'Service',
  customer: order.customer || order.userId?.fullName || 'Unknown',
  customerName: order.customer || order.userId?.fullName || 'Unknown',
  contact: order.contact || {
    fullName: order.customer || order.userId?.fullName || 'Unknown',
    phone: order.userId?.phoneNumber || 'N/A',
  },
  service: order.item || order.serviceType || 'Service',
  serviceType: order.serviceType || 'Service',
  serviceTitle: order.item || order.serviceType || 'Service',
  bookingType: '',
  type: order.serviceType || 'Service',
  teamRoster: order.players || [],
  players: order.players || [],
  items: order.items || invoice?.items || [],
  steps: order.steps || [],
  productionProgress: order.steps || [],
  pickupDate: order.estimatedCompletion,
  pickupSlot: '',
  dropDate: order.date || order.createdAt,
  dueDate: order.estimatedCompletion || invoice?.dueDate || order.createdAt,
  createdAt: order.createdAt,
  status: order.status || 'Pending',
  photos: [],
  designImages: [],
  designFile: '',
  driveLink: '',
  assignedBy: 'Admin',
  assignedTailor: order.assignedTailor,
  notes: order.notes,
  adminNotes: '',
  repairDescription: '',
  invoice: invoice || order.invoice || null,
  isBooking: false,
  bookingId: order.bookingId || null,
  ...order,
});
