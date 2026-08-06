import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Filter } from 'lucide-react'

export default function FilterBar({
  options = [],
  value,
  onChange,
  variant = 'pills',
  size = 'sm',
  className = '',
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((o) => o.value === value) || options[0]

  // 1. Dropdown Variant
  if (variant === 'dropdown') {
    return (
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-saas border-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Filter size={12} className="text-slate-500" />
          <span>{selectedOption?.label}</span>
          <ChevronDown
            size={12}
            className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in duration-150">
            {options.map((opt) => {
              const isSelected = opt.value === value
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors border-none cursor-pointer ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon size={14} />}
                    <span>{opt.label}</span>
                  </div>
                  {opt.badge !== undefined && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {opt.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // 2. Segmented Variant
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 ${className}`}>
        {options.map((opt) => {
          const isSelected = opt.value === value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-saas border-none cursor-pointer outline-none ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              {Icon && <Icon size={13} />}
              <span>{opt.label}</span>
              {opt.badge !== undefined && (
                <span className={`text-[10px] px-1.5 rounded-full ${isSelected ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'}`}>
                  {opt.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // 3. Tabs Variant
  if (variant === 'tabs') {
    return (
      <div className={`flex items-center border-b border-slate-200 gap-4 overflow-x-auto ${className}`}>
        {options.map((opt) => {
          const isSelected = opt.value === value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1.5 py-2.5 px-1 text-xs font-bold transition-saas border-b-2 bg-transparent cursor-pointer whitespace-nowrap outline-none ${
                isSelected
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {Icon && <Icon size={14} />}
              <span>{opt.label}</span>
              {opt.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {opt.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // 4. Default: Pills Variant
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-saas border cursor-pointer outline-none ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {Icon && <Icon size={13} />}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {opt.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
