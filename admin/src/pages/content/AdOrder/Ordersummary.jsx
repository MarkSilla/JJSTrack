import React, { useMemo } from 'react';
import { isOverdue, getDropDate } from '../../../utils/helpers.js';
import { getPickupSlotDisplay } from '../../../utils/pickupSlot.js';

const PESO_SYMBOL = '\u20B1';

const ADD_ON_CONFIG = {
    warmer: { label: 'Long Sleeve Warmer', price: 750 },
    hoodie: { label: 'Hoodie T-shirt', price: 700 },
};

const ORG_PRODUCT_TYPES = {
    tshirt: { label: 'T-Shirt', price: 500 },
    polo: { label: 'Polo Shirt', price: 650 },
};

const formatCurrency = (value) => `${PESO_SYMBOL}${Number(value || 0).toLocaleString()}`;

const getAddOnMeta = (addOnId) =>
    ADD_ON_CONFIG[addOnId] || {
        label: addOnId || 'Add-on',
        price: 0,
    };

const getParticipantName = (participant, index) => {
    const fullName = [participant?.firstName, participant?.surname].filter(Boolean).join(' ').trim();
    return fullName || participant?.name || `Player ${index + 1}`;
};

const DEFAULT_POCKET_PRICE = 100;

const getItemTotal = (item) =>
    ((Number(item?.qty) || 1) * (Number(item?.unitPrice) || 0)) + (Number(item?.addOnPrice) || 0);

const normalizeStepLabel = (label = '') =>
    String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ');

const ROLE_META = {
    layoutArtist: 'Layout Artist',
    presser: 'Presser',
    tailor: 'Tailor',
};

export default function OrderSummary({ activeOrder, participants = [], bookingExtras = null, serviceType = '' }) {
    const isOrg = String(serviceType || '').toLowerCase().includes('organization');
    const displayItems = useMemo(() => {
        const invoiceItems = Array.isArray(activeOrder?.invoice?.items) ? activeOrder.invoice.items : [];
        const participantList = Array.isArray(participants) ? participants : [];
        const hasExplicitAddOnItems = invoiceItems.some((item) =>
            (item?.addOnPrice > 0) || (item?.addOn && item.addOn !== 'None' && item.addOn !== 'Add-on') || (item?.addOn === 'Add-on')
        );
        const derivedAddOnItems = !hasExplicitAddOnItems
            ? participantList.flatMap((participant, index) =>
                (Array.isArray(participant?.addOns) ? participant.addOns : []).map((addOnId, addOnIndex) => {
                    const addOnMeta = getAddOnMeta(addOnId);
                    const participantName = getParticipantName(participant, index);
                    const numberSuffix = participant?.number ? ` #${participant.number}` : '';

                    return {
                        id: `derived-addon-${index}-${addOnIndex}-${addOnId}`,
                        description: `${addOnMeta.label} (${participantName}${numberSuffix})`,
                        qty: 1,
                        unitPrice: addOnMeta.price,
                        addOnPrice: 0,
                    };
                })
            )
            : [];

        const mappedInvoiceItems = invoiceItems.map((item, index) => {
            const player = participantList[index];
            if (!player) return item;

            let itemType;
            if (isOrg) {
                // Organization: use productType field (tshirt, polo)
                const orgProduct = ORG_PRODUCT_TYPES[player.productType];
                itemType = orgProduct?.label || player.productType || 'Org Item';
            } else {
                // Team Jersey: use classification field
                const classif = player.classification || '';
                if (classif.toLowerCase().includes('jersey only')) itemType = 'Jersey Only';
                else if (classif.toLowerCase().includes('short only')) itemType = 'Short Only';
                else if (classif.toLowerCase() === 'full set') itemType = 'Full Set (Jersey + Shorts)';
                else itemType = classif || 'Full Set';
            }

            const surname = player.surname || player.name || `Player ${index + 1}`;
            const addOnEntries = Array.isArray(player.addOns) ? player.addOns.map(id => getAddOnMeta(id)) : [];
            const hasPocket = Boolean(player.pockets || player.hasPocketShorts);

            // Recalculate add-on price from roster data to fix manual DB errors
            const calculatedAddOnPrice = addOnEntries.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0) + (hasPocket ? DEFAULT_POCKET_PRICE : 0);

            // For org orders, use per-product pricing from roster data instead of the flat backend price
            const correctedUnitPrice = isOrg
                ? (ORG_PRODUCT_TYPES[player.productType]?.price || item.unitPrice || 0)
                : item.unitPrice;

            return {
                ...item,
                surname,
                itemType,
                unitPrice: correctedUnitPrice,
                addOnPrice: isOrg ? 0 : calculatedAddOnPrice, // Org orders don't have jersey add-ons
                addonsText: isOrg ? null : `Add-ons: ${addOnEntries.length > 0 ? addOnEntries.map(a => a.label).join(', ') : 'None'}`,
                pocketText: isOrg ? null : `Pocket: ${hasPocket ? 'Yes' : 'No'}`,
                isRosterItem: true
            };
        });

        return [...mappedInvoiceItems, ...derivedAddOnItems];
    }, [activeOrder, participants, isOrg]);

    const totalPrice = useMemo(() => {
        // Source of truth: sum of calculated items to ensure accuracy
        const calculatedTotal = displayItems.reduce((sum, item) => sum + getItemTotal(item), 0);

        if (calculatedTotal > 0) return calculatedTotal;

        // Fallback to database total only if no items or calculation resulted in 0
        return Number(activeOrder?.invoice?.total || activeOrder?.totalPrice || 0);
    }, [activeOrder, displayItems]);

    const displayDueDate = bookingExtras?.pickupDate || activeOrder?.pickupDate || activeOrder?.invoice?.dueDate || activeOrder?.estimatedCompletion || 'N/A';
    const displayTimeRange = getPickupSlotDisplay(bookingExtras?.pickupSlot || activeOrder?.pickupSlot || '', 'N/A');
    const visibleOrderId = useMemo(() => {
        if (!activeOrder) return '';
        if (activeOrder.isBooking) {
            return activeOrder.displayId || bookingExtras?.bookingId || activeOrder.id || activeOrder._id || '';
        }
        return activeOrder.displayId || activeOrder.orderId || activeOrder.id || activeOrder._id || '';
    }, [activeOrder, bookingExtras]);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-gray-50 shrink-0">
                <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase mb-3">Order Details</h4>
                <div className="flex gap-x-8">
                    {/* Left Column */}
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Order ID</span>
                            <span className="text-sm font-bold text-gray-900">{visibleOrderId}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Drop Date</span>
                            <span className="text-sm font-bold text-gray-900">{getDropDate(activeOrder)}</span>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Due Date</span>
                            <span className={`text-sm font-bold ${isOverdue(bookingExtras?.pickupDate || activeOrder?.pickupDate || activeOrder?.invoice?.dueDate || activeOrder?.estimatedCompletion) ? 'text-red-500' : 'text-gray-900'}`}>
                                {activeOrder?.invoice?.dueDate
                                    ? new Date(activeOrder.invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : displayDueDate}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Pickup Time</span>
                            <span className="text-sm font-bold text-gray-900">{displayTimeRange}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 pb-2 bg-white">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3 px-1 pr-3">
                    <div className="col-span-4">Surname</div>
                    <div className="col-span-4">Item</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-3 text-right">Price</div>
                </div>
                <div className="space-y-4 mb-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                    {displayItems.map((item, idx) => (
                        <div key={item.id || `${item.description}-${idx}`} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0 px-1">
                            {item.isRosterItem ? (
                                <>
                                    <div className="grid grid-cols-12 gap-2 items-center text-[12px]">
                                        <div className="col-span-4 font-extrabold text-blue-900 truncate">{item.surname}</div>
                                        <div className="col-span-4 font-semibold text-gray-700 truncate" title={item.itemType}>{item.itemType}</div>
                                        <div className="col-span-1 font-bold text-gray-500 text-center">{item.qty || 1}</div>
                                        <div className="col-span-3 font-black text-gray-900 text-right">{formatCurrency(getItemTotal(item))}</div>
                                    </div>
                                    {(item.addonsText || item.pocketText) && (
                                        <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                            {item.addonsText && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{item.addonsText}</span>}
                                            {item.pocketText && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{item.pocketText}</span>}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="grid grid-cols-12 gap-2 items-center text-[12px]">
                                    <div className="col-span-8 font-extrabold text-gray-800 truncate">{item.description}</div>
                                    <div className="col-span-1 font-bold text-gray-500 text-center">{item.qty || 1}</div>
                                    <div className="col-span-3 font-black text-gray-900 text-right">{formatCurrency(getItemTotal(item))}</div>
                                </div>
                            )}
                        </div>
                    ))}
                    {displayItems.length === 0 && (
                        <div className="text-center py-8 text-gray-300 text-xs font-bold uppercase tracking-widest">
                            No items recorded
                        </div>
                    )}
                </div>
                <div className="mt-2 pt-3 border-t-2 border-dashed border-gray-100 flex justify-between items-center px-1">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-1">Total amount to pay</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-blue-600 tracking-tight">
                            {formatCurrency(totalPrice)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
