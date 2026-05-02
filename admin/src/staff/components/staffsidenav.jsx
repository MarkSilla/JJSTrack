import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, ShoppingBag, Package, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react'
import img from '../assets/img.js'

const isPathActive = (pathname, targetPath, matchNested = false) => {
    if (!targetPath) return false
    return pathname === targetPath || (matchNested && pathname.startsWith(`${targetPath}/`))
}

const navItems = [
    { type: 'section', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard', description: 'Your main dashboard', path: '/staff/dashboard' },
    { type: 'section', label: 'Operations' },
    {
        icon: ShoppingBag, label: 'Orders', description: 'Assigned production work',
        subItems: [
            { label: 'Job Orders', path: '/staff/orders', matchNested: true },
            { label: 'Order Archives', path: '/staff/archives' },
        ]
    },
    {
        icon: Package, label: 'Inventory', description: 'Supplies and stock usage',
        subItems: [
            { label: 'Current Stock', path: '/staff/inventory' },
            { label: 'Usage History', path: '/staff/inventory/history' },
        ],
    },
]

const StaffSidebar = ({ collapsed, setCollapsed, isMobileExpanded, setIsMobileExpanded, logout }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const [isSmallScreen, setIsSmallScreen] = useState(false)
    const [hoveredItem, setHoveredItem] = useState(null)

    const isDesktopCollapsed = collapsed ?? true
    const setIsDesktopCollapsed = setCollapsed ?? (() => { })
    const mobileExpanded = isMobileExpanded ?? false
    const setMobileExpanded = setIsMobileExpanded ?? (() => { })

    const [expandedMenus, setExpandedMenus] = useState({})

    useEffect(() => {
        const nextExpanded = navItems.reduce((acc, item) => {
            if (item.type === 'section') return acc
            if (item.subItems?.some((subItem) => isPathActive(location.pathname, subItem.path, subItem.matchNested))) {
                acc[item.label] = true
            }
            return acc
        }, {})

        if (Object.keys(nextExpanded).length === 0) return

        setExpandedMenus(prev => ({
            ...prev,
            ...nextExpanded,
        }))
    }, [location.pathname])

    const toggleSubMenu = (label) => {
        if (isDesktopCollapsed && !isSmallScreen) {
            setIsDesktopCollapsed(false)
        }
        setExpandedMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }))
    }

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
        // Clear authentication data from localStorage
        localStorage.removeItem('staffToken')
        localStorage.removeItem('rememberStaffEmail')
        navigate('/staff/login')
    }

    const toggleDesktop = () => {
        if (!isDesktopCollapsed) {
            setExpandedMenus({})
        }
        setIsDesktopCollapsed(!isDesktopCollapsed)
    }
    const showLabel = isSmallScreen ? mobileExpanded : !isDesktopCollapsed

    return (
        <>
            {mobileExpanded && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setMobileExpanded(false)}
                    aria-hidden="true"
                />
            )}
            <aside
                id="jjs-sidebar"
                className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white transition-all duration-300 ease-in-out z-50 shadow-xl border-r border-gray-800 flex flex-col
          ${isSmallScreen
                        ? mobileExpanded ? 'translate-x-0 w-64' : '-translate-x-full w-64'
                        : isDesktopCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                <div className="p-4 border-b border-gray-800 flex items-center justify-between h-16 shrink-0">
                    <div className={`flex items-center ${isDesktopCollapsed && !isSmallScreen ? 'justify-center w-full' : ''}`}>
                        <div className={`flex items-center justify-center ${isDesktopCollapsed && !isSmallScreen ? 'w-8 h-8' : 'w-8 h-8 mr-2.5'}`}>
                            <img src={img.JJS} alt="JJS Logo" className="object-contain w-8 h-8" />
                        </div>
                        <div className={showLabel ? 'block' : 'hidden'}>
                            <h1 className="text-xl font-bold text-white tracking-tight">JJS-Track</h1>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Staff</p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                    <ul className={`space-y-1.5 ${isDesktopCollapsed && !isSmallScreen ? 'px-3' : 'px-4'}`}>
                        {navItems.map((item) => {
                            if (item.type === 'section') {
                                return (
                                    <li key={item.label} className={showLabel ? 'px-4 pt-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500' : 'my-3 border-t border-gray-800'} >
                                        {showLabel ? item.label : null}
                                    </li>
                                )
                            }

                            const isActive = item.path
                                ? isPathActive(location.pathname, item.path, item.matchNested)
                                : item.subItems?.some(sub => isPathActive(location.pathname, sub.path, sub.matchNested))
                            const isExpanded = expandedMenus[item.label]

                            return (
                                <li
                                    key={item.label}
                                    className="relative flex flex-col"
                                    onMouseEnter={() => setHoveredItem(item.label)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    {item.subItems ? (
                                        <button
                                            onClick={() => toggleSubMenu(item.label)}
                                            className={`flex items-center gap-3 w-full rounded-xl transition-all duration-200 group border-none cursor-pointer outline-none bg-transparent
                                                ${isDesktopCollapsed && !isSmallScreen ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
                                                ${isActive ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
                                        >
                                            <item.icon
                                                size={20}
                                                className={`transition-all duration-300 shrink-0 group-hover:scale-110 ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-gray-400 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`}
                                            />
                                            <div className={`flex items-center justify-between w-full ${showLabel ? 'block' : 'hidden'}`}>
                                                <span className="font-bold text-sm leading-none">{item.label}</span>
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-gray-500'}`}
                                                />
                                            </div>
                                        </button>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            onClick={() => isSmallScreen && setMobileExpanded(false)}
                                            className={`flex items-center gap-3 w-full rounded-xl transition-all duration-200 group outline-none
                                                ${isDesktopCollapsed && !isSmallScreen ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
                                                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
                                        >
                                            <item.icon
                                                size={20}
                                                className={`transition-all duration-300 shrink-0 group-hover:scale-110 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-gray-400 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`}
                                            />
                                            <div className={`flex flex-col ${showLabel ? 'block' : 'hidden'}`}>
                                                <span className="font-bold text-sm leading-none">{item.label}</span>
                                                {isActive && <span className="text-[10px] text-blue-200 mt-1">Active</span>}
                                            </div>
                                        </Link>
                                    )}
                                    {item.subItems && isExpanded && showLabel && (
                                        <ul className="mt-1 space-y-1 px-3 ml-6 border-l border-gray-700">
                                            {item.subItems.map((subItem) => {
                                                const isSubActive = isPathActive(location.pathname, subItem.path, subItem.matchNested)
                                                return (
                                                    <li key={subItem.path}>
                                                        <Link
                                                            to={subItem.path}
                                                            onClick={() => isSmallScreen && setMobileExpanded(false)}
                                                            className={`block px-4 py-2 text-[12px] rounded-lg transition-colors font-semibold
                                                                ${isSubActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                                        >
                                                            {subItem.label}
                                                        </Link>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}

                                    {/* Tooltips for collapsed desktop */}
                                    {isDesktopCollapsed && !isSmallScreen && hoveredItem === item.label && (
                                        <div className="fixed left-24 z-[100] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs border border-gray-800 min-w-max">
                                            <div className="font-bold">{item.label}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5 mb-1">{item.description}</div>

                                            {/* Show quick links on hover if it has subitems */}
                                            {item.subItems && (
                                                <div className="mt-2 pt-2 border-t border-gray-700 flex flex-col gap-1">
                                                    {item.subItems.map(subItem => (
                                                        <Link
                                                            key={subItem.path}
                                                            to={subItem.path}
                                                            className={`text-[10px] py-1 px-2 rounded-md transition-colors ${isPathActive(location.pathname, subItem.path, subItem.matchNested) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                                        >
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="absolute right-full top-[18px] -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900" />
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Footer with Settings and Logout */}
                <div className={`border-t border-gray-800 py-3 shrink-0 ${isDesktopCollapsed && !isSmallScreen ? 'px-3' : 'px-4'}`}>

                </div>
            </aside>

            {/* Desktop Expand/Collapse Button */}
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

export default StaffSidebar
