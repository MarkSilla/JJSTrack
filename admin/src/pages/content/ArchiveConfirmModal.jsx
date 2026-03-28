import React from 'react';  
import { Archive, RotateCw, X, Check, AlertCircle } from 'lucide-react';

function ArchiveConfirmModal({ archiveConfirm, onConfirm, onCancel }) {
  if (!archiveConfirm.show) return null;

  const isRestore = archiveConfirm.isRestore;
  const Icon = isRestore ? RotateCw : Archive;
  const header = isRestore ? 'Restore Item' : 'Archive Item';
  const action = isRestore ? 'restore' : 'archive';
  const btnText = isRestore ? 'Restore Item' : 'Archive Item';
  const btnClass = isRestore ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700';
  const iconClass = isRestore ? 'text-emerald-600' : 'text-red-600';
  const bgClass = isRestore ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200';
  const textClass = isRestore ? 'text-emerald-700' : 'text-red-700';
  const descText = isRestore 
    ? 'This item will be moved back to your active inventory list and will appear in searches.'
    : 'This item will be hidden from the active inventory and moved to the archived section.';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 ${isRestore ? 'bg-emerald-500/10 border-b border-emerald-200/50' : 'bg-red-500/10 border-b border-red-200/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isRestore ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <Icon size={20} className={iconClass} />
              </div>
              {header}
            </h3>
            <button 
              onClick={onCancel} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-slate-600">Are you sure you want to {action} this item?</p>
        </div>
        
        <div className="p-6">
          <div className={`p-4 rounded-xl mb-6 border ${bgClass}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                <AlertCircle size={20} className={textClass} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-slate-900 truncate">{archiveConfirm.itemName}</p>
                <p className="text-sm font-medium mt-1">{action.toUpperCase()}</p>
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${textClass}`}>
              {descText}
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all duration-200 px-4"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 ${btnClass}`}
          >
            <Check size={16} />
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArchiveConfirmModal;

