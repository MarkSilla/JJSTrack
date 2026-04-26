const PICKUP_SLOT_RANGES = {
    morning: '08:00 AM - 12:00 PM',
    afternoon: '01:00 PM - 05:00 PM',
    evening: '05:00 PM - 08:00 PM',
}

const parseTimeToMinutes = (value = '') => {
    const text = String(value || '').trim().toUpperCase()
    const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)

    if (!match) {
        return Number.POSITIVE_INFINITY
    }

    let hour = Number(match[1])
    const minute = Number(match[2])
    const meridiem = match[3]

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return Number.POSITIVE_INFINITY
    }

    if (meridiem === 'PM' && hour !== 12) hour += 12
    if (meridiem === 'AM' && hour === 12) hour = 0

    return hour * 60 + minute
}

export const getPickupSlotRange = (pickupSlot = '') => {
    const raw = String(pickupSlot || '').trim()
    if (!raw) return ''

    const normalized = raw.toLowerCase()
    return PICKUP_SLOT_RANGES[normalized] || raw
}

export const getPickupSlotDisplay = (pickupSlot = '', fallback = '') => {
    const range = getPickupSlotRange(pickupSlot)
    return range || fallback
}

export const getPickupSlotStartLabel = (pickupSlot = '', fallback = '') => {
    const display = getPickupSlotDisplay(pickupSlot, fallback)
    if (!display) return ''

    return display.split(' - ')[0]?.trim() || display
}

export const getPickupSlotSortValue = (pickupSlot = '', fallback = '') =>
    parseTimeToMinutes(getPickupSlotStartLabel(pickupSlot, fallback))

export const getPickupSlotBucket = (pickupSlot = '', fallback = '') => {
    const raw = String(pickupSlot || '').trim().toLowerCase()

    if (!raw || raw === 'no time' || raw === 'not specified') {
        return 'unscheduled'
    }

    if (raw in PICKUP_SLOT_RANGES) {
        return raw
    }

    const startMinutes = getPickupSlotSortValue(pickupSlot, fallback)

    if (!Number.isFinite(startMinutes)) {
        return 'unscheduled'
    }

    if (startMinutes >= 17 * 60) return 'evening'
    if (startMinutes >= 12 * 60) return 'afternoon'
    return 'morning'
}
