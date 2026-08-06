import React, { useEffect } from 'react'
import { X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
          SIZE_MAP[size] || SIZE_MAP.md
        } ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 m-0 leading-tight">
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

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const VARIANT_ICONS = {
    danger: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle2,
  }

  const VARIANT_STYLES = {
    danger: { iconBg: 'bg-rose-100 text-rose-600', btn: 'bg-rose-600 hover:bg-rose-700 text-white' },
    warning: { iconBg: 'bg-amber-100 text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700 text-white' },
    info: { iconBg: 'bg-blue-100 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
    success: { iconBg: 'bg-emerald-100 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  }

  const Icon = VARIANT_ICONS[variant] || AlertTriangle
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.danger

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${style.iconBg}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 m-0 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 m-0">{description}</p>
        <div className="flex items-center justify-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-saas border-none cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-saas border-none cursor-pointer ${style.btn}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
