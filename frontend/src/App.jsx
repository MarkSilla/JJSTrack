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
import Profile from './pages/content/Profile'
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
            <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/appointment" element={<ProtectedRoute><Appointment /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/repair-booking" element={<ProtectedRoute><BookingForms /></ProtectedRoute>} />
            <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </Context>
  )
}

export default App