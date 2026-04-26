import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Clock3,
  Package,
  ShieldAlert,
  X,
} from 'lucide-react';

const getPreferredActiveTab = ({
  overdueItems = [],
  outOfStockItems = [],
  dueSoonItems = [],
  lowStockItems = [],
}) => {
  if (overdueItems.length > 0 || dueSoonItems.length > 0) return 'orders';
  if (outOfStockItems.length > 0 || lowStockItems.length > 0) return 'inventory';
  return null;
};

const getPreferredExpandedSection = (activeTab, sections = []) => {
  if (activeTab === 'orders') {
    if (sections.some((section) => section.id === 'overdue' && section.items.length > 0)) {
      return 'overdue';
    }

    if (sections.some((section) => section.id === 'dueSoon' && section.items.length > 0)) {
      return 'dueSoon';
    }
  }

  if (activeTab === 'inventory') {
    if (sections.some((section) => section.id === 'outOfStock' && section.items.length > 0)) {
      return 'outOfStock';
    }

    if (sections.some((section) => section.id === 'lowStock' && section.items.length > 0)) {
      return 'lowStock';
    }
  }

  return sections.find((section) => section.items.length > 0)?.id || null;
};

function InventoryAlertRow({ item, tone = 'amber', onNavigate }) {
  const stock = Math.max(0, Number(item?.stock) || 0);
  const minStock = Math.max(0, Number(item?.minStock) || 0);
  const pct =
    stock === 0 || minStock === 0
      ? 0
      : Math.min(100, Math.round((stock / minStock) * 100));

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="w-full px-4 py-3 border-t border-white/[0.05] text-left hover:bg-white/[0.03] transition-colors"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="text-slate-200 font-semibold text-sm truncate">{item.name}</div>
          <div className="text-slate-500 text-xs mt-0.5">
            {item.sku ? <span>SKU: {item.sku} - </span> : null}
            <span>{item.category || 'Inventory'}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span
            className={`inline-flex items-center justify-center px-2 h-5 rounded-full text-[11px] font-bold border ${
              tone === 'red'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {stock === 0 ? '0 left' : `${stock} / ${minStock || item.minStock || 0}`}
          </span>
          <div className="text-slate-500 text-[10px] mt-0.5">
            {stock === 0 ? 'Needs restock' : `${pct}% remaining`}
          </div>
        </div>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            tone === 'red' ? 'bg-red-500' : pct < 30 ? 'bg-red-500' : 'bg-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

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
            {item.customerName} - {item.subjectLabel}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {item.scheduleLabel} - {item.status || 'Pending'}
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

export function StockAlertModal({
  lowStockItems = [],
  outOfStockItems = [],
  dueSoonItems = [],
  overdueItems = [],
  onClose,
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(() =>
    getPreferredActiveTab({
      lowStockItems,
      outOfStockItems,
      dueSoonItems,
      overdueItems,
    })
  );
  const [expandedSection, setExpandedSection] = useState(null);

  const hasStockAlerts = lowStockItems.length > 0 || outOfStockItems.length > 0;
  const hasDueDateAlerts = dueSoonItems.length > 0 || overdueItems.length > 0;
  const hasAlerts = hasStockAlerts || hasDueDateAlerts;

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

  const inventorySections = useMemo(
    () => [
      {
        id: 'outOfStock',
        title: 'Out of Stock',
        items: outOfStockItems,
        icon: Package,
        buttonClass:
          'border border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.07]',
        titleClass: 'text-red-300',
        iconClass: 'text-red-400',
        badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/25',
        renderRow: (item) => (
          <InventoryAlertRow
            key={item._id}
            item={item}
            tone="red"
            onNavigate={() => handleNavigate('/admin/inventory')}
          />
        ),
      },
      {
        id: 'lowStock',
        title: 'Low Stock',
        items: lowStockItems,
        icon: AlertTriangle,
        buttonClass:
          'border border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.07]',
        titleClass: 'text-amber-300',
        iconClass: 'text-amber-400',
        badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
        renderRow: (item) => (
          <InventoryAlertRow
            key={item._id}
            item={item}
            tone="amber"
            onNavigate={() => handleNavigate('/admin/inventory')}
          />
        ),
      },
    ],
    [lowStockItems, outOfStockItems]
  );

  const orderSections = useMemo(
    () => [
      {
        id: 'overdue',
        title: 'Overdue',
        items: overdueItems,
        icon: ShieldAlert,
        buttonClass:
          'border border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.07]',
        titleClass: 'text-red-300',
        iconClass: 'text-red-400',
        badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/25',
        renderRow: (item) => (
          <DueDateAlertRow
            key={item.alertKey}
            item={item}
            tone="red"
            onNavigate={() => handleNavigate(item.route || '/admin/orders')}
          />
        ),
      },
      {
        id: 'dueSoon',
        title: 'Nearing Due Dates',
        items: dueSoonItems,
        icon: Clock3,
        buttonClass:
          'border border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.07]',
        titleClass: 'text-amber-300',
        iconClass: 'text-amber-400',
        badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
        renderRow: (item) => (
          <DueDateAlertRow
            key={item.alertKey}
            item={item}
            tone="amber"
            onNavigate={() => handleNavigate(item.route || '/admin/orders')}
          />
        ),
      },
    ],
    [dueSoonItems, overdueItems]
  );

  const tabs = useMemo(
    () =>
      [
        {
          id: 'inventory',
          label: 'Inventory Alerts',
          items: [...outOfStockItems, ...lowStockItems],
        },
        {
          id: 'orders',
          label: 'Order Alerts',
          items: [...overdueItems, ...dueSoonItems],
        },
      ].filter((tab) => tab.items.length > 0),
    [dueSoonItems, lowStockItems, outOfStockItems, overdueItems]
  );

  const activeSections = activeTab === 'orders' ? orderSections : inventorySections;
  const totalAlerts = tabs.reduce((count, tab) => count + tab.items.length, 0);

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
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(
        getPreferredActiveTab({
          lowStockItems,
          outOfStockItems,
          dueSoonItems,
          overdueItems,
        })
      );
    }
  }, [activeTab, dueSoonItems, lowStockItems, outOfStockItems, overdueItems, tabs]);

  useEffect(() => {
    const nextExpandedSection = getPreferredExpandedSection(activeTab, activeSections);

    if (
      !activeSections.some(
        (section) => section.id === expandedSection && section.items.length > 0
      )
    ) {
      setExpandedSection(nextExpandedSection);
    }
  }, [activeSections, activeTab, expandedSection]);

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
        className={`w-full max-w-2xl flex flex-col max-h-[85vh] rounded-2xl border border-slate-700/40 bg-[#0F172A] shadow-2xl transition-all duration-300 ${
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
                Operations Alert
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

        <div className="px-3 pt-3 border-b border-slate-700/30">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border-slate-600'
                      : 'bg-slate-900/70 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto p-3 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600/40">
          {activeSections
            .filter((section) => section.items.length > 0)
            .map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;

              return (
                <div key={section.id} className={`rounded-xl overflow-hidden ${section.buttonClass}`}>
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
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

          {activeTab === 'orders' ? (
            <button
              type="button"
              onClick={() => handleNavigate('/admin/orders')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white border border-blue-500/30 hover:bg-blue-500 hover:-translate-y-px active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30"
            >
              View Orders <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNavigate('/admin/inventory')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white border border-blue-500/30 hover:bg-blue-500 hover:-translate-y-px active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30"
            >
              Go to Inventory <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
