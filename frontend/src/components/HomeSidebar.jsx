import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import img from '../assets/img.js'
import { MdDashboard, MdCalendarToday, MdLogout, MdShoppingBag, MdReceipt } from 'react-icons/md'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const navItems = [
  { icon: MdDashboard, label: 'Dashboard', description: 'Your main dashboard', path: '/home' },
  { icon: MdCalendarToday, label: 'Appointment', description: 'Manage appointments', path: '/appointment' },
  { icon: MdShoppingBag, label: 'Orders', description: 'View all orders', path: '/order' },
  { icon: MdReceipt, label: 'Invoices', description: 'Billing & invoices', path: '/invoices' },
]

const HomeSidebar = ({ collapsed, setCollapsed, isMobileExpanded, setIsMobileExpanded, logout }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)

  const isDesktopCollapsed = collapsed ?? true
  const setIsDesktopCollapsed = setCollapsed ?? (() => { })
  const mobileExpanded = isMobileExpanded ?? false
  const setMobileExpanded = setIsMobileExpanded ?? (() => { })

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) setMobileExpanded(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setMobileExpanded])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('jjs-sidebar')
      const toggleBtn = document.getElementById('jjs-toggle-btn')
      if (toggleBtn && toggleBtn.contains(event.target)) return
      if (mobileExpanded && sidebar && !sidebar.contains(event.target)) {
        setMobileExpanded(false)
      }
    }
    if (mobileExpanded) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileExpanded, setMobileExpanded])

  const handleLogout = () => {
    if (logout) logout()
    navigate('/')
  }

  const toggleDesktop = () => setIsDesktopCollapsed(!isDesktopCollapsed)
  const showLabel = isSmallScreen ? mobileExpanded : !isDesktopCollapsed

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileExpanded && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setMobileExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="jjs-sidebar"
        className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white transition-all duration-300 ease-in-out z-40 shadow-xl border-r border-gray-700 flex flex-col
          ${isSmallScreen
            ? mobileExpanded ? 'translate-x-0 w-64' : '-translate-x-full w-64'
            : isDesktopCollapsed ? 'w-16' : 'w-64'
          }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className={`flex items-center ${isDesktopCollapsed && !isSmallScreen ? 'justify-center w-full' : ''}`}>
            <div className={`flex items-center justify-center ${isDesktopCollapsed && !isSmallScreen ? 'w-7 h-7' : 'w-7 h-7 mr-2.5'}`}>
              <img src={img.jjslogo1} alt="JJS Logo" className="object-contain w-7 h-7" />
            </div>
            <div className={showLabel ? 'block' : 'hidden'}>
              <h1 className="text-xl font-bold text-white">JJS-Track</h1>
              <p className="text-gray-400 text-xs">Management App</p>
            </div>
          </div>
          {!isSmallScreen && !isDesktopCollapsed && (
            <button
              onClick={toggleDesktop}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors duration-200"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} className="text-gray-300" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className={`space-y-1 ${isDesktopCollapsed && !isSmallScreen ? 'px-2' : 'px-3'}`}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li
                  key={item.path}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    to={item.path}
                    onClick={() => isSmallScreen && setMobileExpanded(false)}
                    className={`flex items-center gap-2.5 w-full rounded-lg transition-all duration-200 group
                      ${isDesktopCollapsed && !isSmallScreen ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}
                      ${isActive ? 'bg-[#2563EB]/20 text-[#60A5FA]' : 'hover:bg-gray-700/60 text-gray-400 hover:text-white'}`}
                  >
                    <item.icon
                      size={19}
                      className={`transition-colors duration-200 flex-shrink-0 ${isActive ? 'text-[#60A5FA]' : 'text-gray-400 group-hover:text-white'}`}
                    />
                    <div className={`flex flex-col ${showLabel ? 'block' : 'hidden'}`}>
                      <span className="font-medium text-sm leading-tight">{item.label}</span>
                      <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-blue-300' : 'text-gray-500'}`}>
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Tooltips */}
        {isDesktopCollapsed && !isSmallScreen && hoveredItem && navItems.find(i => i.path === hoveredItem) && (
          <div
            className="fixed left-[4.5rem] z-[200] pointer-events-none"
            style={{ top: `${document.querySelector(`a[href="${hoveredItem}"]`)?.getBoundingClientRect().top || 0}px` }}
          >
            <div className="bg-gray-900 text-white px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap text-xs">
              <div className="font-semibold">{navItems.find(i => i.path === hoveredItem)?.label}</div>
              <div className="text-[10px] text-gray-300 mt-0.5">{navItems.find(i => i.path === hoveredItem)?.description}</div>
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900" />
            </div>
          </div>
        )}

        {/* Logout */}
        <div className={`mt-1 mb-3 border-t border-gray-700 pt-2 ${isDesktopCollapsed && !isSmallScreen ? 'px-2' : 'px-3'}`}>
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className={`flex items-center gap-2.5 w-full rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200 group
                ${isDesktopCollapsed && !isSmallScreen ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}`}
            >
              <MdLogout size={19} className="text-red-400 flex-shrink-0" />
              <div className={`flex flex-col ${showLabel ? 'block' : 'hidden'}`}>
                <span className="font-medium text-sm leading-tight">Logout</span>
                <span className="text-[10px] text-red-500 leading-tight mt-0.5">Sign out securely</span>
              </div>
            </button>

            {isDesktopCollapsed && !isSmallScreen && hoveredItem === 'logout' && (
              <div
                className="fixed left-[4.5rem] z-[200] pointer-events-none"
                style={{ top: `${document.querySelector('button[aria-label="Logout"]')?.getBoundingClientRect().top || 0}px` }}
              >
                <div className="bg-gray-900 text-white px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap text-xs">
                  <div className="font-semibold">Logout</div>
                  <div className="text-[10px] text-gray-300 mt-0.5">Sign out securely</div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
      {!isSmallScreen && isDesktopCollapsed && (
        <button
          onClick={toggleDesktop}
          style={{ left: '52px', top: '20px' }}
          className="fixed w-6 h-6 bg-[#0F172A] border-2 border-gray-500 rounded-full flex items-center justify-center hover:bg-gray-700 hover:border-gray-300 transition-all duration-200 shadow-lg z-[50]"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-3 h-3 text-gray-300" />
        </button>
      )}
    </>
  )
}

export default HomeSidebar