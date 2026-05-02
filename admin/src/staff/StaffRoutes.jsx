import { Routes, Route, Navigate } from 'react-router-dom'
import { StaffAuthProvider } from './context/StaffAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import { DueDateAlertProvider } from './context/DueDateAlertContext'
import { GlobalDueDateAlert } from './components/GlobalDueDateAlert'
import Login from './pages/Login'
import StaffLayout from './layout/Stafflayout'
import Dashboard from './pages/dashboard'
import OrderPage from './pages/OrderPage'
import ArchivesPage from './pages/ArchivesPage'
import StaffInventoryPage from './pages/inventory/StaffInventoryPage'
import StaffInventoryHistoryPage from './pages/inventory/StaffInventoryHistoryPage'
import StaffProfilePage from './pages/StaffProfilePage'

function StaffAppShell() {
    return (
        <DueDateAlertProvider>
            <GlobalDueDateAlert />
            <StaffLayout />
        </DueDateAlertProvider>
    )
}

function StaffRoutes() {
    return (
        <StaffAuthProvider>
            <Routes>
                <Route index element={<Navigate to="login" replace />} />
                <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route element={<ProtectedRoute><StaffAppShell /></ProtectedRoute>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="orders" element={<OrderPage />} />
                    <Route path="orders/:orderId" element={<OrderPage />} />
                    <Route path="archives" element={<ArchivesPage />} />
                    <Route path="inventory" element={<StaffInventoryPage />} />
                    <Route path="inventory/history" element={<StaffInventoryHistoryPage />} />
                    <Route path="profile" element={<StaffProfilePage />} />
                </Route>
                <Route path="*" element={<Navigate to="login" replace />} />
            </Routes>
        </StaffAuthProvider>
    )
}

export default StaffRoutes
