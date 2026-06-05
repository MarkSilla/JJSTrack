import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/Context'
import { RouteSkeleton } from './SkeletonLoaders'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext)

  if (loading) {
    return <RouteSkeleton />
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return children
}

export default PublicRoute
