import React from 'react'
import { Search, X } from 'lucide-react'

export function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  size = 'md',
  className = '',
}) {
  const sizeStyles = {
    sm: 'py-1 px-2.5 text-xs pl-8',
    md: 'py-2 px-3 text-xs sm:text-sm pl-9',
    lg: 'py-2.5 px-4 text-sm pl-10',
  }

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 18,
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={iconSizes[size] || 15}
        className="absolute left-3 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-saas outline-none ${
          sizeStyles[size] || sizeStyles.md
        } ${value ? 'pr-8' : ''}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear()
            else if (onChange) onChange('')
          }}
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent p-0.5 cursor-pointer rounded-full"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export function ActionToolbar({
  search,
  filters,
  actions,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 ${className}`}>
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {search && <div className="w-full sm:w-64">{search}</div>}
        {filters && <div className="flex items-center gap-2 overflow-x-auto">{filters}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">{actions}</div>}
    </div>
  )
}
