import React, { createContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../utils/apiBaseUrl'
import {
  clearStoredAdminSession,
  getStoredAdminToken,
  getStoredAdminUser,
  persistStoredAdminUser,
} from '../utils/adminSession'

export const AdminAuthContext = createContext()

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    let isMounted = true

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

    const checkAuthentication = async () => {
      try {
        const token = getStoredAdminToken()

        if (token) {
          let nextAdminUser = getStoredAdminUser()

          if (!nextAdminUser) {
            try {
              nextAdminUser = await fetchAdminSession(token)
              persistStoredAdminUser(nextAdminUser)
            } catch (sessionError) {
              console.error('Error hydrating admin session:', sessionError)
            }
          }

          if (!isMounted) return

          setIsAuthenticated(true)
          setAdminUser(nextAdminUser)
        } else {
          if (!isMounted) return
          setIsAuthenticated(false)
          setAdminUser(null)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        clearStoredAdminSession()
        if (!isMounted) return
        setIsAuthenticated(false)
        setAdminUser(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuthentication()

    // Listen for custom auth state change event
    const handleAuthStateChange = () => {
      checkAuthentication()
    }

    window.addEventListener('admin-auth-changed', handleAuthStateChange)
    return () => {
      isMounted = false
      window.removeEventListener('admin-auth-changed', handleAuthStateChange)
    }
  }, [])

  const logout = () => {
    clearStoredAdminSession()
    localStorage.removeItem('rememberAdminEmail')
    setIsAuthenticated(false)
    setAdminUser(null)
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, loading, adminUser, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
