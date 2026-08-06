import React, { Suspense, lazy, useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import HomeSidebar from '../components/HomeSidebar'
import HomeNavbar from '../components/HomeNavbar'
import { ChatProvider } from '../context/ChatContext'

const GoogleProfileModal = lazy(() => import('../components/GoogleProfileModal'))
const ChatWidget = lazy(() => import('../components/ChatWidget'))

const HomeLayout = () => {
  const [collapsed, setCollapsed] = useState(true)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const location = useLocation()

  // Trigger brief page transition loader on mobile route updates
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsNavigating(true)
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 350) // Fast 350ms overlay transition
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  // When burger button is clicked on mobile, toggle the mobile expanded state
  const handleBurgerClick = () => {
    if (window.innerWidth < 1024) {
      setIsMobileExpanded(!isMobileExpanded)
    } else {
      setCollapsed(!collapsed)
    }
  }

  useEffect(() => {
    // Check if user needs to complete profile after Google login
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const needsGoogleProfileCompletion =
      user &&
      user.isGoogleUser &&
      (
        !user.firstName ||
        !user.lastName ||
        !user.phoneNumber ||
        !user.street ||
        !user.brgyName ||
        !user.cityName ||
        !user.provinceName ||
        !user.address
      )

    if (needsGoogleProfileCompletion) {
      setTimeout(() => {
        setShowProfileModal(true)
      }, 500)
    }
  }, [])

  const handleProfileSuccess = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setShowProfileModal(false)
  }

  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50">
        <HomeSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isMobileExpanded={isMobileExpanded}
          setIsMobileExpanded={setIsMobileExpanded}
          onNavigateStart={() => setIsNavigating(true)}
        />

        <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <HomeNavbar collapsed={collapsed} setCollapsed={handleBurgerClick} isMobileExpanded={isMobileExpanded} />

          {/* Dynamic Content Blur Area during load transitions on mobile */}
          <main className={`transition-all duration-300 ${isNavigating ? 'filter blur-[4px] pointer-events-none' : ''}`}>
            <Outlet />
          </main>
        </div>

        {/* Dynamic Mobile Route Transition Scissor Loader Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617]/35 backdrop-blur-[1px] animate-fade-in lg:hidden pointer-events-none">
            <div className="relative flex flex-col items-center justify-center p-5 bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl max-w-[200px]">
              <div className="w-12 h-12 flex items-center justify-center relative mb-1.5">
                <svg viewBox="0 0 48 48" className="w-10 h-10 text-blue-500 filter drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
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
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-200">Loading...</p>
            </div>
          </div>
        )}

        <Suspense fallback={null}>
          {showProfileModal && (
            <GoogleProfileModal
              isOpen={showProfileModal}
              onClose={() => setShowProfileModal(false)}
              onSuccess={handleProfileSuccess}
            />
          )}
          <ChatWidget />
        </Suspense>
      </div>
    </ChatProvider>
  )
}

export default HomeLayout
