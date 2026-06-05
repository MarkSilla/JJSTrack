import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useContext, useEffect } from 'react'
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
import ServicesPricing from './pages/content/ServicesPricing'
import { ProtectedRoute } from './components/ProtectedRoute'
import { StockAlertProvider } from './context/StockAlertContext'
import { GlobalStockAlert } from './components/GlobalStockAlert'
import StaffRoutes from './staff/StaffRoutes'
import RBAC from './pages/Rbac'
import { RouteSkeleton } from './components/SkeletonLoaders'

function AdminAppShell() {
    return (
        <StockAlertProvider>
            <GlobalStockAlert />
            <AdminLayout />
        </StockAlertProvider>
    )
}

function LoadingScreen() {
    return <RouteSkeleton />
}

function AdminLoginRoute() {
    const { isAuthenticated, loading } = useContext(AdminAuthContext)

    if (loading) {
        return <LoadingScreen />
    }

    return isAuthenticated ? <Navigate to='/admin/dashboard' replace /> : <Login />
}

function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<RBAC />} />
            <Route path='/admin/login' element={<AdminLoginRoute />} />
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
                <Route path='services-pricing' element={<ServicesPricing />} />
                <Route path='profile' element={<AdminProfile />} />
            </Route>
            <Route path='/staff/*' element={<StaffRoutes />} />
            <Route path='*' element={<Navigate to="/" replace />} />
        </Routes>
    )
}

function DocumentTitle() {
    const location = useLocation()

    useEffect(() => {
        document.title = location.pathname === '/'
            ? 'JJSTrack Access Portal'
            : location.pathname.startsWith('/staff')
                ? 'JJSTrack Staff'
                : 'JJSTrack Admin'
    }, [location.pathname])

    return null
}

function App() {
    return (
        <AdminAuthProvider>
            <Router>
                <DocumentTitle />
                <AppRoutes />
            </Router>
        </AdminAuthProvider>
    )
}

export default App
