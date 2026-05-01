import React, { useMemo, useState } from 'react';
import { User, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PESO_SYMBOL = '\u20B1';
const DEFAULT_POCKET_PRICE = 100;
const ITEMS_PER_PAGE = 7;

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

export default function TeamRoster({ players, invoiceItems = [], teamName = 'N/A', customerContact = 'N/A' }) {
    const [currentPage, setCurrentPage] = useState(1);

    const baseItems = useMemo(
        () => (Array.isArray(invoiceItems) ? invoiceItems.filter((item) => item?.addOn !== 'Add-on') : []),
        [invoiceItems]
    );

    if (!players || players.length === 0) return null;

    const totalPages = Math.ceil(players.length / ITEMS_PER_PAGE);
    const paginatedPlayers = players.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, players.length);

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF();
            const safeTeamName = String(teamName || 'N/A');
            const safeCustomerContact = String(customerContact || 'N/A');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(40, 40, 40);
            doc.text("JJS SPORTSWEAR", 105, 20, { align: "center" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("CONTACT: 0908 997 2332", 105, 26, { align: "center" });
            doc.text("Purok 3B National Highway,Calapacuan, Subic, Zambales", 105, 31, { align: "center" });

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 38, 196, 38);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text("TEAM NAME: ", 14, 48);
            doc.setFont("helvetica", "normal");
            doc.text(safeTeamName.toUpperCase(), 45, 48);
            doc.line(45, 49, 120, 49);

            doc.setFont("helvetica", "bold");
            doc.text("CONTACT: ", 130, 48);
            doc.setFont("helvetica", "normal");
            doc.text(safeCustomerContact, 155, 48);
            doc.line(155, 49, 196, 49);
            const tableColumn = [
                { header: "NO.", dataKey: "no" },
                { header: "FULL NAME", dataKey: "name" },
                { header: "NUMBER", dataKey: "number" },
                { header: "JERSEY SIZE", dataKey: "jSize" },
                { header: "SHORT SIZE", dataKey: "sSize" },
                { header: "ADD-ONS", dataKey: "addons" },
                { header: "POCKETS", dataKey: "pockets" }
            ];

            const tableRows = players.map((player, idx) => {
                const addOnEntries = Array.isArray(player?.addOns)
                    ? player.addOns.map((addOnId) => ({ id: addOnId, ...getAddOnMeta(addOnId) }))
                    : [];
                const hasPocket = Boolean(player?.pockets || player?.hasPocketShorts);
                const addOnText = addOnEntries.length > 0 ? addOnEntries.map(a => a.label).join(", ") : "None";
                const jerseySize = player?.jerseySize || player?.size || 'N/A';
                const shortSize = player?.shortSize || 'N/A';

                return {
                    no: `${idx + 1}.`,
                    name: getPlayerName(player, idx).toUpperCase(),
                    number: player?.number || 'N/A',
                    jSize: jerseySize,
                    sSize: shortSize,
                    addons: addOnText,
                    pockets: hasPocket ? "YES" : "NO"
                };
            });

            autoTable(doc, {
                columns: tableColumn,
                body: tableRows,
                startY: 55,
                theme: 'grid',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                    halign: 'center'
                },
                bodyStyles: {
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                    fontSize: 9
                },
                columnStyles: {
                    no: { halign: 'center', cellWidth: 12 },
                    number: { halign: 'center', cellWidth: 20 },
                    jSize: { halign: 'center', cellWidth: 25 },
                    sSize: { halign: 'center', cellWidth: 25 },
                    pockets: { halign: 'center', cellWidth: 20 }
                },
                margin: { left: 14, right: 14 }
            });

            doc.save(`ROSTER_${safeTeamName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please check the console for details.');
        }
    };

    return (
        <div className="bg-white border text-sm border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <User size={18} className="text-orange-500" /> Team Roster
                    </h3>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Download size={14} />
                        Download PDF
                    </button>
                </div>
                <div className="overflow-x-auto min-h-[400px]">
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
                            {paginatedPlayers.map((player, idx) => {
                                const realIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                                const addOnEntries = Array.isArray(player?.addOns)
                                    ? player.addOns.map((addOnId) => ({ id: addOnId, ...getAddOnMeta(addOnId) }))
                                    : [];
                                const baseItem = baseItems[realIdx];
                                const pocketPrice = Number(baseItem?.addOnPrice) || (player?.pockets || player?.hasPocketShorts ? DEFAULT_POCKET_PRICE : 0);
                                const hasPocket = Boolean(player?.pockets || player?.hasPocketShorts);
                                const addOnTotal = addOnEntries.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);
                                const rowTotal = Number(baseItem?.unitPrice || 0) + pocketPrice + addOnTotal;

                                return (
                                    <tr key={`${getPlayerName(player, idx)}-${player?.number || idx}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                                        <td className="py-3 font-bold text-gray-900">{getPlayerName(player, realIdx)}</td>
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

            {/* Pagination Footer */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-lg border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black transition-all cursor-pointer ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                    : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-300'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-lg border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Showing <span className="text-gray-900">{startIndex}-{endIndex}</span> of <span className="text-gray-900">{players.length}</span>
                </div>
            </div>
        </div>
    );
}
