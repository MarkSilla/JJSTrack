import React, { createContext, useState } from 'react'

export const AuthContext = createContext()

const Context = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const login = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default Context
