/**
 * CookieConsentContext
 *
 * Manages cookie consent state for the JJSTrack frontend.
 *
 * Cookie categories:
 *  - necessary  : always enabled — JWT auth, session tokens, localStorage auth keys
 *  - analytics  : optional — page-view tracking (pageViewApi), firebase analytics
 *  - functional : optional — Google Maps embed, chat widget initialisation
 *
 * Consent is persisted in localStorage under the key `jjstrack_cookie_consent`.
 * Shape: { decided: boolean, analytics: boolean, functional: boolean, decidedAt: ISO-string }
 *
 * The banner is shown when `decided === false` (or no key exists at all).
 * When the user clears browser data the key is gone → banner reappears.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

// ─── Storage key ──────────────────────────────────────────────────────────────
const CONSENT_KEY = 'jjstrack_cookie_consent'

// ─── Default consent shape ────────────────────────────────────────────────────
const defaultConsent = {
  decided: false,
  analytics: false,
  functional: false,
  advertising: false,
  decidedAt: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const readConsent = () => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return defaultConsent
    const parsed = JSON.parse(raw)
    // Guard against corrupted/partial data
    if (typeof parsed !== 'object' || parsed === null) return defaultConsent
    return { ...defaultConsent, ...parsed }
  } catch {
    return defaultConsent
  }
}

const writeConsent = (data) => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data))
  } catch {
    // localStorage quota exceeded or unavailable — fail silently
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const CookieConsentContext = createContext(null)

export const CookieConsentProvider = ({ children }) => {
  const [consent, setConsentState] = useState(readConsent)
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Determine whether to show the banner on mount
  useEffect(() => {
    const stored = readConsent()
    if (!stored.decided) {
      // Small delay so the page renders first before the banner appears
      const timer = setTimeout(() => setShowBanner(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // ── Accept all ──────────────────────────────────────────────────────────────
  const acceptAll = useCallback(() => {
    const next = {
      decided: true,
      analytics: true,
      functional: true,
      advertising: true,
      decidedAt: new Date().toISOString(),
    }
    writeConsent(next)
    setConsentState(next)
    setShowBanner(false)
    setShowSettings(false)
  }, [])

  // ── Reject all optional ─────────────────────────────────────────────────────
  const rejectAll = useCallback(() => {
    const next = {
      decided: true,
      analytics: false,
      functional: false,
      advertising: false,
      decidedAt: new Date().toISOString(),
    }
    writeConsent(next)
    setConsentState(next)
    setShowBanner(false)
    setShowSettings(false)
  }, [])

  // ── Save custom preferences ─────────────────────────────────────────────────
  const savePreferences = useCallback(({ analytics, functional, advertising }) => {
    const next = {
      decided: true,
      analytics: Boolean(analytics),
      functional: Boolean(functional),
      advertising: Boolean(advertising),
      decidedAt: new Date().toISOString(),
    }
    writeConsent(next)
    setConsentState(next)
    setShowBanner(false)
    setShowSettings(false)
  }, [])

  // ── Open settings (from footer / profile) ───────────────────────────────────
  const openSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  const closeSettings = useCallback(() => {
    setShowSettings(false)
  }, [])

  // ── Convenience booleans ────────────────────────────────────────────────────
  const analyticsAllowed = consent.decided && consent.analytics
  const functionalAllowed = consent.decided && consent.functional

  const value = {
    consent,
    showBanner,
    showSettings,
    analyticsAllowed,
    functionalAllowed,
    acceptAll,
    rejectAll,
    savePreferences,
    openSettings,
    closeSettings,
  }

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  )
}

// ─── Convenience hook ─────────────────────────────────────────────────────────
export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) {
    throw new Error('useCookieConsent must be used inside CookieConsentProvider')
  }
  return ctx
}

export default CookieConsentProvider

