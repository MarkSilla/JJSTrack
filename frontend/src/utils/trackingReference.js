export const isBookingEntry = (entry = {}) => Boolean(entry?.bookingType)

const normalizeReferenceValue = (value) => {
    if (!value) return ''

    if (typeof value === 'string') {
        return value.trim()
    }

    return value?.toString?.() || ''
}

export const getTrackingReferenceId = (entry = {}) => {
    if (isBookingEntry(entry)) {
        return normalizeReferenceValue(entry?.bookingId)
    }

    return normalizeReferenceValue(entry?.orderId)
}

export const getTrackingReferenceLabel = (entry = {}) =>
    isBookingEntry(entry) ? 'Booking ID' : 'Order ID'

export const getTrackingReferenceCode = (entry = {}, { includeHash = true } = {}) => {
    const referenceId = getTrackingReferenceId(entry)

    if (!referenceId) {
        return includeHash ? '#N/A' : 'N/A'
    }

    return includeHash ? `#${referenceId}` : referenceId
}
