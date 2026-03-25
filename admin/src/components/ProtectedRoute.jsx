import { Navigate } from 'react-router-dom'

export const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken')
    
    if (!token) {
        return <Navigate to="/" replace />
    }

    return children
}

export const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken')
    
    if (!token) {
        return <Navigate to="/" replace />
    }

    return children
}
