import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import StaffLayout from './layout/Stafflayout'
import Dashboard from './pages/dashboard'
import OrderPage from './pages/OrderPage'
import ArchivesPage from './pages/ArchivesPage'
import StaffInventoryPage from './pages/inventory/StaffInventoryPage'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('staffToken')
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
                <Route path="/" element={isAuthenticated ? <Navigate to="/staff/dashboard" replace /> : <Login />} />

                <Route path="/staff" element={<StaffLayout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="orders" element={<OrderPage />} />
                    <Route path="archives" element={<ArchivesPage />} />
                    <Route path="inventory" element={<StaffInventoryPage />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App
