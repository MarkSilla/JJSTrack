import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Context from './context/Context'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/content/Dashboard'
import Appointment from './pages/content/Appointment'
import Invoices from './pages/content/Invoices'
import Order from './pages/content/Order'
import BookingForms from './pages/content/Bookingforms'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProtectedRoute from './components/ProtectedRoute'
import HomeLayout from './layouts/HomeLayout'  // ← add this

const App = () => {
  return (
    <Context>
      <Router>
        <Routes>
          {/* Public routes — walang sidebar */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Private routes — may sidebar + navbar */}
          <Route element={<HomeLayout />}>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<Invoices />} />
            <Route path="/repair-booking" element={<BookingForms />} />
            <Route path="/order" element={<Order />} />
          </Route>
        </Routes>
      </Router>
    </Context>
  )
}

export default App