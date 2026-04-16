import React from 'react';
import { CheckCircle2, Clock, Check, AlertCircle, Package } from 'lucide-react';

export default function KPICards({ counts }) {
    const cards = [
        { label: 'Total Orders', value: counts.All, icon: CheckCircle2, color: '#2563EB', sub: 'All appointments' },
        { label: 'In Progress', value: counts['In Progress'], icon: Clock, color: '#D97706', sub: 'Currently active' },
        { label: 'Released', value: counts.Released, icon: Package, color: '#06B6D4', sub: 'Ready to ship' },
        { label: 'Ready', value: counts.Completed, icon: Check, color: '#059669', sub: 'Finished orders' },
        { label: 'Overdue', value: counts.Overdue, icon: AlertCircle, color: '#DC2626', sub: 'Past due date' },
    ];

    return (
        <div className="overflow-x-auto mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 min-w-max lg:min-w-full">
                {cards.map(card => (
                    <div
                        key={card.label}
                        className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                    >
                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: card.color }} />
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                                    style={{ background: card.color + "1A" }}
                                >
                                    <card.icon size={16} color={card.color} strokeWidth={2.2} />
                                </div>
                                <span className="text-[12px] font-semibold text-gray-500">{card.label}</span>
                            </div>
                        </div>
                        <div className="mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">
                            {card.value}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{card.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}