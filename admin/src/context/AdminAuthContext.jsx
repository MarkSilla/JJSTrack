import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../utils/apiBaseUrl'
import {
  clearStoredAdminSession,
  getStoredAdminToken,
  persistStoredAdminUser,
} from '../utils/adminSession'

export const AdminAuthContext = createContext()

const fetchAdminSession = async (token) => {
  const response = await fetch(`${API_BASE_URL}/users/admin/verify-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success || !data?.admin) {
    throw new Error(data?.message || 'Failed to verify admin session')
  }

  return data.admin
}

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  const isMountedRef = useRef(true)

  const refreshAdminSession = useCallback(async (
    token = getStoredAdminToken(),
    { showLoader = true, throwOnError = false } = {}
  ) => {
    if (showLoader && isMountedRef.current) {
      setLoading(true)
    }

    try {
      if (!token) {
        if (isMountedRef.current) {
          setIsAuthenticated(false)
          setAdminUser(null)
        }
        return null
      }

      const nextAdminUser = await fetchAdminSession(token)
      persistStoredAdminUser(nextAdminUser)

      if (isMountedRef.current) {
        setIsAuthenticated(true)
        setAdminUser(nextAdminUser)
      }

      return nextAdminUser
    } catch (error) {
      console.error('Error checking authentication:', error)
      clearStoredAdminSession()
      if (isMountedRef.current) {
        setIsAuthenticated(false)
        setAdminUser(null)
      }
      if (throwOnError) {
        throw error
      }
      return null
    } finally {
      if (showLoader && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    refreshAdminSession()

    // Listen for custom auth state change event
    const handleAuthStateChange = () => {
      refreshAdminSession()
    }

    window.addEventListener('admin-auth-changed', handleAuthStateChange)
    return () => {
      isMountedRef.current = false
      window.removeEventListener('admin-auth-changed', handleAuthStateChange)
    }
  }, [refreshAdminSession])

  const logout = () => {
    clearStoredAdminSession()
    localStorage.removeItem('rememberAdminEmail')
    setIsAuthenticated(false)
    setAdminUser(null)
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, loading, adminUser, logout, refreshAdminSession }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
