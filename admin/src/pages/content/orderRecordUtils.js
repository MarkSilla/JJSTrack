import { getDerivedStatus } from '../../utils/helpers.js';

export const fmtDate = (value) => {
    if (!value) return 'N/A';

    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const getBookingDisplayId = (record = {}) =>
    String(record?.bookingId || record?.orderId || record?.displayId || record?.id || record?._id || 'N/A');

export const getRepairDisplayLabel = (record = {}) =>
    record?.selectedOptions?.[0]?.name || record?.repairDescription || record?.service || record?.item || 'Repair';

const inferTypeKey = (record = {}) => {
    const haystack = [
        record?.bookingType,
        record?.serviceType,
        record?.service,
        record?.item,
        record?.teamName,
        record?.orgName,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (haystack.includes('repair')) return 'repair';
    if (haystack.includes('jersey')) return 'jersey';
    if (haystack.includes('organization') || haystack.includes('organizational') || haystack.includes('uniform')) {
        return 'organizational';
    }

    return 'service';
};

const extractNamedGroup = (value = '') => {
    const parts = String(value || '').split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';
};

const getCustomerName = (record = {}) => {
    const contact = typeof record?.contact === 'object' ? record.contact : {};

    return String(
        contact?.fullName ||
        record?.customerName ||
        record?.customer ||
        record?.guestName ||
        record?.invoice?.billTo?.name ||
        'N/A'
    );
};

const getContactDetails = (record = {}) => {
    const contact = typeof record?.contact === 'object' ? record.contact : {};
    const billTo = record?.invoice?.billTo || {};

    return {
        phone: contact?.phone || record?.phone || billTo?.phone || '',
        email: contact?.email || record?.email || billTo?.email || '',
        address: contact?.address || record?.address || billTo?.address || '',
    };
};

const getGroupName = (record = {}, typeKey = 'service') => {
    if (typeKey === 'jersey') {
        return record?.teamName || extractNamedGroup(record?.item);
    }

    if (typeKey === 'organizational') {
        return record?.orgName || extractNamedGroup(record?.item);
    }

    return '';
};

const computeLineTotal = (item = {}) => {
    const qty = Number(item?.qty) || 1;
    const unitPrice = Number(item?.unitPrice) || 0;
    const addOnPrice = Number(item?.addOnPrice) || 0;
    return (unitPrice + addOnPrice) * qty;
};

const getComputedTotalPrice = (record = {}) => {
    if (record?.totalPrice !== undefined && record?.totalPrice !== null && record?.totalPrice !== '') {
        const parsed = Number(record.totalPrice);
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (record?.invoice?.total !== undefined && record?.invoice?.total !== null) {
        const parsed = Number(record.invoice.total);
        if (Number.isFinite(parsed)) return parsed;
    }

    if (Array.isArray(record?.invoice?.items) && record.invoice.items.length > 0) {
        return record.invoice.items.reduce((sum, item) => sum + computeLineTotal(item), 0);
    }

    if (Array.isArray(record?.items) && record.items.length > 0) {
        return record.items.reduce((sum, item) => sum + computeLineTotal(item), 0);
    }

    return null;
};

const getDropDateRaw = (record = {}) =>
    record?.createdAt || record?.date || record?.dropDate || '';

const getReleaseDateRaw = (record = {}) =>
    record?.pickedUpAt || record?.releasedAt || (record?.status === 'Released' ? record?.updatedAt : '');

const getArchiveDateRaw = (record = {}) =>
    record?.archivedAt || record?.completedAt || record?.updatedAt || record?.releasedAt || '';

const getServiceLabel = (record = {}, typeKey = 'service') => {
    if (typeKey === 'repair') {
        return getRepairDisplayLabel(record);
    }

    if (typeKey === 'jersey') {
        return record?.service || 'Team Jersey';
    }

    if (typeKey === 'organizational') {
        return record?.service || 'Organizational';
    }

    return record?.service || record?.item || record?.serviceType || 'Service';
};

const getImageUrls = (record = {}) => {
    const urls = [];
    const pushValue = (value) => {
        if (Array.isArray(value)) {
            value.forEach(pushValue);
            return;
        }

        if (typeof value === 'string' && value.trim()) {
            urls.push(value.trim());
        }
    };

    pushValue(record?.photos);
    pushValue(record?.designFile);
    pushValue(record?.orgDesignFile);
    pushValue(record?.repairImage);

    return Array.from(new Set(urls));
};

const buildRecord = (record = {}, entityType = 'booking') => {
    const typeKey = inferTypeKey(record);
    const customerName = getCustomerName(record);
    const groupName = getGroupName(record, typeKey);
    const serviceLabel = getServiceLabel(record, typeKey);
    const contact = getContactDetails(record);
    const displayId = entityType === 'booking'
        ? getBookingDisplayId(record)
        : String(record?.orderId || record?.displayId || record?.id || record?._id || 'N/A');
    const sourceStatus = entityType === 'order'
        ? getDerivedStatus(record)
        : String(record?.status || 'Pending');

    const dropDateRaw = getDropDateRaw(record);
    const releaseDateRaw = getReleaseDateRaw(record);
    const archiveDateRaw = getArchiveDateRaw(record);

    return {
        ...record,
        id: record?._id || record?.id,
        displayId,
        entityType,
        entityLabel: entityType === 'booking' ? 'Booking' : 'Order',
        isBooking: entityType === 'booking',
        typeKey,
        customerName,
        headline: groupName || customerName,
        secondaryLabel: groupName ? `Booked by ${customerName}` : serviceLabel,
        groupName,
        serviceLabel,
        contact,
        payStatus: record?.paid ? 'Paid' : 'Unpaid',
        totalPrice: getComputedTotalPrice(record),
        sourceStatus,
        isArchived: Boolean(record?.isArchived),
        archivedBy: record?.archivedBy || '',
        dropDateRaw,
        dropDate: fmtDate(dropDateRaw),
        releaseDateRaw,
        releaseDate: fmtDate(releaseDateRaw),
        archiveDateRaw,
        archiveDate: fmtDate(archiveDateRaw),
        steps: Array.isArray(record?.steps) ? record.steps : [],
        teamRoster: record?.teamRoster || record?.players || record?.members || [],
        imageUrls: getImageUrls(record),
        searchText: [
            displayId,
            customerName,
            groupName,
            serviceLabel,
            record?.service,
            record?.item,
            contact?.phone,
            sourceStatus,
            entityType,
            record?.archivedBy,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
    };
};

export const normalizeBookingRecord = (record = {}) => buildRecord(record, 'booking');

export const normalizeOrderRecord = (record = {}) => buildRecord(record, 'order');

export const buildReleasedRecords = ({ bookings = [], orders = [] }) => {
    const normalized = [
        ...(Array.isArray(bookings) ? bookings : []).map(normalizeBookingRecord),
        ...(Array.isArray(orders) ? orders : []).map(normalizeOrderRecord),
    ];

    return normalized.filter((record) => record.sourceStatus === 'Released' && !record.isArchived);
};

export const buildArchivedRecords = ({ bookings = [], orders = [] }) => {
    const normalized = [
        ...(Array.isArray(bookings) ? bookings : []).map(normalizeBookingRecord),
        ...(Array.isArray(orders) ? orders : []).map(normalizeOrderRecord),
    ];

    return normalized.filter((record) => record.isArchived);
};

export const canArchiveRecord = (record = {}) =>
    Boolean(record) &&
    !record.isArchived &&
    ['Released', 'Cancelled'].includes(String(record?.sourceStatus || ''));
