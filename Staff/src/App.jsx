import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

function StaffAppShell() {
    return (
        <DueDateAlertProvider>
            <GlobalDueDateAlert />
            <StaffLayout />
        </DueDateAlertProvider>
    )
}

function App() {
    return (
        <StaffAuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />

                    {/* Protected routes */}
                    <Route path="/staff" element={<ProtectedRoute><StaffAppShell /></ProtectedRoute>}>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="orders" element={<OrderPage />} />
                        <Route path="orders/:orderId" element={<OrderPage />} />
                        <Route path="archives" element={<ArchivesPage />} />
                        <Route path="inventory" element={<StaffInventoryPage />} />
                    </Route>
                </Routes>
            </Router>
        </StaffAuthProvider>
    )
}

export default App
