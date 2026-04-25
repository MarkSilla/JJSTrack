import React, { createContext, useCallback, useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase.js'
import { userApi } from '../../services/userApi.js'

export const AuthContext = createContext()

const clearStoredAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

const Context = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const login = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    window.dispatchEvent(new CustomEvent('auth-state-changed'))
  }

  const logout = async () => {
    try {
      await userApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }

    try {
      await signOut(auth)
    } catch (error) {
      console.error('Firebase sign out error:', error)
    }

    clearStoredAuth()
    setIsAuthenticated(false)
    setUser(null)
    window.dispatchEvent(new CustomEvent('auth-state-changed'))
  }

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
