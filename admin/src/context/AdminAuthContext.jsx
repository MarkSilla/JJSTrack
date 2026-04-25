import React, { createContext, useState, useEffect } from 'react'

export const AdminAuthContext = createContext()

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const token = localStorage.getItem('adminToken')
        const storedUser = localStorage.getItem('adminUser')
        
        if (token) {
          setIsAuthenticated(true)
          if (storedUser) {
            try {
              setAdminUser(JSON.parse(storedUser))
            } catch {
              setAdminUser(null)
            }
          }
        } else {
          setIsAuthenticated(false)
          setAdminUser(null)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
        setAdminUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthentication()

    // Listen for custom auth state change event
    const handleAuthStateChange = () => {
      checkAuthentication()
    }

    window.addEventListener('admin-auth-changed', handleAuthStateChange)
    return () => window.removeEventListener('admin-auth-changed', handleAuthStateChange)
  }, [])

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
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
