import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/Context'
import { RouteSkeleton, DashboardSkeleton } from './SkeletonLoaders'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext)

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return children
}

export default PublicRoute
