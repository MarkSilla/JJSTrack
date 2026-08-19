import React from 'react'
import { Inbox, Lightbulb } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  primaryAction,
  secondaryAction,
  tips,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-xl bg-white border border-slate-200/80 shadow-xs ${className}`}>
      {/* Icon Container */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
        <Icon size={24} strokeWidth={1.75} />
      </div>

      {/* Title & Description */}
      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug m-0">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-0 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-xs border-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {primaryAction.icon && <primaryAction.icon size={14} />}
              <span>{primaryAction.label}</span>
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-all border-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {secondaryAction.icon && <secondaryAction.icon size={14} />}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}

      {/* Helpful Tips Section */}
      {tips && (
        <div className="mt-5 pt-4 border-t border-slate-100 w-full max-w-sm text-left">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1.5">
            <Lightbulb size={13} className="text-amber-500 shrink-0" />
            <span>Helpful Tip</span>
          </div>
          {Array.isArray(tips) ? (
            <ul className="m-0 p-0 pl-4 text-xs text-slate-600 space-y-1">
              {tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-slate-600">{tips}</div>
          )}
        </div>
      )}
    </div>
  )
}
