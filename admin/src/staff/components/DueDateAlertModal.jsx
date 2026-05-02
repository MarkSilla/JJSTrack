import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Clock3, ShieldAlert, X } from 'lucide-react';

const getPreferredExpandedSection = ({ overdueItems = [], dueSoonItems = [] }) => {
  if (overdueItems.length > 0) return 'overdue';
  if (dueSoonItems.length > 0) return 'dueSoon';
  return null;
};

function DueDateAlertRow({ item, tone = 'amber', onNavigate }) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="w-full px-4 py-3 border-t border-white/[0.05] text-left hover:bg-white/[0.03] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-100 font-semibold text-sm truncate">
              {item.reference}
            </span>
            <span
              className={`inline-flex items-center justify-center px-2 h-5 rounded-full text-[10px] font-bold border ${
                tone === 'red'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}
            >
              {item.relativeLabel}
            </span>
          </div>
          <div className="text-slate-300 text-xs mt-1 truncate">
            {item.customerName} · {item.subjectLabel}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {item.scheduleLabel} · {item.status || 'Pending'}
          </div>
        </div>
        <ArrowRight
          size={14}
          className={tone === 'red' ? 'text-red-400 shrink-0' : 'text-amber-300 shrink-0'}
        />
      </div>
    </button>
  );
}

export function DueDateAlertModal({
  dueSoonItems = [],
  overdueItems = [],
  onClose,
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState(() =>
    getPreferredExpandedSection({ dueSoonItems, overdueItems })
  );

  const hasAlerts = dueSoonItems.length > 0 || overdueItems.length > 0;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleNavigate = (route) => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      navigate(route);
    }, 250);
  };

  const sections = useMemo(
    () => [
      {
        id: 'overdue',
        title: 'Overdue',
        items: overdueItems,
        icon: ShieldAlert,
        buttonClass:
          'hover:bg-red-500/[0.07] text-left border border-red-500/20 bg-red-500/[0.04]',
        titleClass: 'text-red-300',
        iconClass: 'text-red-400',
        badgeClass:
          'bg-red-500/15 text-red-400 border border-red-500/25',
        renderRow: (item) => (
          <DueDateAlertRow
            key={item.alertKey}
            item={item}
            tone="red"
            onNavigate={() => handleNavigate(item.route || '/staff/orders')}
          />
        ),
      },
      {
        id: 'dueSoon',
        title: 'Nearing Due Dates',
        items: dueSoonItems,
        icon: Clock3,
        buttonClass:
          'hover:bg-amber-500/[0.07] text-left border border-amber-500/20 bg-amber-500/[0.03]',
        titleClass: 'text-amber-300',
        iconClass: 'text-amber-400',
        badgeClass:
          'bg-amber-500/15 text-amber-400 border border-amber-500/25',
        renderRow: (item) => (
          <DueDateAlertRow
            key={item.alertKey}
            item={item}
            tone="amber"
            onNavigate={() => handleNavigate(item.route || '/staff/orders')}
          />
        ),
      },
    ],
    [dueSoonItems, overdueItems]
  );

  const totalAlerts = useMemo(
    () => sections.reduce((count, section) => count + section.items.length, 0),
    [sections]
  );

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!sections.some((section) => section.id === expandedSection && section.items.length > 0)) {
      setExpandedSection(getPreferredExpandedSection({ dueSoonItems, overdueItems }));
    }
  }, [dueSoonItems, expandedSection, overdueItems, sections]);

  if (!hasAlerts) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 20000 }}
      className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm bg-[#02061780] ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-xl flex flex-col max-h-[85vh] rounded-2xl border border-slate-700/40 bg-[#0F172A] shadow-2xl transition-all duration-300 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-lg leading-tight tracking-tight">
                Task Alert
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                <span className="text-slate-500 text-xs">
                  {totalAlerts} alert{totalAlerts > 1 ? 's' : ''} need attention
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg bg-slate-700/40 border border-slate-600/30 flex items-center justify-center shrink-0 hover:bg-slate-600/50 transition-colors"
          >
            <X size={13} className="text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600/40">
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;

              return (
                <div key={section.id} className={`rounded-xl overflow-hidden ${section.buttonClass}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSection(isExpanded ? null : section.id)
                    }
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={section.iconClass} />
                      <span className={`${section.titleClass} font-semibold text-sm`}>
                        {section.title}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${section.badgeClass}`}
                      >
                        {section.items.length}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`${section.iconClass} transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExpanded ? section.items.map(section.renderRow) : null}
                </div>
              );
            })}
        </div>

        <div className="grid gap-2 p-3 border-t border-slate-700/30 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-700/40 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50 hover:-translate-y-px active:scale-[0.98] transition-all"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('/staff/orders')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white border border-blue-500/30 hover:bg-blue-500 hover:-translate-y-px active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30"
          >
            View Orders <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
