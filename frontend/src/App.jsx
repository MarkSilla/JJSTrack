import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Context from './context/Context'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import LandingPage from './pages/LandingPage'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AccountRemovalConfirmPage = lazy(() => import('./pages/AccountRemovalConfirmPage'))
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Design = lazy(() => import('./pages/Design'))

const HomeLayout = lazy(() => import('./layouts/HomeLayout'))
const Dashboard = lazy(() => import('./pages/content/Dashboard'))
const Appointment = lazy(() => import('./pages/content/Appointment'))
const Invoices = lazy(() => import('./pages/content/Invoices'))
const Order = lazy(() => import('./pages/content/Order'))
const BookingForms = lazy(() => import('./pages/content/Bookingforms'))
const Profile = lazy(() => import('./pages/content/Profile'))

const PageFallback = () => (
  <div className="min-h-screen bg-slate-950" aria-label="Loading page" />
)

const withSuspense = (element) => (
  <Suspense fallback={<PageFallback />}>
    {element}
  </Suspense>
)

const App = () => {
  return (
    <Context>
      <Router>
        <Routes>
          <Route path="/" element={withSuspense(<LandingPage />)} />
          <Route path="/login" element={withSuspense(<PublicRoute><LoginPage /></PublicRoute>)} />
          <Route path="/signup" element={withSuspense(<PublicRoute><SignupPage /></PublicRoute>)} />
          <Route path="/verify-email" element={withSuspense(<VerifyEmailPage />)} />
          <Route path="/forgot-password" element={withSuspense(<ForgotPasswordPage />)} />
          <Route path="/reset-password" element={withSuspense(<ResetPasswordPage />)} />
          <Route path="/account-removal/confirm" element={withSuspense(<AccountRemovalConfirmPage />)} />
          <Route path="/terms-of-use" element={withSuspense(<TermsOfUse />)} />
          <Route path="/privacy-policy" element={withSuspense(<PrivacyPolicy />)} />
          <Route path="/designs" element={withSuspense(<Design />)} />

          <Route element={withSuspense(<HomeLayout />)}>
            <Route path="/home" element={withSuspense(<ProtectedRoute><Dashboard /></ProtectedRoute>)} />
            <Route path="/appointment" element={withSuspense(<ProtectedRoute><Appointment /></ProtectedRoute>)} />
            <Route path="/invoices" element={withSuspense(<ProtectedRoute><Invoices /></ProtectedRoute>)} />
            <Route path="/invoices/:id" element={withSuspense(<ProtectedRoute><Invoices /></ProtectedRoute>)} />
            <Route path="/repair-booking" element={withSuspense(<ProtectedRoute><BookingForms /></ProtectedRoute>)} />
            <Route path="/order" element={withSuspense(<ProtectedRoute><Order /></ProtectedRoute>)} />
            <Route path="/order/:orderId" element={withSuspense(<ProtectedRoute><Order /></ProtectedRoute>)} />
            <Route path="/profile" element={withSuspense(<ProtectedRoute><Profile /></ProtectedRoute>)} />
          </Route>
        </Routes>
      </Router>
    </Context>
  )
}

export default App
