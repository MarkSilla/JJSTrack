import React, { createContext, useState, useEffect } from 'react'

export const StaffAuthContext = createContext()

export const StaffAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [staffUser, setStaffUser] = useState(null)

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const token = localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken')
        const storedUser = localStorage.getItem('staffUser')
        
        if (token) {
          setIsAuthenticated(true)
          if (storedUser) {
            try {
              setStaffUser(JSON.parse(storedUser))
            } catch {
              setStaffUser(null)
            }
          }
        } else {
          setIsAuthenticated(false)
          setStaffUser(null)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
        setStaffUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  const logout = () => {
    localStorage.removeItem('staffToken')
    sessionStorage.removeItem('staffToken')
    localStorage.removeItem('staffUser')
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
