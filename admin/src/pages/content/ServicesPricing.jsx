import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Save, PhilippinePeso, BadgeInfo, History, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { pricingApi } from '../../services/pricingApi'

const DEFAULT_PRICING = {
    repair: {
        serviceType: 'repair',
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
        organizationalProducts: {
            tshirt: 500,
            polo: 650,
        },
    },
}

const LABELS = {
    repairOptions: {
        zipper: 'Zipper Replacement',
        button: 'Button Replacement',
        hem: 'Hem Adjustment',
        waist: 'Waist Adjustment',
        patch: 'Patch / Mending',
        lining: 'Lining Repair',
        sleeve: 'Sleeve Adjustment',
        general: 'General Repair',
        others: 'Others',
    },
    jerseyProducts: {
        jersey: 'Jersey Only',
        fullset: 'Full Set (Jersey + Shorts)',
        short: 'Short Only',
    },
    jerseyAddOns: {
        warmer: 'Long Sleeve Warmer',
        hoodie: 'Hoodie T-shirt',
    },
    organizationalProducts: {
        tshirt: 'T-Shirt',
        polo: 'Polo Shirt',
    },
}

const PRICING_HISTORY_KEY = 'jjs-services-pricing-history'

const mergePricing = (items = []) => {
    const byType = (Array.isArray(items) ? items : []).reduce((acc, item) => {
        if (item?.serviceType) acc[item.serviceType] = item
        return acc
    }, {})

    return Object.entries(DEFAULT_PRICING).reduce((acc, [serviceType, defaults]) => {
        const saved = byType[serviceType] || {}
        acc[serviceType] = {
            ...defaults,
            ...saved,
            repairOptions: { ...(defaults.repairOptions || {}), ...(saved.repairOptions || {}) },
            jerseyProducts: { ...(defaults.jerseyProducts || {}), ...(saved.jerseyProducts || {}) },
            jerseyAddOns: { ...(defaults.jerseyAddOns || {}), ...(saved.jerseyAddOns || {}) },
            organizationalProducts: { ...(defaults.organizationalProducts || {}), ...(saved.organizationalProducts || {}) },
        }
        return acc
    }, {})
}

const toNumber = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const getSanitizedPricing = (currentPricing) => ({
    ...currentPricing,
    repair: {
        ...currentPricing.repair,
        repairOptions: Object.fromEntries(Object.entries(currentPricing.repair.repairOptions).map(([key, value]) => [key, toNumber(value)])),
    },
    jersey: {
        ...currentPricing.jersey,
        pocketPrice: toNumber(currentPricing.jersey.pocketPrice),
        jerseyProducts: Object.fromEntries(Object.entries(currentPricing.jersey.jerseyProducts).map(([key, value]) => [key, toNumber(value)])),
        jerseyAddOns: Object.fromEntries(Object.entries(currentPricing.jersey.jerseyAddOns).map(([key, value]) => [key, toNumber(value)])),
    },
    organizational: {
        ...currentPricing.organizational,
        organizationalProducts: Object.fromEntries(Object.entries(currentPricing.organizational.organizationalProducts).map(([key, value]) => [key, toNumber(value)])),
    },
})

const collectPriceFields = (currentPricing = {}) => [
    ...Object.entries(currentPricing.repair?.repairOptions || {}).map(([key, value]) => ({
        id: `repair.repairOptions.${key}`,
        section: 'Repair',
        label: LABELS.repairOptions[key] || key,
        value: toNumber(value),
    })),
    ...Object.entries(currentPricing.jersey?.jerseyProducts || {}).map(([key, value]) => ({
        id: `jersey.jerseyProducts.${key}`,
        section: 'Team Jersey',
        label: LABELS.jerseyProducts[key] || key,
        value: toNumber(value),
    })),
    ...Object.entries(currentPricing.jersey?.jerseyAddOns || {}).map(([key, value]) => ({
        id: `jersey.jerseyAddOns.${key}`,
        section: 'Team Jersey',
        label: LABELS.jerseyAddOns[key] || key,
        value: toNumber(value),
    })),
    {
        id: 'jersey.pocketPrice',
        section: 'Team Jersey',
        label: 'Shorts with Pockets',
        value: toNumber(currentPricing.jersey?.pocketPrice),
    },
    ...Object.entries(currentPricing.organizational?.organizationalProducts || {}).map(([key, value]) => ({
        id: `organizational.organizationalProducts.${key}`,
        section: 'Organizational / Company Shirt',
        label: LABELS.organizationalProducts[key] || key,
        value: toNumber(value),
    })),
]

const getPriceChanges = (previousPricing, nextPricing) => {
    const previousFields = new Map(collectPriceFields(previousPricing).map((field) => [field.id, field]))

    return collectPriceFields(nextPricing)
        .map((field) => {
            const previous = previousFields.get(field.id)
            const before = previous?.value ?? 0
            const delta = field.value - before

            return {
                ...field,
                before,
                after: field.value,
                delta,
                direction: delta > 0 ? 'added' : 'deducted',
            }
        })
        .filter((field) => field.delta !== 0)
}

const formatPeso = (value) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(value)

const formatDateTime = (date) =>
    new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date))

const PriceInput = ({ label, value, onChange }) => (
    <label className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/40 transition duration-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 text-sm font-bold leading-snug text-slate-700 group-hover:text-blue-700">{label}</span>
        <span className="flex h-11 w-full shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 sm:w-36">
            <PhilippinePeso size={15} className="text-slate-400" />
            <input
                type="number"
                min="0"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full bg-transparent px-2 text-right text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
            />
        </span>
    </label>
)

const PriceSection = ({ title, description, children }) => (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-white px-4 py-4 sm:px-6">
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 bg-slate-50/60 p-4 sm:p-5 lg:grid-cols-2">{children}</div>
    </section>
)

const PriceHistoryPanel = ({ history }) => (
    <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-white px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <History size={18} />
                </span>
                <div>
                    <h2 className="text-base font-bold text-slate-800">Price Change History</h2>
                    <p className="text-xs font-semibold text-slate-500">Latest saved changes with date and price movement.</p>
                </div>
            </div>
        </div>
        <div className="max-h-[620px] space-y-3 overflow-y-auto bg-slate-50/60 p-4 sm:p-5">
            {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-bold text-slate-600">No price history yet</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Changes will appear here after you save updated prices.</p>
                </div>
            ) : (
                history.map((record) => (
                    <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{formatDateTime(record.date)}</p>
                        <div className="mt-3 space-y-2">
                            {record.changes.map((change) => (
                                <div key={`${record.id}-${change.id}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-700">{change.label}</p>
                                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{change.section}</p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                                                change.delta > 0 ? 'bg-blue-100 text-blue-700' : 'bg-rose-50 text-rose-600'
                                            }`}
                                        >
                                            {change.delta > 0 ? '+' : '-'}
                                            {formatPeso(Math.abs(change.delta))}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs font-semibold text-slate-500">
                                        {formatPeso(change.before)} to {formatPeso(change.after)} ({change.direction})
                                    </p>
                                </div>
                            ))}
                        </div>
                    </article>
                ))
            )}
        </div>
    </aside>
)

const ServicesPricing = () => {
    const [pricing, setPricing] = useState(() => mergePricing())
    const [savedPricing, setSavedPricing] = useState(() => mergePricing())
    const [priceHistory, setPriceHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(PRICING_HISTORY_KEY) || '[]')
        } catch {
            return []
        }
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const serviceCount = useMemo(() => {
        const repair = Object.keys(pricing.repair?.repairOptions || {}).length
        const jersey = Object.keys(pricing.jersey?.jerseyProducts || {}).length + Object.keys(pricing.jersey?.jerseyAddOns || {}).length + 1
        const org = Object.keys(pricing.organizational?.organizationalProducts || {}).length
        return repair + jersey + org
    }, [pricing])

    const loadPricing = async () => {
        try {
            setLoading(true)
            const response = await pricingApi.getAllPricing()
            const mergedPricing = mergePricing(response.data || response.pricing)
            setPricing(mergedPricing)
            setSavedPricing(mergedPricing)
        } catch (error) {
            console.error('Failed to load services pricing:', error)
            toast.error('Could not load saved pricing. Showing defaults.')
            const defaultPricing = mergePricing()
            setPricing(defaultPricing)
            setSavedPricing(defaultPricing)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPricing()
    }, [])

    useEffect(() => {
        localStorage.setItem(PRICING_HISTORY_KEY, JSON.stringify(priceHistory))
    }, [priceHistory])

    const setMapValue = (serviceType, mapName, key, value) => {
        setPricing((current) => ({
            ...current,
            [serviceType]: {
                ...current[serviceType],
                [mapName]: {
                    ...current[serviceType][mapName],
                    [key]: value,
                },
            },
        }))
    }

    const setValue = (serviceType, key, value) => {
        setPricing((current) => ({
            ...current,
            [serviceType]: {
                ...current[serviceType],
                [key]: value,
            },
        }))
    }

    const savePricing = async () => {
        try {
            setSaving(true)
            const nextPricing = getSanitizedPricing(pricing)
            const repairOptions = nextPricing.repair.repairOptions
            const jerseyProducts = nextPricing.jersey.jerseyProducts
            const jerseyAddOns = nextPricing.jersey.jerseyAddOns
            const organizationalProducts = nextPricing.organizational.organizationalProducts
            const changes = getPriceChanges(savedPricing, nextPricing)

            await Promise.all([
                pricingApi.saveOrUpdatePricing('repair', { repairOptions }),
                pricingApi.saveOrUpdatePricing('jersey', {
                    basePerPlayer: jerseyProducts.jersey,
                    pocketPrice: nextPricing.jersey.pocketPrice,
                    jerseyProducts,
                    jerseyAddOns,
                }),
                pricingApi.saveOrUpdatePricing('organizational', {
                    basePerItem: organizationalProducts.tshirt,
                    organizationalProducts,
                }),
            ])

            if (changes.length > 0) {
                setPriceHistory((current) => [
                    {
                        id: `${Date.now()}`,
                        date: new Date().toISOString(),
                        changes,
                    },
                    ...current,
                ].slice(0, 12))
            }

            setSavedPricing(nextPricing)
            toast.success('Services pricing updated.')
            await loadPricing()
        } catch (error) {
            console.error('Failed to save services pricing:', error)
            toast.error(error?.response?.data?.message || 'Failed to save services pricing.')
        } finally {
            setSaving(false)
        }
    }

    const resetToDefaults = () => {
        setPricing(mergePricing())
        toast.info('Default prices loaded. Click Save Prices to apply.')
    }

    return (
        <div className="font-inter mx-auto w-full max-w-[1500px] px-4 py-5 text-slate-700 sm:px-6 lg:px-8 lg:py-6">
            <div className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600/70">Management</p>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">Services Pricing</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Update public form prices for repairs, team jerseys, and organizational shirts.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
                        <button
                            type="button"
                            onClick={loadPricing}
                            disabled={loading || saving}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={resetToDefaults}
                            disabled={loading || saving}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RotateCcw size={16} />
                            Back to Default
                        </button>
                        <button
                            type="button"
                            onClick={savePricing}
                            disabled={loading || saving}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Prices'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-700 shadow-sm shadow-blue-100/40">
                <BadgeInfo size={18} className="mt-0.5 shrink-0" />
                <span>{serviceCount} price fields are managed here. Changes appear on the customer booking forms after save.</span>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
                <div className="space-y-5">
                    <PriceSection title="Repair" description="Prices used by the repair options form and repair review total.">
                        {Object.entries(pricing.repair.repairOptions).map(([key, value]) => (
                            <PriceInput
                                key={key}
                                label={LABELS.repairOptions[key] || key}
                                value={value}
                                onChange={(nextValue) => setMapValue('repair', 'repairOptions', key, nextValue)}
                            />
                        ))}
                    </PriceSection>

                    <PriceSection title="Team Jersey" description="Main packages, optional add-ons, and short pocket add-on.">
                        {Object.entries(pricing.jersey.jerseyProducts).map(([key, value]) => (
                            <PriceInput
                                key={key}
                                label={LABELS.jerseyProducts[key] || key}
                                value={value}
                                onChange={(nextValue) => setMapValue('jersey', 'jerseyProducts', key, nextValue)}
                            />
                        ))}
                        {Object.entries(pricing.jersey.jerseyAddOns).map(([key, value]) => (
                            <PriceInput
                                key={key}
                                label={LABELS.jerseyAddOns[key] || key}
                                value={value}
                                onChange={(nextValue) => setMapValue('jersey', 'jerseyAddOns', key, nextValue)}
                            />
                        ))}
                        <PriceInput
                            label="Shorts with Pockets"
                            value={pricing.jersey.pocketPrice}
                            onChange={(nextValue) => setValue('jersey', 'pocketPrice', nextValue)}
                        />
                    </PriceSection>

                    <PriceSection title="Organizational / Company Shirt" description="Prices used by organization, company shirt, t-shirt, and polo bookings.">
                        {Object.entries(pricing.organizational.organizationalProducts).map(([key, value]) => (
                            <PriceInput
                                key={key}
                                label={LABELS.organizationalProducts[key] || key}
                                value={value}
                                onChange={(nextValue) => setMapValue('organizational', 'organizationalProducts', key, nextValue)}
                            />
                        ))}
                    </PriceSection>
                </div>

                <PriceHistoryPanel history={priceHistory} />
            </div>
        </div>
    )
}

export default ServicesPricing
