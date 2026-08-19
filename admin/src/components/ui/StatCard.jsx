import React from 'react'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'

const VARIANT_STYLES = {
  default: {
    bg: 'bg-white',
    border: 'border border-slate-200/80',
    accent: 'var(--brand-primary)',
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/60',
  },
  compact: {
    bg: 'bg-white',
    border: 'border border-slate-200/80',
    accent: '#64748b',
    iconBg: 'bg-slate-100 text-slate-600 border border-slate-200/60',
  },
  success: {
    bg: 'bg-white',
    border: 'border border-slate-200/80',
    accent: '#059669',
    iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  warning: {
    bg: 'bg-white',
    border: 'border border-slate-200/80',
    accent: '#d97706',
    iconBg: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  danger: {
    bg: 'bg-white',
    border: 'border border-slate-200/80',
    accent: '#dc2626',
    iconBg: 'bg-red-50 text-red-700 border border-red-100',
  },
  analytics: {
    bg: 'bg-slate-900 text-white',
    border: 'border border-slate-800',
    accent: '#38bdf8',
    iconBg: 'bg-slate-800 text-sky-400 border border-slate-700',
  },
}

export default function StatCard({
  variant = 'default',
  icon: Icon,
  label,
  value,
  sub,
  subtitle,
  trend,
  action,
  footer,
  loading = false,
  accentColor,
  onClick,
  className = '',
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default
  const isInteractive = Boolean(onClick)
  const isDark = variant === 'analytics'
  const displaySub = sub || subtitle

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(e)
    }
  }

  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-xl p-4 border border-slate-200/80 bg-white shadow-xs animate-pulse min-h-[96px] ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100" />
            <div className="w-20 h-3 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="w-16 h-6 bg-slate-100 rounded mb-1" />
        <div className="w-24 h-2.5 bg-slate-100 rounded" />
      </div>
    )
  }

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={`relative overflow-hidden rounded-xl transition-all duration-200 group text-left w-full select-none ${styles.bg} ${styles.border} ${
        isInteractive ? 'cursor-pointer hover:shadow-md hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none' : 'cursor-default'
      } ${variant === 'compact' ? 'p-3' : 'p-4'} ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${styles.iconBg}`}
              style={!variant.includes('analytics') && accentColor ? { backgroundColor: `${accentColor}12`, color: accentColor, borderColor: `${accentColor}25` } : undefined}
            >
              {React.isValidElement(Icon) ? Icon : <Icon size={16} strokeWidth={2} />}
            </div>
          )}
          <div className="min-w-0">
            <span className={`block text-xs font-semibold leading-tight truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {label}
            </span>
          </div>
        </div>

        {/* Action Slot */}
        {action && <div className="shrink-0 ml-2">{action}</div>}

        {/* Trend Indicator */}
        {trend && !action && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-0.5 shrink-0 ${
              typeof trend === 'object'
                ? trend.positive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {typeof trend === 'object' && (
              trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />
            )}
            <span>{typeof trend === 'object' ? `${trend.value}%` : trend}</span>
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className={`font-bold tracking-tight leading-none ${variant === 'compact' ? 'text-lg sm:text-xl mt-1.5' : 'text-xl sm:text-2xl mt-1.5'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>

      {/* Subtitle / Description */}
      {displaySub && (
        <div className={`text-xs mt-1.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {displaySub}
        </div>
      )}

      {/* Optional Footer Slot */}
      {footer && <div className="mt-3 pt-2.5 border-t border-slate-100">{footer}</div>}
    </div>
  )
}
