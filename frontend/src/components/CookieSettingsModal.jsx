/**
 * CookieSettingsModal
 *
 * Clean, modern cookie preferences modal matching the user's reference design.
 * Features:
 * - Cute mascot illustration with soft blue badge
 * - "Cookie Break Time" header
 * - Clear, privacy-first explanation (no external policy links)
 * - Accordion list with clean checkboxes for each cookie category
 * - "Save" and "Accept all cookies" action buttons
 */

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useCookieConsent } from '../context/CookieConsentContext'

const CookieSettingsModal = () => {
  const {
    consent,
    showSettings,
    closeSettings,
    acceptAll,
    savePreferences,
  } = useCookieConsent()

  // Local state for checkboxes
  const [analytics, setAnalytics] = useState(consent.analytics || false)
  const [functional, setFunctional] = useState(consent.functional || false)
  const [advertising, setAdvertising] = useState(consent.advertising || false)

  // Accordion open/close states (Necessary is open by default like the reference)
  const [openItems, setOpenItems] = useState({
    necessary: true,
    analytics: false,
    functional: false,
    advertising: false,
  })

  const modalRef = useRef(null)

  // Sync state whenever settings modal opens
  useEffect(() => {
    if (showSettings) {
      setAnalytics(consent.analytics || false)
      setFunctional(consent.functional || false)
      setAdvertising(consent.advertising || false)
    }
  }, [showSettings, consent])

  // Escape key handler & scroll lock
  useEffect(() => {
    if (!showSettings) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (e) => {
      if (e.key === 'Escape') closeSettings()
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [showSettings, closeSettings])

  if (!showSettings) return null

  const toggleAccordion = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    savePreferences({ analytics, functional, advertising })
  }

  const handleAcceptAll = () => {
    setAnalytics(true)
    setFunctional(true)
    setAdvertising(true)
    acceptAll()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie preferences"
      className="fixed inset-0 z-[9100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto animate-fade-in"
    >
      {/* Background click to dismiss */}
      <div
        className="fixed inset-0 -z-10"
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Card container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 my-auto border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Cookie Preferences
          </h2>
          <button
            type="button"
            onClick={closeSettings}
            aria-label="Close modal"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description text with highlighted privacy text */}
        <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
          We use cookies to enhance website functionality, maintain your session security, and personalize features.{' '}
          <strong className="font-semibold text-slate-800">
            We prioritize your privacy and data security
          </strong>
          . You can adjust your preferences for each category below.
        </p>

        {/* Accordion Categories Card */}
        <div className="border border-slate-200/90 rounded-2xl divide-y divide-slate-100 text-left mb-6 overflow-hidden bg-white shadow-sm">
          {/* 1. Necessary cookies */}
          <div className="transition-colors">
            <div className="flex items-center justify-between p-3.5 sm:p-4">
              <label
                htmlFor="cookie-necessary"
                className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
              >
                {/* Disabled checked checkbox */}
                <input
                  id="cookie-necessary"
                  type="checkbox"
                  checked
                  disabled
                  className="sr-only"
                />
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-300 text-slate-700">
                  <svg
                    className="w-3.5 h-3.5 stroke-[3]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  Necessary cookies (Always enabled)
                </span>
              </label>

              <button
                type="button"
                aria-label="Toggle details for necessary cookies"
                onClick={() => toggleAccordion('necessary')}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-2"
              >
                {openItems.necessary ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {openItems.necessary && (
              <div className="px-3.5 pb-4 pt-1 sm:px-4 text-[12px] text-slate-500 leading-relaxed bg-slate-50/50">
                Required cookies are key to the operation of our site. They
                enable you to navigate our website and use its features. They
                cannot be turned off. Without these cookies, the website cannot
                function properly. Please be aware that these don't collect
                information that can identify you.
              </div>
            )}
          </div>

          {/* 2. Analytics cookies */}
          <div className="transition-colors">
            <div className="flex items-center justify-between p-3.5 sm:p-4">
              <label
                htmlFor="cookie-analytics"
                className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
              >
                <input
                  id="cookie-analytics"
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    analytics
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {analytics && (
                    <svg
                      className="w-3.5 h-3.5 stroke-[3]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                  Analytics cookies
                </span>
              </label>

              <button
                type="button"
                aria-label="Toggle details for analytics cookies"
                onClick={() => toggleAccordion('analytics')}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-2"
              >
                {openItems.analytics ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {openItems.analytics && (
              <div className="px-3.5 pb-4 pt-1 sm:px-4 text-[12px] text-slate-500 leading-relaxed bg-slate-50/50">
                Analytics cookies help us understand how visitors interact with
                our website by collecting and reporting usage counts
                anonymously. These insights help us optimize page loading and
                overall user experience.
              </div>
            )}
          </div>

          {/* 3. Performance / functionality cookies */}
          <div className="transition-colors">
            <div className="flex items-center justify-between p-3.5 sm:p-4">
              <label
                htmlFor="cookie-functional"
                className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
              >
                <input
                  id="cookie-functional"
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    functional
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {functional && (
                    <svg
                      className="w-3.5 h-3.5 stroke-[3]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                  Performance/functionality cookies
                </span>
              </label>

              <button
                type="button"
                aria-label="Toggle details for performance cookies"
                onClick={() => toggleAccordion('functional')}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-2"
              >
                {openItems.functional ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {openItems.functional && (
              <div className="px-3.5 pb-4 pt-1 sm:px-4 text-[12px] text-slate-500 leading-relaxed bg-slate-50/50">
                These cookies enable enhanced features and personalized
                functionality such as interactive Google Maps embed, remembered
                view preferences, and live customer chat support.
              </div>
            )}
          </div>

          {/* 4. Advertisement cookies */}
          <div className="transition-colors">
            <div className="flex items-center justify-between p-3.5 sm:p-4">
              <label
                htmlFor="cookie-advertising"
                className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
              >
                <input
                  id="cookie-advertising"
                  type="checkbox"
                  checked={advertising}
                  onChange={(e) => setAdvertising(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    advertising
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {advertising && (
                    <svg
                      className="w-3.5 h-3.5 stroke-[3]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                  Advertisement cookies
                </span>
              </label>

              <button
                type="button"
                aria-label="Toggle details for advertisement cookies"
                onClick={() => toggleAccordion('advertising')}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-2"
              >
                {openItems.advertising ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {openItems.advertising && (
              <div className="px-3.5 pb-4 pt-1 sm:px-4 text-[12px] text-slate-500 leading-relaxed bg-slate-50/50">
                These cookies may be used to deliver relevant announcements,
                promotional sportswear collections, and measure the
                effectiveness of website campaigns.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions: Save (left) & Accept all cookies (right) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-sm font-semibold text-slate-800 transition-all shadow-sm"
          >
            Save
          </button>

          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-sm font-semibold text-white transition-all shadow-md shadow-blue-600/25"
          >
            Accept all cookies
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieSettingsModal
