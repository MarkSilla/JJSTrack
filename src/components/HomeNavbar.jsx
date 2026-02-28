import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdNotificationsNone, MdSearch, MdMenu, MdClose, MdPerson, MdLogout, MdSettings, MdEmail, MdPhone, MdLocationOn } from 'react-icons/md'
import { userApi } from '../../services/userApi'

const HomeNavbar = ({ collapsed, setCollapsed }) => {
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const dayStr = today.toLocaleDateString('en-US', { weekday: 'long' })

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }

    // Listen for user profile updates
    const handleUserUpdate = (event) => {
      if (event.detail) {
        setUser(event.detail)
      } else {
        const updatedUser = localStorage.getItem('user')
        if (updatedUser) {
          try {
            setUser(JSON.parse(updatedUser))
          } catch (e) {
            console.error('Error parsing user:', e)
          }
        }
      }
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    window.addEventListener('userProfileUpdated', handleUserUpdate)
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleUserUpdate)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await userApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  const handleUpdateProfile = () => {
    setShowDropdown(false)
    navigate('/profile')
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get display name - prefer fullName, fallback to email
  const getDisplayName = (user) => {
    if (user?.fullName) return user.fullName
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 w-full">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6">

        {/* Left - Mobile menu toggle */}
        <div className="flex items-center gap-3">
          <button
            id="jjs-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 lg:hidden transition-colors cursor-pointer text-gray-600"
          >
            {collapsed ? <MdMenu size={22} /> : <MdClose size={22} />}
          </button>
        </div>

        {/* Right - Notifications + Date + User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="relative p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <MdNotificationsNone size={18} className="sm:w-6 sm:h-6 text-gray-500" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1 pr-3 transition-colors"
            >
              {/* Profile Picture */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-sm overflow-hidden">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getUserInitials(user?.fullName)
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 sm:py-3 animate-in fade-in zoom-in duration-200 max-h-96 overflow-y-auto">
                {/* User Info Header */}
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1">
                    {user?.fullName || 'User'}
                  </p>
                  <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                    {/* Email */}
                    <div className="flex items-center gap-2 min-w-0">
                      <MdEmail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{user?.email}</span>
                    </div>
                    {/* Phone */}
                    {user?.phoneNumber && (
                      <div className="flex items-center gap-2 min-w-0">
                        <MdPhone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{user.phoneNumber}</span>
                      </div>
                    )}
                    {/* Address */}
                    {user?.address && (
                      <div className="flex items-center gap-2 min-w-0">
                        <MdLocationOn size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{user.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <button
                  onClick={handleUpdateProfile}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MdPerson size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Update Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <MdLogout size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  )
}

export default HomeNavbar
