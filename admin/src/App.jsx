import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/login'
import AdminLayout from './layout/adminLayout'
import Dash from './pages/content/adminDash'
import AdAnalytics from './pages/content/adAnalytics'
import AdAppointment from './pages/content/AdAppointment'
import AdOrder from './pages/content/AdOrder'
import OrderDetailPage from './pages/content/Orderdetailage'
import QRScanner from './pages/content/qrscanner'
import ReleasedItems from './pages/content/released'
import AdStaff from './pages/content/AdStaff'
import AdInventory from './pages/content/AdInventory'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('adminToken')
        if (token) {
            setIsAuthenticated(true)
        } else {
            setIsAuthenticated(false)
        }
        setLoading(false)
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><span>Loading...</span></div>
    }

    return (
        <Router>
            <Routes>
                {/* Redirect to dashboard if already authenticated */}
                <Route path="/" element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Login />} />

                <Route path="/admin" element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route path="dashboard" element={<Dash />} />
                    <Route path="analytic" element={<AdAnalytics />} />
                    <Route path="appointment" element={<AdAppointment />} />
                    <Route path="orders" element={<AdOrder />} />
                    <Route path="orders/:orderId" element={<OrderDetailPage />} />
                    <Route path="qr-scanner" element={<QRScanner />} />
                    <Route path="released" element={<ReleasedItems />} />
                    <Route path="staff" element={<AdStaff />} />
                    <Route path="inventory" element={<AdInventory />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App