export const DEFAULT_SERVICE_PRICING = {
    repair: {
        serviceType: 'repair',
        baseFee: 0,
        repairOptions: {
            zipper: 150,
            button: 50,
            hem: 120,
            waist: 200,
            patch: 180,
            lining: 250,
            sleeve: 180,
            general: 100,
            others: 0,
        },
    },
    jersey: {
        serviceType: 'jersey',
        baseFee: 0,
        basePerPlayer: 550,
        pocketPrice: 100,
        jerseyProducts: {
            jersey: 550,
            fullset: 850,
            short: 400,
        },
        jerseyAddOns: {
            warmer: 750,
            hoodie: 700,
        },
    },
    organizational: {
        serviceType: 'organizational',
        baseFee: 0,
        basePerItem: 500,
        organizationalProducts: {
            tshirt: 500,
            polo: 650,
        },
    },
}

const mapByServiceType = (pricing = []) =>
    (Array.isArray(pricing) ? pricing : []).reduce((acc, item) => {
        if (item?.serviceType) acc[item.serviceType] = item
        return acc
    }, {})

export const mergeServicePricing = (pricing = []) => {
    const incoming = mapByServiceType(pricing)

    return Object.entries(DEFAULT_SERVICE_PRICING).reduce((acc, [serviceType, defaults]) => {
        const saved = incoming[serviceType] || {}
        acc[serviceType] = {
            ...defaults,
            ...saved,
            repairOptions: {
                ...(defaults.repairOptions || {}),
                ...(saved.repairOptions || {}),
            },
            jerseyProducts: {
                ...(defaults.jerseyProducts || {}),
                ...(saved.jerseyProducts || {}),
            },
            jerseyAddOns: {
                ...(defaults.jerseyAddOns || {}),
                ...(saved.jerseyAddOns || {}),
            },
            organizationalProducts: {
                ...(defaults.organizationalProducts || {}),
                ...(saved.organizationalProducts || {}),
            },
        }
        return acc
    }, {})
}

export const formatPeso = (value) => `₱${Number(value || 0).toLocaleString('en-PH')}`
