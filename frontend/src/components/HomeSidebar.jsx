import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import img from '../assets/img.js'
import { LayoutDashboard, Calendar, LogOut, ShoppingBag, Receipt, Settings, ChevronLeft, ChevronRight } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', description: 'Your main dashboard', path: '/home' },
  { icon: Calendar, label: 'Appointment', description: 'Manage appointments', path: '/appointment' },
  { icon: ShoppingBag, label: 'Orders', description: 'View all orders', path: '/order' },
  { icon: Receipt, label: 'Invoices', description: 'Billing & invoices', path: '/invoices' },
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
        className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white transition-all duration-300 ease-in-out z-40 shadow-xl border-r border-gray-700 flex flex-col font-inter
          ${isSmallScreen
            ? mobileExpanded ? 'translate-x-0 w-64' : '-translate-x-full w-64'
            : isDesktopCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className={`flex items-center ${isDesktopCollapsed && !isSmallScreen ? 'justify-center w-full' : ''}`}>
            <div className={`flex items-center justify-center ${isDesktopCollapsed && !isSmallScreen ? 'w-8 h-8' : 'w-8 h-8 mr-2.5'}`}>
              <img src={img.jjslogo1} alt="JJS Logo" className="object-contain w-8 h-8" />
            </div>
            <div className={showLabel ? 'block' : 'hidden'}>
              <h1 className="text-xl font-bold text-white tracking-tight">JJS-Track</h1>
              <p className="text-gray-400 text-[8px] uppercase font-bold tracking-widest">Management App</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className={`space-y-1 ${isDesktopCollapsed && !isSmallScreen ? 'px-3' : 'px-4'}`}>
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
                    className={`flex items-center gap-3 w-full rounded-lg transition-all duration-200 group
                      ${isDesktopCollapsed && !isSmallScreen ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
                      ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                  >
                    <item.icon
                      size={20}
                      className={`transition-all duration-300 flex-shrink-0 group-hover:scale-110 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-gray-400 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`}
                    />
                    <div className={`flex flex-col ${showLabel ? 'block' : 'hidden'}`}>
                      <span className="font-medium text-sm leading-tight">{item.label}</span>
                      <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-white' : 'text-gray-500'}`}>
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
      </aside>
        {!isSmallScreen && (
          <button
            onClick={toggleDesktop}
            style={{ left: isDesktopCollapsed ? '70px' : '246px', top: '24px' }}
            className="fixed w-6 h-6 bg-[#0F172A] border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 hover:border-blue-500 transition-all duration-300 shadow-xl z-[60] group"
            aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
            {isDesktopCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                )}
            </button>
        )}
    </>
  )
}

export default HomeSidebar