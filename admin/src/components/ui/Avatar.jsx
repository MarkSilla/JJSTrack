import React from 'react'
import { User } from 'lucide-react'

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const STATUS_MAP = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  away: 'bg-amber-500',
}

export function Avatar({
  src,
  name = '',
  size = 'md',
  status,
  className = '',
}) {
  const getInitials = (str) => {
    if (!str) return 'U'
    const parts = str.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return str.substring(0, 2).toUpperCase()
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`rounded-full bg-blue-600 text-white font-bold flex items-center justify-center overflow-hidden ring-2 ring-slate-100 shadow-sm ${
          SIZE_MAP[size] || SIZE_MAP.md
        }`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : name ? (
          <span>{getInitials(name)}</span>
        ) : (
          <User size={size === 'xs' ? 12 : size === 'sm' ? 14 : 18} />
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            STATUS_MAP[status] || STATUS_MAP.online
          }`}
        />
      )}
    </div>
  )
}
