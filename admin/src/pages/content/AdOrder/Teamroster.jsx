import React, { useMemo } from 'react';
import { User } from 'lucide-react';

const PESO_SYMBOL = '\u20B1';
const DEFAULT_POCKET_PRICE = 100;

const ADD_ON_CONFIG = {
    warmer: { label: 'Long Sleeve Warmer', price: 750 },
    hoodie: { label: 'Hoodie T-shirt', price: 700 },
};

const formatCurrency = (value) => `${PESO_SYMBOL}${Number(value || 0).toLocaleString()}`;

const getAddOnMeta = (addOnId) => ADD_ON_CONFIG[addOnId] || { label: addOnId, price: 0 };

const getPlayerName = (player, index) => {
    const fullName = [player?.firstName, player?.surname].filter(Boolean).join(' ').trim();
    return fullName || player?.name || `Player ${index + 1}`;
};

const getPlayerSize = (player) => {
    const jerseySize = player?.jerseySize || player?.size || '';
    const shortSize = player?.shortSize || '';

    if (jerseySize && shortSize) {
        return `${jerseySize} / ${shortSize}`;
    }

    return jerseySize || shortSize || 'N/A';
};

export default function TeamRoster({ players, invoiceItems = [] }) {
    const baseItems = useMemo(
        () => (Array.isArray(invoiceItems) ? invoiceItems.filter((item) => item?.addOn !== 'Add-on') : []),
        [invoiceItems]
    );

    if (!players || players.length === 0) return null;

    return (
        <div className="bg-white border text-sm border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
                <User size={18} className="text-orange-500" /> Team Roster
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Player Name</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-center">Number</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-center">Size</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Add-ons</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Pockets</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, idx) => {
                            const addOnEntries = Array.isArray(player?.addOns)
                                ? player.addOns.map((addOnId) => ({ id: addOnId, ...getAddOnMeta(addOnId) }))
                                : [];
                            const baseItem = baseItems[idx];
                            const pocketPrice = Number(baseItem?.addOnPrice) || (player?.pockets || player?.hasPocketShorts ? DEFAULT_POCKET_PRICE : 0);
                            const hasPocket = Boolean(player?.pockets || player?.hasPocketShorts);
                            const addOnTotal = addOnEntries.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);
                            const rowTotal = Number(baseItem?.unitPrice || 0) + pocketPrice + addOnTotal;

                            return (
                                <tr key={`${getPlayerName(player, idx)}-${player?.number || idx}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                                    <td className="py-3 font-bold text-gray-900">{getPlayerName(player, idx)}</td>
                                    <td className="py-3 text-center font-semibold text-gray-600">{player?.number || 'N/A'}</td>
                                    <td className="py-3 text-center font-black text-blue-600 bg-blue-50/30 rounded">{getPlayerSize(player)}</td>
                                    <td className="py-3 font-medium text-gray-600">
                                        {addOnEntries.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {addOnEntries.map((addOn) => (
                                                    <span key={`${player?.number || idx}-${addOn.id}`} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-[10px] font-bold border border-green-200 whitespace-nowrap">
                                                        {addOn.label}
                                                        {addOn.price > 0 ? ` (+${formatCurrency(addOn.price)})` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">None</span>
                                        )}
                                    </td>
                                    <td className="py-3 font-medium text-gray-600">
                                        {hasPocket ? (
                                            <span className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-[11px] font-bold border border-amber-200 whitespace-nowrap">
                                                Pocket Short {pocketPrice > 0 ? `(+${formatCurrency(pocketPrice)})` : ''}
                                            </span>
                                        ) : (
                                            <span className="inline-flex px-2.5 py-1 bg-white border border-gray-200 text-gray-400 rounded-md text-[11px] font-bold whitespace-nowrap">
                                                None
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 text-right font-black text-gray-900 whitespace-nowrap">
                                        {rowTotal > 0 ? formatCurrency(rowTotal) : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
