import React from 'react';
import { CheckCircle2, Clock, Check, AlertCircle } from 'lucide-react';

export default function KPICards({ counts }) {
    const cards = [
        { label: 'Total Orders', value: counts.All, icon: CheckCircle2, color: '#2563EB', sub: 'All appointments' },
        { label: 'In Progress', value: counts['In Progress'], icon: Clock, color: '#D97706', sub: 'Currently active' },
        { label: 'Ready', value: counts.Ready, icon: Check, color: '#059669', sub: 'Ready for pickup' },
        { label: 'Overdue', value: counts.Overdue, icon: AlertCircle, color: '#DC2626', sub: 'Past due date' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {cards.map(card => (
                <div
                    key={card.label}
                    className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                >
                    <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: card.color }} />
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                            style={{ background: card.color + "18", border: `1.5px solid ${card.color}30` }}
                        >
                            <card.icon size={16} color={card.color} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-gray-500">{card.label}</div>
                            <div className="text-[16px] font-extrabold text-gray-900 leading-none mt-0.5">{card.value}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}