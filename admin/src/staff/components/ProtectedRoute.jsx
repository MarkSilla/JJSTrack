import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { StaffAuthContext } from '../context/StaffAuthContext'
import { RouteSkeleton } from '../../components/SkeletonLoaders'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(StaffAuthContext)

  if (loading) {
    return <RouteSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />
  }

  return children
}

export default ProtectedRoute
