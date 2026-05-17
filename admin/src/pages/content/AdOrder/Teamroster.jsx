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

const ORG_PRODUCT_TYPES = {
    tshirt: 'T-Shirt',
    polo: 'Polo Shirt',
};

const formatCurrency = (value) => `${PESO_SYMBOL}${Number(value || 0).toLocaleString()}`;

const getAddOnMeta = (addOnId) => {
    const key = String(addOnId).toLowerCase();
    return ADD_ON_CONFIG[key] || { label: addOnId, price: 0 };
};

const getPlayerName = (player, index) => {
    const fullName = [player?.firstName, player?.surname].filter(Boolean).join(' ').trim();
    return fullName || player?.name || `Player ${index + 1}`;
};

/* ── Team Jersey size helpers ─────────────────────────────── */
const getJerseySizeText = (player) => {
    if (player?.useManualjerseySize) {
        return `${player.jerseyLength || '-'}" x ${player.jerseyBody || '-'}"`;
    }
    if (player?.useManualSize) {
        return `${player.manualBody || '-'}" x ${player.manualLength || '-'}" x ${player.manualSleeveLength || '-'}"`;
    }
    return player?.jerseySize || player?.size || 'N/A';
};

const getShortSizeText = (player) => {
    if (player?.useManualsShortSize) {
        return `${player.shortHips || '-'}" x ${player.shortLength || '-'}"`;
    }
    return player?.shortSize || 'N/A';
};

/* ── Organization size helpers ────────────────────────────── */
const getOrgSizeText = (member) => {
    if (member?.useManualSize) {
        return `${member.manualBody || '-'}" x ${member.manualLength || '-'}" x ${member.manualSleeveLength || '-'}"`;
    }
    return member?.size || member?.jerseySize || 'N/A';
};

const getOrgShirtType = (member) => {
    const productType = member?.productType || '';
    return ORG_PRODUCT_TYPES[productType] || productType || 'N/A';
};

export default function TeamRoster({ players, invoiceItems = [], teamName = 'N/A', customerContact = 'N/A', serviceType = '' }) {
    const [currentPage, setCurrentPage] = useState(1);

    const isOrg = String(serviceType || '').toLowerCase().includes('organization');

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
            const nameLabel = isOrg ? "ORGANIZATION: " : "TEAM NAME: ";
            doc.text(nameLabel, 14, 48);
            doc.setFont("helvetica", "normal");
            const nameLabelWidth = doc.getTextWidth(nameLabel);
            doc.text(safeTeamName.toUpperCase(), 14 + nameLabelWidth, 48);
            doc.line(14 + nameLabelWidth, 49, 120, 49);

            doc.setFont("helvetica", "bold");
            doc.text("CONTACT: ", 130, 48);
            doc.setFont("helvetica", "normal");
            doc.text(safeCustomerContact, 155, 48);
            doc.line(155, 49, 196, 49);

            let tableColumn, tableRows;

            if (isOrg) {
                // ── Organization PDF columns ──
                tableColumn = [
                    { header: "NO.", dataKey: "no" },
                    { header: "NAME", dataKey: "name" },
                    { header: "NUMBER", dataKey: "number" },
                    { header: "SHIRT TYPE", dataKey: "shirtType" },
                    { header: "SIZE", dataKey: "size" },
                ];
                tableRows = players.map((member, idx) => ({
                    no: `${idx + 1}.`,
                    name: getPlayerName(member, idx).toUpperCase(),
                    number: member?.number || '—',
                    shirtType: getOrgShirtType(member),
                    size: getOrgSizeText(member),
                }));
            } else {
                // ── Team Jersey PDF columns ──
                tableColumn = [
                    { header: "NO.", dataKey: "no" },
                    { header: "SURNAME", dataKey: "name" },
                    { header: "NUMBER", dataKey: "number" },
                    { header: "JERSEY SIZE", dataKey: "jSize" },
                    { header: "SHORT SIZE", dataKey: "sSize" },
                    { header: "ADD-ONS", dataKey: "addons" },
                    { header: "POCKETS", dataKey: "pockets" }
                ];
                tableRows = players.map((player, idx) => {
                    const addOnEntries = Array.isArray(player?.addOns)
                        ? player.addOns.map((addOnId) => ({ id: addOnId, ...getAddOnMeta(addOnId) }))
                        : [];
                    const hasPocket = Boolean(player?.pockets || player?.hasPocketShorts);
                    const addOnText = addOnEntries.length > 0 ? addOnEntries.map(a => a.label).join(", ") : "None";

                    return {
                        no: `${idx + 1}.`,
                        name: getPlayerName(player, idx).toUpperCase(),
                        number: player?.number || 'N/A',
                        jSize: getJerseySizeText(player),
                        sSize: getShortSizeText(player),
                        addons: addOnText,
                        pockets: hasPocket ? "YES" : "NO"
                    };
                });
            }

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
                columnStyles: isOrg
                    ? {
                        no: { halign: 'center', cellWidth: 12 },
                        number: { halign: 'center', cellWidth: 20 },
                        shirtType: { halign: 'center', cellWidth: 30 },
                        size: { halign: 'center', cellWidth: 35 },
                    }
                    : {
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

    /* ── Render ────────────────────────────────────────────── */
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden font-inter">
            {/* Premium Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[12px] font-black text-gray-300 uppercase tracking-wider">Lineup Details</h3>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-200"
                    >
                        <Download size={14} />
                        Download PDF
                    </button>
                </div>

                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-2">
                    <div className="text-center mb-5">
                        <h2 className="text-xl font-black tracking-tight text-gray-900">JJS SPORTSWEAR</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Contact: 0908 997 2332</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Purok 3B National Highway, Calapacuan, Subic, Zambales</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-end gap-2">
                            <span className="text-[10px] font-black text-blue-600/70 uppercase  mb-1">{isOrg ? 'Organization:' : 'Team Name:'}</span>
                            <span className="flex-1 border-b-2 border-gray-200 px-2 py-0.5 text-sm font-extrabold text-gray-800 uppercase truncate">
                                {teamName}
                            </span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-[10px] font-black text-blue-600/70 uppercase mb-1">Contact Info:</span>
                            <span className="flex-1 border-b-2 border-gray-200 px-2 py-0.5 text-sm font-extrabold text-gray-800 truncate">
                                {customerContact}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 pt-2">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse border border-gray-200">
                        <thead>
                            {isOrg ? (
                                /* ── Organization table header ── */
                                <tr className="bg-gray-50/80">
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-12">No.</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-20">Number</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Shirt Type</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Sizes</th>
                                </tr>
                            ) : (
                                /* ── Team Jersey table header ── */
                                <tr className="bg-gray-50/80">
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-12">No.</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Full Name</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-20">Number</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Jersey Size</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Short Size</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Add-ons</th>
                                    <th className="border border-gray-200 p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-24">Pockets</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {paginatedPlayers.map((player, idx) => {
                                const realIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;

                                if (isOrg) {
                                    /* ── Organization row ── */
                                    return (
                                        <tr key={`${getPlayerName(player, idx)}-${player?.number || idx}`} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="border border-gray-200 p-3 text-center text-xs font-bold text-gray-400">{realIdx + 1}.</td>
                                            <td className="border border-gray-200 p-3 text-xs font-extrabold text-gray-900 uppercase">{getPlayerName(player, realIdx)}</td>
                                            <td className="border border-gray-200 p-3 text-center text-xs font-black text-blue-600">{player?.number || '—'}</td>
                                            <td className="border border-gray-200 p-3 text-center text-xs font-bold text-gray-700 bg-gray-50/30">{getOrgShirtType(player)}</td>
                                            <td className="border border-gray-200 p-3 text-center text-xs font-bold text-gray-700">{getOrgSizeText(player)}</td>
                                        </tr>
                                    );
                                }

                                /* ── Team Jersey row (unchanged) ── */
                                const addOnEntries = Array.isArray(player?.addOns)
                                    ? player.addOns.map((addOnId) => ({ id: addOnId, ...getAddOnMeta(addOnId) }))
                                    : [];
                                const baseItem = baseItems[realIdx];
                                const pocketPrice = Number(baseItem?.addOnPrice) || (player?.pockets || player?.hasPocketShorts ? DEFAULT_POCKET_PRICE : 0);
                                const hasPocket = Boolean(player?.pockets || player?.hasPocketShorts);
                                const addOnTotal = addOnEntries.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);
                                const rowTotal = Number(baseItem?.unitPrice || 0) + pocketPrice + addOnTotal;

                                return (
                                    <tr key={`${getPlayerName(player, idx)}-${player?.number || idx}`} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="border border-gray-200 p-3 text-center text-xs font-bold text-gray-400">{realIdx + 1}.</td>
                                        <td className="border border-gray-200 p-3 text-xs font-extrabold text-gray-900 uppercase">{getPlayerName(player, realIdx)}</td>
                                        <td className="border border-gray-200 p-3 text-center text-xs font-black text-blue-600">{player?.number || '—'}</td>
                                        <td className="border border-gray-200 p-3 text-center text-xs font-bold text-gray-700 bg-gray-50/30">{getJerseySizeText(player)}</td>
                                        <td className="border border-gray-200 p-3 text-center text-xs font-bold text-gray-700">{getShortSizeText(player)}</td>
                                        <td className="border border-gray-200 p-3">
                                            {addOnEntries.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {addOnEntries.map((addOn) => (
                                                        <span key={`${player?.number || idx}-${addOn.id}`} className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase">
                                                            {addOn.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 italic">None</span>
                                            )}
                                        </td>
                                        <td className="border border-gray-200 p-3 text-center">
                                            {hasPocket ? (
                                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 uppercase">
                                                    No
                                                </span>
                                            )}
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
