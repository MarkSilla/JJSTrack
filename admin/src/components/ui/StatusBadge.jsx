import React from 'react'

const STATUS_TOKEN_MAP = {
  // Booking & Order Statuses
  pending: { bg: 'var(--status-pending-bg)', text: 'var(--status-pending-text)', border: 'var(--status-pending-border)' },
  'in progress': { bg: 'var(--status-progress-bg)', text: 'var(--status-progress-text)', border: 'var(--status-progress-border)' },
  'in-progress': { bg: 'var(--status-progress-bg)', text: 'var(--status-progress-text)', border: 'var(--status-progress-border)' },
  complete: { bg: 'var(--status-completed-bg)', text: 'var(--status-completed-text)', border: 'var(--status-completed-border)' },
  completed: { bg: 'var(--status-completed-bg)', text: 'var(--status-completed-text)', border: 'var(--status-completed-border)' },
  ready: { bg: 'var(--status-completed-bg)', text: 'var(--status-completed-text)', border: 'var(--status-completed-border)' },
  released: { bg: 'var(--status-released-bg)', text: 'var(--status-released-text)', border: 'var(--status-released-border)' },
  overdue: { bg: 'var(--status-overdue-bg)', text: 'var(--status-overdue-text)', border: 'var(--status-overdue-border)' },
  cancelled: { bg: 'var(--status-cancelled-bg)', text: 'var(--status-cancelled-text)', border: 'var(--status-cancelled-border)' },
  'cancel/incomplete': { bg: 'var(--status-cancelled-bg)', text: 'var(--status-cancelled-text)', border: 'var(--status-cancelled-border)' },
  confirmed: { bg: 'var(--status-confirmed-bg)', text: 'var(--status-confirmed-text)', border: 'var(--status-confirmed-border)' },
  approved: { bg: 'var(--status-confirmed-bg)', text: 'var(--status-confirmed-text)', border: 'var(--status-confirmed-border)' },

  // Service Types
  repair: { bg: 'var(--status-repair-bg)', text: 'var(--status-repair-text)', border: 'var(--status-repair-border)' },
  jersey: { bg: 'var(--status-jersey-bg)', text: 'var(--status-jersey-text)', border: 'var(--status-jersey-border)' },
  'team jersey': { bg: 'var(--status-jersey-bg)', text: 'var(--status-jersey-text)', border: 'var(--status-jersey-border)' },
  organization: { bg: 'var(--status-org-bg)', text: 'var(--status-org-text)', border: 'var(--status-org-border)' },
  org: { bg: 'var(--status-org-bg)', text: 'var(--status-org-text)', border: 'var(--status-org-border)' },

  // Stock Statuses
  'low stock': { bg: 'var(--status-pending-bg)', text: 'var(--status-pending-text)', border: 'var(--status-pending-border)' },
  'out of stock': { bg: 'var(--status-cancelled-bg)', text: 'var(--status-cancelled-text)', border: 'var(--status-cancelled-border)' },
  active: { bg: 'var(--status-completed-bg)', text: 'var(--status-completed-text)', border: 'var(--status-completed-border)' },
  inactive: { bg: 'var(--status-default-bg)', text: 'var(--status-default-text)', border: 'var(--status-default-border)' },
}

const DEFAULT_TOKEN = {
  bg: 'var(--status-default-bg)',
  text: 'var(--status-default-text)',
  border: 'var(--status-default-border)',
}

const SIZE_MAP = {
  xs: 'text-xs px-2 py-0.5 font-semibold',
  sm: 'text-xs px-2.5 py-0.5 font-semibold',
  md: 'text-xs px-3 py-1 font-semibold',
  lg: 'text-sm px-3.5 py-1.5 font-semibold',
}

export default function StatusBadge({
  status = 'default',
  label,
  size = 'sm',
  variant = 'soft',
  icon: Icon,
  className = '',
  onClick,
}) {
  const normalizedKey = String(status || '').toLowerCase().trim()
  const token = STATUS_TOKEN_MAP[normalizedKey] || DEFAULT_TOKEN
  const displayLabel = label || status || 'Default'
  const isInteractive = Boolean(onClick)

  let styleProps = {}

  if (variant === 'soft') {
    styleProps = {
      backgroundColor: token.bg,
      color: token.text,
      borderColor: token.border,
    }
  } else if (variant === 'solid') {
    styleProps = {
      backgroundColor: token.text,
      color: '#ffffff',
    }
  } else if (variant === 'outline') {
    styleProps = {
      backgroundColor: 'transparent',
      color: token.text,
      borderColor: token.text,
    }
  }

  return (
    <span
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-saas leading-none whitespace-nowrap ${SIZE_MAP[size] || SIZE_MAP.sm} ${
        isInteractive ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-default'
      } ${className}`}
      style={styleProps}
    >
      {Icon && <Icon size={size === 'xs' ? 10 : size === 'lg' ? 14 : 12} className="shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  )
}
