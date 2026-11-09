
import React, { useEffect, useRef, useState } from 'react'
import { useCookieConsent } from '../context/CookieConsentContext'

const CookieConsentBanner = () => {
  const { showBanner, acceptAll, rejectAll, openSettings } = useCookieConsent()
  const [visible, setVisible] = useState(false)
  const acceptBtnRef = useRef(null)

  // Fade-in
  useEffect(() => {
    if (showBanner) {
      const t = setTimeout(() => setVisible(true), 100)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [showBanner])

  useEffect(() => {
    if (!showBanner) return
    const onKey = (e) => {
      if (e.key === 'Escape') rejectAll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showBanner, rejectAll])

  if (!showBanner) return null

  return (
    <div
      aria-live="polite"
      role="region"
      aria-label="Cookie consent"
      className={`
        fixed inset-0 z-[9000] pointer-events-none
        flex items-end justify-center sm:justify-start
        p-4 pb-6 sm:p-6 sm:pb-7 sm:pl-7
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        className={`
          pointer-events-auto
          w-full max-w-[360px] sm:max-w-[370px]
          bg-white/95 backdrop-blur-md
          rounded-2xl
          border border-slate-200/90
          shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25)]
          p-6 sm:p-7
          transition-all duration-300 ease-out
          ${visible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}
        `}
      >
        <h2 className="text-[15px] font-bold text-slate-900 leading-snug mb-2.5">
          Cookies give you a better experience
        </h2>
        <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
          We use cookies to keep our site secure, understand how it's used, and
          improve your experience. We won't turn them on unless you say so.
        </p>
        <div className="flex gap-2.5 mb-2.5">
          <button
            ref={acceptBtnRef}
            type="button"
            onClick={acceptAll}
            className="
              flex-1 h-10
              bg-blue-600 text-white
              rounded-full text-xs sm:text-sm font-semibold
              hover:bg-blue-800 active:scale-[0.98]
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              shadow-sm
            "
          >
            Accept all
          </button>

          <button
            type="button"
            onClick={rejectAll}
            className="
              flex-1 h-10
              bg-slate-300 text-slate-600
              rounded-full text-xs sm:text-sm font-semibold
              hover:bg-slate-400 active:scale-[0.98] hover:text-white 
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              shadow-sm
            "
          >
            Reject all
          </button>
        </div>
        <button
          type="button"
          onClick={openSettings}
          className="
            w-full h-10
            border border-slate-200 bg-slate-50/80
            text-slate-800 rounded-full
            text-xs sm:text-sm font-semibold
            hover:bg-slate-100 active:scale-[0.98]
            transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          "
        >
          Manage cookies
        </button>
      </div>
    </div>
  )
}

export default CookieConsentBanner
