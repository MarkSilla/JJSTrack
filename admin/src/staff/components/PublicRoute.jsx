import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { StaffAuthContext } from '../context/StaffAuthContext'
import { RouteSkeleton } from '../../components/SkeletonLoaders'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(StaffAuthContext)

  if (loading) {
    return <RouteSkeleton />
  }

  if (isAuthenticated) {
    return <Navigate to="/staff/dashboard" replace />
  }

  return children
}

export default PublicRoute
