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

const getRepairDisplayLabel = (entry = {}) =>
    normalizeValue(entry?.selectedOptions?.[0]?.name) ||
    normalizeValue(entry?.service) ||
    normalizeValue(entry?.repairDescription) ||
    normalizeValue(entry?.item) ||
    'Repair'

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
        return getRepairDisplayLabel(entry)
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
