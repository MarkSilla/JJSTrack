import React, { createContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../utils/apiBaseUrl'
import {
  clearStoredStaffSession,
  getStoredStaffToken,
  getStoredStaffUser,
  persistStoredStaffUser,
} from '../utils/staffSession'

export const StaffAuthContext = createContext()

export const StaffAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [staffUser, setStaffUser] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchStaffSession = async (token) => {
      const response = await fetch(`${API_BASE_URL}/users/staff/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success || !data?.staff) {
        throw new Error(data?.message || 'Failed to fetch staff session')
      }

      return data.staff
    }

    const needsHydration = (user) => !String(user?.position || '').trim()

    const checkAuthentication = async () => {
      try {
        const token = getStoredStaffToken()
        if (!token) {
          if (!isMounted) return
          setIsAuthenticated(false)
          setStaffUser(null)
          return
        }

        let nextStaffUser = getStoredStaffUser()

        if (needsHydration(nextStaffUser)) {
          try {
            nextStaffUser = await fetchStaffSession(token)
            persistStoredStaffUser(nextStaffUser)
          } catch (sessionError) {
            console.error('Error hydrating staff session:', sessionError)

            if (!nextStaffUser) {
              clearStoredStaffSession()
              if (!isMounted) return
              setIsAuthenticated(false)
              setStaffUser(null)
              return
            }
          }
        }

        if (!isMounted) return

        setIsAuthenticated(true)
        setStaffUser(nextStaffUser)
      } catch (error) {
        console.error('Error checking authentication:', error)
        clearStoredStaffSession()
        if (!isMounted) return
        setIsAuthenticated(false)
        setStaffUser(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuthentication()

    const handleAuthStateChange = () => {
      checkAuthentication()
    }

    window.addEventListener('staff-auth-changed', handleAuthStateChange)
    return () => {
      isMounted = false
      window.removeEventListener('staff-auth-changed', handleAuthStateChange)
    }
  }, [])

  const logout = () => {
    clearStoredStaffSession()
    localStorage.removeItem('rememberStaffEmail')
    setIsAuthenticated(false)
    setStaffUser(null)
  }

  return (
    <StaffAuthContext.Provider value={{ isAuthenticated, loading, staffUser, logout }}>
      {children}
    </StaffAuthContext.Provider>
  )
}
