import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import HomeSidebar from '../components/HomeSidebar'
import HomeNavbar from '../components/HomeNavbar'
import GoogleProfileModal from '../components/GoogleProfileModal'

const HomeLayout = () => {
  const [collapsed, setCollapsed] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    // Check if user needs to complete profile after Google login
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user && user.isGoogleUser && (!user.phoneNumber || !user.address)) {
      // Small delay to ensure page has loaded
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
    <div className="min-h-screen bg-gray-50">
      <HomeSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <HomeNavbar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main>
          <Outlet />
        </main>
      </div>

      {/* Google Profile Completion Modal - shows after navigating to home */}
      <GoogleProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={handleProfileSuccess}
      />
    </div>
  )
}

export default HomeLayout
