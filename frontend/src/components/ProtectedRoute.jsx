import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/Context'
import { RouteSkeleton, DashboardSkeleton } from './SkeletonLoaders'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <RouteSkeleton>
        <DashboardSkeleton />
      </RouteSkeleton>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
