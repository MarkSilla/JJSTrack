import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import EmptyState from './EmptyState'

export default function DataCard({
  title,
  subtitle,
  icon: Icon,
  action,
  headerExtra,
  children,
  loading = false,
  empty = false,
  emptyProps,
  error = null,
  onRetry,
  className = '',
  contentClassName = '',
  noPadding = false,
  minHeight,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col transition-saas ${className}`}
      style={{ boxShadow: 'var(--shadow-card)', minHeight }}
    >
      {/* Header */}
      {(title || subtitle || Icon || action || headerExtra) && (
        <div className="p-3.5 sm:p-4 pb-3 border-b border-slate-100 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 min-w-0 w-full">
            <div className="flex items-center gap-2 min-w-0">
              {Icon && <Icon size={18} className="text-blue-600 shrink-0" />}
              {title && (
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight m-0 truncate">
                  {title}
                </h3>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>

          {headerExtra && (
            <div className="flex items-center gap-2 w-full pt-0.5">
              {headerExtra}
            </div>
          )}

          {subtitle && (
            <p className="text-xs text-slate-500 m-0 leading-normal truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Content Body with States */}
      <div className={`flex-1 min-w-0 ${noPadding ? '' : 'p-4 sm:p-5'} ${contentClassName}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Loading details...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-rose-50/50 rounded-xl border border-rose-100">
            <AlertCircle size={24} className="text-rose-500 mb-2" />
            <p className="text-xs font-bold text-rose-800 m-0">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-100 rounded-lg border border-rose-200 transition-saas cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : empty ? (
          <EmptyState {...emptyProps} />
        ) : (
          children
        )}
      </div>
    </div>
  )
}
