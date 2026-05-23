import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'

export const AuthContext = createContext()

const SESSION_TIMEOUT_MS = 20 * 60 * 1000

const clearStoredAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('loginTimestamp')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('loginTimestamp')
}

const persistAuth = (userData, token, remember = true) => {
  const storage = remember ? localStorage : sessionStorage

  clearStoredAuth()
  storage.setItem('token', token)
  storage.setItem('user', JSON.stringify(userData))
  storage.setItem('loginTimestamp', Date.now().toString())
}

const getLoginTimestamp = () => {
  const ts = localStorage.getItem('loginTimestamp') || sessionStorage.getItem('loginTimestamp')
  return ts ? parseInt(ts, 10) : null
}

const isSessionExpired = () => {
  const ts = getLoginTimestamp()
  if (!ts) return true
  return Date.now() - ts > SESSION_TIMEOUT_MS
}

const Context = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const expiryIntervalRef = useRef(null)

  const syncAuthFromStorage = useCallback(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setIsAuthenticated(true)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        clearStoredAuth()
        setIsAuthenticated(false)
        setUser(null)
      }
    } else {
      setIsAuthenticated(false)
      setUser(null)
    }
  }, [])

  const handleSessionExpiry = useCallback(async () => {
    clearStoredAuth()
    setIsAuthenticated(false)
    setUser(null)

    try {
      const { userApi } = await import('../../services/userApi.js')
      await userApi.logout()
    } catch (_) { }

    try {
      const [{ signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('../../config/firebase.js'),
      ])
      await signOut(auth)
    } catch (_) { }

    window.location.replace('/login?expired=1')
  }, [])

  const startExpiryTimer = useCallback(() => {
    if (expiryIntervalRef.current) clearInterval(expiryIntervalRef.current)

    expiryIntervalRef.current = setInterval(() => {
      if (isSessionExpired()) {
        clearInterval(expiryIntervalRef.current)
        expiryIntervalRef.current = null
        handleSessionExpiry()
      }
    }, 20 * 1000) //time
  }, [handleSessionExpiry])

  const stopExpiryTimer = useCallback(() => {
    if (expiryIntervalRef.current) {
      clearInterval(expiryIntervalRef.current)
      expiryIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleAuthStateChange = () => {
      syncAuthFromStorage()
    }

    const handleUserProfileUpdated = (event) => {
      if (event.detail) {
        setUser(event.detail)
        return
      }

      syncAuthFromStorage()
    }

    syncAuthFromStorage()
    window.addEventListener('auth-error', handleAuthStateChange)
    window.addEventListener('auth-state-changed', handleAuthStateChange)
    window.addEventListener('storage', handleAuthStateChange)
    window.addEventListener('userProfileUpdated', handleUserProfileUpdated)

    setLoading(false)
    return () => {
      window.removeEventListener('auth-error', handleAuthStateChange)
      window.removeEventListener('auth-state-changed', handleAuthStateChange)
      window.removeEventListener('storage', handleAuthStateChange)
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdated)
    }
  }, [syncAuthFromStorage])

  const login = (userData, token, remember = true) => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token')

    if (!authToken || !userData) {
      clearStoredAuth()
      setIsAuthenticated(false)
      setUser(null)
      stopExpiryTimer()
      window.dispatchEvent(new CustomEvent('auth-state-changed'))
      return
    }

    persistAuth(userData, authToken, remember)
    setIsAuthenticated(true)
    setUser(userData)
    startExpiryTimer()
    window.dispatchEvent(new CustomEvent('auth-state-changed'))
  }

  const logout = async () => {
    stopExpiryTimer()

    try {
      const { userApi } = await import('../../services/userApi.js')
      await userApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }

    try {
      const [{ signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('../../config/firebase.js'),
      ])
      await signOut(auth)
    } catch (error) {
      console.error('Firebase sign out error:', error)
    }

    clearStoredAuth()
    setIsAuthenticated(false)
    setUser(null)
    window.location.replace('/login?logged_out=1')
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (savedToken) {
      if (isSessionExpired()) {
        handleSessionExpiry()
      } else {
        startExpiryTimer()
      }
    }
    return () => stopExpiryTimer()
  }, [])

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default Context
