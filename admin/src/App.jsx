import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import AdminLayout from './layout/adminLayout'
import Dash from './pages/content/adminDash'
import AdAnalytics from './pages/content/adreport'
import AdAppointment from './pages/content/AdAppointment'
import AdOrder from './pages/content/AdOrder'
import OrderDetailPage from './pages/content/Orderdetailage'
import QRScanner from './pages/content/qrscanner'
import ReleasedItems from './pages/content/released'
import AdStaff from './pages/content/AdStaff'
import AdInventory from './pages/content/AdInventory'
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

function App() {
    const isAuthenticated = Boolean(localStorage.getItem('adminToken'))

    return (
        <Router>
            <Routes>
                <Route path='/' element={isAuthenticated ? <Navigate to='/admin/dashboard' replace /> : <Login />} />
                <Route path='/admin' element={
                    <ProtectedRoute>
                        <AdminAppShell />
                    </ProtectedRoute>
                }>
                    <Route path='dashboard' element={<Dash />} />
                    <Route path='report' element={<AdAnalytics />} />
                    <Route path='appointment' element={<AdAppointment />} />
                    <Route path='orders' element={<AdOrder />} />
                    <Route path='orders/:orderId' element={<OrderDetailPage />} />
                    <Route path='qr-scanner' element={<QRScanner />} />
                    <Route path='released' element={<ReleasedItems />} />
                    <Route path='staff' element={<AdStaff />} />
                    <Route path='inventory' element={<AdInventory />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App
