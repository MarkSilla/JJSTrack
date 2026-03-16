import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/login'
import AdminLayout from './layout/adminLayout'
import Dash from './pages/content/adminDash'
import AdAnalytics from './pages/content/adAnalytics'
import AdAppointment from './pages/content/AdAppointment'
import AdOrder from './pages/content/AdOrder'
import QRScanner from './pages/content/qrscanner'
import ReleasedItems from './pages/content/released'
import AdStaff from './pages/content/AdStaff'
import AdPayroll from './pages/content/AdPayroll'
import AdInventory from './pages/content/AdInventory'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dash />} />
          <Route path="analytic" element={<AdAnalytics />} />
          <Route path="appointment" element={<AdAppointment />} />
          <Route path="orders" element={<AdOrder />} />
          <Route path="qr-scanner" element={<QRScanner />} />
          <Route path="released" element={<ReleasedItems />} />
          <Route path="staff" element={<AdStaff />} />
          <Route path="payroll" element={<AdPayroll />} />
          <Route path="inventory" element={<AdInventory />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
