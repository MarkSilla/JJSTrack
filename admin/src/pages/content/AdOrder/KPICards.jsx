import React, { useState } from 'react';
import { CheckCircle2, Clock, Check, AlertCircle, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { StatCard } from '../../../components/ui';

export default function KPICards({ counts, onFilterClick }) {
  const [showAllMobile, setShowAllMobile] = useState(false);

  const cards = [
    { label: 'In Progress', value: counts['In Progress'], icon: Clock, color: '#D97706', sub: 'Currently active', filter: 'In Progress' },
    { label: 'Overdue', value: counts.Overdue, icon: AlertCircle, color: '#DC2626', sub: 'Past due date', filter: 'Overdue' },
    { label: 'Ready', value: counts.Completed, icon: Check, color: '#059669', sub: 'Finished orders', filter: 'Completed' },
    { label: 'Released', value: counts.Released, icon: Package, color: '#06B6D4', sub: 'Ready to ship', filter: 'Released' },
    { label: 'Total Orders', value: counts.All, icon: CheckCircle2, color: '#2563EB', sub: 'All appointments', filter: 'All Records' },
  ];

  const priorityCards = [cards[0], cards[1], cards[2], cards[4]]; // 4 Priority KPIs
  const hiddenCount = cards.length - priorityCards.length;

  return (
    <div className="mb-4">
      {/* Mobile View: 2 Grids with Priority + Expand */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-2 gap-2.5">
          {(showAllMobile ? cards : priorityCards).map((card) => (
            <StatCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              sub={card.sub}
              accentColor={card.color}
              onClick={onFilterClick ? () => onFilterClick(card.filter) : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAllMobile((prev) => !prev)}
          className="mt-3 w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          {showAllMobile ? (
            <>
              <span>Show Priority Metrics Only</span>
              <ChevronUp size={14} className="text-slate-500" />
            </>
          ) : (
            <>
              <span>View All Metrics ({hiddenCount})</span>
              <ChevronDown size={14} className="text-slate-500" />
            </>
          )}
        </button>
      </div>

      {/* Desktop / Tablet View */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            sub={card.sub}
            accentColor={card.color}
            onClick={onFilterClick ? () => onFilterClick(card.filter) : undefined}
          />
        ))}
      </div>
    </div>
  );
}