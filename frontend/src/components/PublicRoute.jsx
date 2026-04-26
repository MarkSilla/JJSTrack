import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/Context'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return children
}

export default PublicRoute
