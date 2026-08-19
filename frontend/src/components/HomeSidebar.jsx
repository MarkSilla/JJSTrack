import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import img from '../assets/img.js'
import { LayoutDashboard, Calendar, LogOut, ShoppingBag, Receipt, Settings, ChevronLeft, ChevronRight, Palette } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', description: 'Your main dashboard', path: '/home' },
  { icon: Palette, label: 'Designs', description: 'Explore jersey designs', path: '/designs' },
  { icon: Calendar, label: 'Appointment', description: 'Manage appointments', path: '/appointment' },
  { icon: ShoppingBag, label: 'Orders', description: 'View all orders', path: '/order' },
  { icon: Receipt, label: 'Invoices', description: 'Billing & invoices', path: '/invoices' },
]

const HomeSidebar = ({ collapsed, setCollapsed, isMobileExpanded, setIsMobileExpanded, logout, onNavigateStart }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSmallScreen, setIsSmallScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
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
        className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white transition-all var(--duration-slow) var(--ease-out) z-40 shadow-xl border-r border-gray-700 flex flex-col font-inter
          ${mobileExpanded ? 'max-lg:translate-x-0 max-lg:w-64' : 'max-lg:-translate-x-full max-lg:w-64'}
          ${isDesktopCollapsed ? 'lg:w-20 lg:translate-x-0' : 'lg:w-64 lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 pl-[24px] border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center w-full">
            <div className="flex items-center justify-center w-8 h-8 mr-3 shrink-0">
              <img src={img.jjslogo1} alt="JJS Logo" className="object-contain w-8 h-8" />
            </div>
            <div
              className="flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: showLabel ? '120px' : '0px',
                opacity: showLabel ? 1 : 0,
                transform: showLabel ? 'translateX(0)' : 'translateX(-10px)',
                pointerEvents: showLabel ? 'auto' : 'none',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">JJS-Track</h1>
              <p className="text-gray-400 text-[8px] uppercase font-bold tracking-widest mt-0.5 leading-none">Management App</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1.5 px-3">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path
              return (
                <li
                  key={item.path}
                  className="relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    transform: isSmallScreen
                      ? mobileExpanded ? 'translateX(0)' : 'translateX(-16px)'
                      : 'none',
                    opacity: isSmallScreen
                      ? mobileExpanded ? 1 : 0
                      : 1,
                    transitionDelay: isSmallScreen && mobileExpanded
                      ? `${(index + 1) * 45}ms`
                      : '0ms'
                  }}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (isSmallScreen) {
                        setMobileExpanded(false)
                        onNavigateStart && onNavigateStart()
                      }
                    }}
                    className={`flex items-center w-full py-2.5 rounded-xl transition-all var(--duration-fast) var(--ease-out) group
                      ${isActive ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}`}
                    style={{
                      paddingLeft: isDesktopCollapsed && !isSmallScreen ? '18px' : '12px',
                      paddingRight: isDesktopCollapsed && !isSmallScreen ? '18px' : '12px'
                    }}
                  >
                    <item.icon
                      size={20}
                      className={`transition-transform var(--duration-fast) var(--ease-out) flex-shrink-0 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                    />
                    <div
                      className="flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        width: showLabel ? '150px' : '0px',
                        opacity: showLabel ? 1 : 0,
                        transform: showLabel ? 'translateX(0)' : 'translateX(-8px)',
                        pointerEvents: showLabel ? 'auto' : 'none',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        marginLeft: showLabel ? '12px' : '0px'
                      }}
                    >
                      <span className="font-medium text-sm leading-tight">{item.label}</span>
                      <span className={`text-[11px] leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
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
          className="fixed w-6 h-6 bg-[#0F172A] border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 hover:border-blue-500 transition-all var(--duration-slow) var(--ease-out) shadow-xl z-40 group"
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