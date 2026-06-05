import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminAuthContext } from '../context/AdminAuthContext'
import { RouteSkeleton } from './SkeletonLoaders'

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AdminAuthContext)

    if (loading) {
        return <RouteSkeleton />
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return children
}

export const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AdminAuthContext)

    if (loading) {
        return <RouteSkeleton />
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return children
}
