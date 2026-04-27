import React, { useMemo } from 'react';
import { isOverdue, getDropDate } from '../../../utils/helpers.js';
import { getPickupSlotDisplay } from '../../../utils/pickupSlot.js';

const PESO_SYMBOL = '\u20B1';

const ADD_ON_CONFIG = {
    warmer: { label: 'Long Sleeve Warmer', price: 750 },
    hoodie: { label: 'Hoodie T-shirt', price: 700 },
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

export default function OrderSummary({ activeOrder, participants = [], bookingExtras = null }) {
    const displayItems = useMemo(() => {
        const invoiceItems = Array.isArray(activeOrder?.invoice?.items) ? activeOrder.invoice.items : [];
        const participantList = Array.isArray(participants) ? participants : [];
        const hasExplicitAddOnItems = invoiceItems.some((item) => item?.addOn === 'Add-on');
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

        return [...invoiceItems, ...derivedAddOnItems];
    }, [activeOrder, participants]);

    const totalPrice = useMemo(() => {
        if (displayItems.length > 0) {
            return displayItems.reduce((sum, item) => sum + getItemTotal(item), 0);
        }

        return Number(activeOrder?.invoice?.total || activeOrder?.totalPrice || 0);
    }, [activeOrder, displayItems]);

    const displayDueDate = bookingExtras?.pickupDate || activeOrder?.pickupDate || activeOrder?.invoice?.dueDate || activeOrder?.estimatedCompletion || 'N/A';
    const displayTimeRange = getPickupSlotDisplay(bookingExtras?.pickupSlot || activeOrder?.pickupSlot || '', 'N/A');
    const visibleRoles = useMemo(() => {
        const labels = (Array.isArray(activeOrder?.steps) ? activeOrder.steps : [])
            .map((step) => normalizeStepLabel(step?.label || step));

        const roles = [];
        if (labels.includes('layout') || labels.includes('printing')) roles.push('layoutArtist');
        if (labels.includes('pressing')) roles.push('presser');
        if (labels.includes('sewing') || roles.length === 0) roles.push('tailor');
        return roles;
    }, [activeOrder]);
    const productionAssignments = {
        tailor: activeOrder?.staffAssignments?.tailor || activeOrder?.assignedTailor || '',
        presser: activeOrder?.staffAssignments?.presser || '',
        layoutArtist: activeOrder?.staffAssignments?.layoutArtist || '',
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-gray-50">
                <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase mb-3">Order Details</h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-500">Drop Date</span>
                        <span className="font-bold text-gray-900">{getDropDate(activeOrder)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-500">Due Date</span>
                        <span className={`font-bold ${isOverdue(bookingExtras?.pickupDate || activeOrder?.pickupDate || activeOrder?.invoice?.dueDate || activeOrder?.estimatedCompletion) ? 'text-red-500' : 'text-gray-900'}`}>
                            {activeOrder?.invoice?.dueDate
                                ? new Date(activeOrder.invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : displayDueDate}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-500">Pickup Time</span>
                        <span className="font-bold text-gray-900">{displayTimeRange}</span>
                    </div>
                    {visibleRoles.map((roleKey) => (
                        <div key={roleKey} className="flex justify-between items-center text-sm gap-3">
                            <span className="font-semibold text-gray-500">{ROLE_META[roleKey]}</span>
                            <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded text-right">
                                {productionAssignments[roleKey] || 'Unassigned'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 bg-white">
                <div className="space-y-3 mb-4">
                    {displayItems.map((item, idx) => (
                        <div key={item.id || `${item.description}-${idx}`} className="flex justify-between items-start text-sm">
                            <div className="pr-4">
                                <div className="font-semibold text-gray-800 line-clamp-1">{item.description}</div>
                                <div className="text-[11px] font-medium text-gray-400 mt-0.5">Qty: {item.qty || 1}</div>
                            </div>
                            <div className="font-bold text-gray-900 whitespace-nowrap">
                                {formatCurrency(getItemTotal(item))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Total Price</span>
                    <span className="text-lg font-black text-gray-900">
                        {formatCurrency(totalPrice)}
                    </span>
                </div>
            </div>
        </div>
    );
}
