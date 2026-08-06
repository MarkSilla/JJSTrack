import React from 'react'
import { ChevronRight } from 'lucide-react'

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  badge,
  className = '',
}) {
  return (
    <div className={`mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0 flex-1">
        {/* Optional Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-slate-300" />}
                {crumb.onClick ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="hover:text-slate-600 transition-colors border-none bg-transparent p-0 cursor-pointer text-xs"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={idx === breadcrumbs.length - 1 ? 'font-bold text-slate-700' : ''}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight m-0">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0 leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
}) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={18} className="text-blue-600 shrink-0" />}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate m-0">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 m-0 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
