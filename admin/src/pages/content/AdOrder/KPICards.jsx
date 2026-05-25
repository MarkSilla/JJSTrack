import React from 'react';
import { CheckCircle2, Clock, Check, AlertCircle, Package } from 'lucide-react';

export default function KPICards({ counts }) {
    const cards = [
        { label: 'In Progress', value: counts['In Progress'], icon: Clock, color: '#D97706', sub: 'Currently active' },
        { label: 'Released', value: counts.Released, icon: Package, color: '#06B6D4', sub: 'Ready to ship' },
        { label: 'Ready', value: counts.Completed, icon: Check, color: '#059669', sub: 'Finished orders' },
        { label: 'Overdue', value: counts.Overdue, icon: AlertCircle, color: '#DC2626', sub: 'Past due date' },
        { label: 'Total Orders', value: counts.All, icon: CheckCircle2, color: '#2563EB', sub: 'All appointments' },
    ];

    return (
        <div className="mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                {cards.map((card, index) => (
                    <div
                        key={card.label}
                        className={`bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default border border-slate-100/50
                            ${index === 4 ? 'col-span-2 lg:col-span-1' : 'col-span-1 lg:col-span-1'}
                        `}
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                    >
                        <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: card.color }} />
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-3">
                            <div
                                className={`rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${index === 4 ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-9 sm:h-9'}`}
                                style={{ background: card.color + "1A" }}
                            >
                                <card.icon size={index === 4 ? 14 : 13} color={card.color} strokeWidth={2.5} className="sm:hidden" />
                                <card.icon size={16} color={card.color} strokeWidth={2.2} className="hidden sm:block" />
                            </div>
                            <span className={`text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight max-w-none`}>{card.label}</span>
                        </div>
                        <div className={`leading-none tracking-tight font-black sm:font-extrabold text-gray-900 ${index === 4 ? 'mt-0 sm:mt-[-14px] text-[16px] sm:text-[22px] pl-[40px] sm:pl-[45px]' : 'mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] pl-[36px] sm:pl-[45px] text-left'
                            }`}>
                            {card.value}
                        </div>
                        <div className={`block text-[9px] text-gray-400 mt-1 sm:mt-0.5 opacity-80 sm:opacity-100 ${index === 4 ? 'pl-[40px] sm:pl-[45px]' : 'pl-[36px] sm:pl-[45px]'}`}>{card.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}