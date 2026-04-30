import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AdminAuthProvider, AdminAuthContext } from './context/AdminAuthContext'
import Login from './pages/login'
import AdminLayout from './layout/adminLayout'
import Dash from './pages/content/adminDash'
import AdAnalytics from './pages/content/adreport'
import AdAppointment from './pages/content/AdAppointment'
import AdOrder from './pages/content/AdOrder'
import OrderDetailPage from './pages/content/Orderdetailage'
import QRScanner from './pages/content/qrscanner'
import ReleasedItems from './pages/content/released'
import ArchivedItems from './pages/content/archives'
import AdStaff from './pages/content/AdStaff'
import AdInventory from './pages/content/AdInventory'
import AdInventoryHistory from './pages/content/AdInventoryHistory'
import AdminProfile from './pages/content/AdminProfile'
import { ProtectedRoute } from './components/ProtectedRoute'
import { StockAlertProvider } from './context/StockAlertContext'
import { GlobalStockAlert } from './components/GlobalStockAlert'

function AdminAppShell() {
    return (
        <StockAlertProvider>
            <GlobalStockAlert />
            <AdminLayout />
        </StockAlertProvider>
    )
}

function AppRoutes() {
    const { isAuthenticated, loading } = useContext(AdminAuthContext)

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

    return (
        <Routes>
            <Route path='/' element={isAuthenticated ? <Navigate to='/admin/dashboard' replace /> : <Login />} />
            <Route path='/admin' element={
                <ProtectedRoute>
                    <AdminAppShell />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path='dashboard' element={<Dash />} />
                <Route path='report' element={<AdAnalytics />} />
                <Route path='appointment' element={<AdAppointment />} />
                <Route path='orders' element={<AdOrder />} />
                <Route path='orders/:orderId' element={<OrderDetailPage />} />
                <Route path='qr-scanner' element={<QRScanner />} />
                <Route path='released' element={<ReleasedItems />} />
                <Route path='archives' element={<ArchivedItems />} />
                <Route path='staff' element={<AdStaff />} />
                <Route path='inventory' element={<AdInventory />} />
                <Route path='inventory/history' element={<AdInventoryHistory />} />
                <Route path='profile' element={<AdminProfile />} />
            </Route>
            <Route path='*' element={<Navigate to="/" replace />} />
        </Routes>
    )
}

function App() {
    return (
        <AdminAuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AdminAuthProvider>
    )
}

export default App
