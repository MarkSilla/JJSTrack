import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right',
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'w-72',
    md: 'w-80 sm:w-96',
    lg: 'w-full sm:w-[28rem]',
    xl: 'w-full sm:w-[36rem]',
  }

  const positionClasses = {
    right: 'right-0 top-0 bottom-0 animate-in slide-in-from-right duration-250',
    left: 'left-0 top-0 bottom-0 animate-in slide-in-from-left duration-250',
    bottom: 'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl animate-in slide-in-from-bottom duration-250',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed bg-white shadow-2xl border-l border-slate-100 flex flex-col z-50 ${
          positionClasses[position] || positionClasses.right
        } ${position !== 'bottom' ? sizeClasses[size] || sizeClasses.md : ''} ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div>
            {title && (
              <h3 className="text-base font-extrabold text-slate-900 leading-tight m-0">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1 m-0 leading-normal">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 border-none bg-transparent cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
