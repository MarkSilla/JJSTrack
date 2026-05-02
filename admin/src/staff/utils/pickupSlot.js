const PICKUP_SLOT_RANGES = {
    morning: '08:00 AM - 12:00 PM',
    afternoon: '01:00 PM - 05:00 PM',
    evening: '05:00 PM - 08:00 PM',
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
