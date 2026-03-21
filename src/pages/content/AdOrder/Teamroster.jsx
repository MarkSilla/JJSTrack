import React from 'react';
import { User } from 'lucide-react';

export default function TeamRoster({ players }) {
    if (!players || players.length === 0) return null;

    return (
        <div className="bg-white border text-sm border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
                <User size={18} className="text-orange-500" />Team Roster
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Player Name</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-center">Number</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-center">Size</th>
                            <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-right">Name Print</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                                <td className="py-3 font-bold text-gray-900">{player.surname || '—'}</td>
                                <td className="py-3 text-center font-semibold text-gray-600">{player.number || '—'}</td>
                                <td className="py-3 text-center font-black text-blue-600 bg-blue-50/30 rounded">{player.jerseySize || '—'}</td>
                                <td className="py-3 text-right font-medium text-gray-600">
                                    {player.pockets ? (
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-[11px] font-bold">YES</span>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-400 rounded-md text-[11px] font-bold">NO</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}