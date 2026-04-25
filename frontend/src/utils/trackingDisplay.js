const normalizeValue = (value) => {
    if (!value) return ''

    if (typeof value === 'string') {
        return value.trim()
    }

    return value?.toString?.() || ''
}

const extractSuffixAfterDash = (value = '') => {
    const match = String(value || '').match(/^[^-]+-\s*(.+)$/)
    return normalizeValue(match?.[1] || '')
}

export const getTrackingDisplayName = (entry = {}) => {
    const bookingType = normalizeValue(entry?.bookingType).toLowerCase()

    if (bookingType === 'jersey') {
        return (
            normalizeValue(entry?.teamName) ||
            normalizeValue(entry?.service) ||
            'Team Jersey'
        )
    }

    if (bookingType === 'organizational') {
        return (
            normalizeValue(entry?.orgName) ||
            normalizeValue(entry?.service) ||
            'Organization'
        )
    }

    if (bookingType === 'repair') {
        return (
            normalizeValue(entry?.repairDescription) ||
            normalizeValue(entry?.service) ||
            normalizeValue(entry?.item) ||
            'Repair'
        )
    }

    const serviceType = normalizeValue(entry?.serviceType).toLowerCase()
    const item = normalizeValue(entry?.item)

    if (serviceType === 'team jersey' || item.toLowerCase().startsWith('team jersey -')) {
        return extractSuffixAfterDash(item) || item || 'Team Jersey'
    }

    if (item.toLowerCase().startsWith('organizational -')) {
        return extractSuffixAfterDash(item) || item || 'Organization'
    }

    return (
        item ||
        normalizeValue(entry?.service) ||
        normalizeValue(entry?.itemName) ||
        normalizeValue(entry?.orgName) ||
        normalizeValue(entry?.teamName) ||
        'Booking'
    )
}
