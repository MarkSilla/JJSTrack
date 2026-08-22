import React, { Suspense, lazy, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Context, { AuthContext } from './context/Context'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import LandingPage from './pages/LandingPage'
import { AuthLoadingScreen } from './components/AuthLoadingScreen'
import {
  RouteSkeleton,
  DashboardSkeleton,
  OrdersSkeleton,
  AppointmentsSkeleton,
  ProfileSkeleton,
  InvoicesSkeleton
} from './components/SkeletonLoaders'

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

const PageFallback = () => {
  let pathname = ''
  try {
    pathname = window.location.pathname
  } catch (_) {}

  const isPublicPath = [
    '/',
    '/login',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/terms-of-use',
    '/privacy-policy',
    '/designs'
  ].includes(pathname)

  if (isPublicPath) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center" />
  }

  let contentSkeleton = <DashboardSkeleton />
  if (pathname.includes('/order')) {
    contentSkeleton = <OrdersSkeleton />
  } else if (pathname.includes('/appointment')) {
    contentSkeleton = <AppointmentsSkeleton />
  } else if (pathname.includes('/invoices')) {
    contentSkeleton = <InvoicesSkeleton />
  } else if (pathname.includes('/profile')) {
    contentSkeleton = <ProfileSkeleton />
  }

  return (
    <div className="relative min-h-[60vh]" aria-label="Loading page">
      <RouteSkeleton>{contentSkeleton}</RouteSkeleton>

      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-50/60 backdrop-blur-md animate-fade-in sm:hidden">
        <div className="relative flex flex-col items-center justify-center p-5 bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl max-w-[240px]">
          <div className="w-14 h-14 flex items-center justify-center relative mb-2">
            <svg viewBox="0 0 48 48" className="w-12 h-12 text-blue-500 filter drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
              <g className="scissor-top" style={{ transformOrigin: '18px 24px' }}>
                <circle cx="12" cy="17" r="5.5" stroke="currentColor" strokeWidth="3" fill="none" />
                <path d="M16 19.5 L40 23.5 L18 25.5 Z" fill="currentColor" />
              </g>
              <g className="scissor-bottom" style={{ transformOrigin: '18px 24px' }}>
                <circle cx="12" cy="31" r="5.5" stroke="currentColor" strokeWidth="3" fill="none" />
                <path d="M16 28.5 L40 24.5 L18 22.5 Z" fill="currentColor" />
              </g>
              <circle cx="18" cy="24" r="2.5" fill="currentColor" stroke="white" strokeWidth="1" />
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-200">Preparing view...</p>
        </div>
      </div>
    </div>
  )
}

const withSuspense = (element) => (
  <Suspense fallback={<PageFallback />}>
    {element}
  </Suspense>
)

const AppContent = () => {
  const { isLoggingIn, setIsLoggingIn } = useContext(AuthContext)

  return (
    <>
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
      {isLoggingIn && (
        <AuthLoadingScreen onComplete={() => setIsLoggingIn(false)} />
      )}
    </>
  )
}

const App = () => {
  return (
    <Context>
      <AppContent />
    </Context>
  )
}

export default App
