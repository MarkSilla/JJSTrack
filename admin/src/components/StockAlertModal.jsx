import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X, Package, ChevronDown, ArrowRight, ShieldAlert } from 'lucide-react';

export function StockAlertModal({ lowStockItems = [], outOfStockItems = [], onClose }) {
  const [expandedSection, setExpandedSection] = useState('outOfStock');
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const hasAlerts = lowStockItems.length > 0 || outOfStockItems.length > 0;
  if (!hasAlerts) return null;

  const totalAlerts = lowStockItems.length + outOfStockItems.length;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleGoToInventory = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      navigate('/admin/inventory');
    }, 250);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 20000 }}
      className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm bg-[#02061780]
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-lg flex flex-col max-h-[85vh] rounded-2xl border border-slate-700/40 bg-[#0F172A] shadow-2xl
          transition-all duration-300
          ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-lg leading-tight tracking-tight">
                Inventory Alert
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                <span className="text-slate-500 text-xs">
                  {totalAlerts} item{totalAlerts > 1 ? 's' : ''} need attention
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg bg-slate-700/40 border border-slate-600/30 flex items-center justify-center shrink-0 hover:bg-slate-600/50 transition-colors"
          >
            <X size={13} className="text-slate-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-3 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600/40">

          {/* Out of Stock */}
          {outOfStockItems.length > 0 && (
            <div className="rounded-xl border border-red-500/20 overflow-hidden bg-red-500/[0.04]">
              <button
                onClick={() => setExpandedSection(expandedSection === 'outOfStock' ? null : 'outOfStock')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-500/[0.07] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-red-400" />
                  <span className="text-red-300 font-semibold text-sm">Out of Stock</span>
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                    {outOfStockItems.length}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-red-400 transition-transform duration-200 ${expandedSection === 'outOfStock' ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedSection === 'outOfStock' && outOfStockItems.map((item) => (
                <div key={item._id} className="px-4 py-3 border-t border-white/[0.05]">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="text-slate-200 font-semibold text-sm truncate">{item.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {item.sku && <><span>SKU: {item.sku}</span><span className="mx-1">·</span></>}
                        <span>{item.category}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center px-2 h-5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                      0 left
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500" style={{ width: '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Low Stock */}
          {lowStockItems.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 overflow-hidden bg-amber-500/[0.03]">
              <button
                onClick={() => setExpandedSection(expandedSection === 'lowStock' ? null : 'lowStock')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/[0.07] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span className="text-amber-300 font-semibold text-sm">Low Stock</span>
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    {lowStockItems.length}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-amber-400 transition-transform duration-200 ${expandedSection === 'lowStock' ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedSection === 'lowStock' && lowStockItems.map((item) => {
                const pct = Math.min(100, Math.round((item.stock / (item.minStock || 5)) * 100));
                const barColor = pct < 30 ? 'bg-red-500' : pct < 60 ? 'bg-amber-500' : 'bg-green-500';
                return (
                  <div key={item._id} className="px-4 py-3 border-t border-white/[0.05]">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="text-slate-200 font-semibold text-sm truncate">{item.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">
                          {item.sku && <><span>SKU: {item.sku}</span><span className="mx-1">·</span></>}
                          <span>{item.category}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center justify-center px-2 h-5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {item.stock} / {item.minStock}
                        </span>
                        <div className="text-slate-500 text-[10px] mt-0.5">{pct}% remaining</div>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-3 border-t border-slate-700/30">
          <button
            onClick={handleClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-700/40 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50 hover:-translate-y-px active:scale-[0.98] transition-all"
          >
            Dismiss
          </button>
          <button
            onClick={handleGoToInventory}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white border border-blue-500/30 hover:bg-blue-500 hover:-translate-y-px active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30"
          >
            Go to Inventory <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}