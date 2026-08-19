import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Calendar, ShoppingBag, Users, Package, BarChart3, QrCode, ChevronLeft, ChevronRight, ChevronDown, PhilippinePeso,
} from 'lucide-react'
import img from '../assets/img.js'

const isPathActive = (pathname, targetPath, matchNested = false) => {
    if (!targetPath) return false
    return pathname === targetPath || (matchNested && pathname.startsWith(`${targetPath}/`))
}

const navItems = [
    { type: 'section', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard', description: 'Your main dashboard', path: '/admin/dashboard' },
    { type: 'section', label: 'Operations' },
    { icon: Calendar, label: 'Appointment', description: 'Booking schedule and queue', path: '/admin/appointment' },
    {
        icon: ShoppingBag, label: 'Orders', description: 'Production workflow and records',
        subItems: [
            { label: 'All Orders', path: '/admin/orders', matchNested: true },
            { label: 'Released', path: '/admin/released' },
            { label: 'Archives', path: '/admin/archives' },
        ]
    },
    {
        icon: Package, label: 'Inventory', description: 'Stock control and movement logs',
        subItems: [
            { label: 'Current Stock', path: '/admin/inventory' },
            { label: 'Stock History', path: '/admin/inventory/history' },
        ]
    },
    { icon: QrCode, label: 'QR Scanner', description: 'Release and pickup scanning', path: '/admin/qr-scanner' },
    { type: 'section', label: 'Management' },
    { icon: Users, label: 'Staff', description: 'Employee profiles and access', path: '/admin/staff' },
    { icon: PhilippinePeso, label: 'Services Pricing', description: 'Update service rates', path: '/admin/services-pricing' },
    { type: 'section', label: 'Insights' },
    { icon: BarChart3, label: 'Report', description: 'Analytics and business performance', path: '/admin/report' },
]

const HomeSidebar = ({ collapsed, setCollapsed, isMobileExpanded, setIsMobileExpanded }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const [isSmallScreen, setIsSmallScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
    const [hoveredItem, setHoveredItem] = useState(null)
    const [expandedMenus, setExpandedMenus] = useState({})

    const isDesktopCollapsed = collapsed ?? true
    const setIsDesktopCollapsed = setCollapsed ?? (() => { })
    const mobileExpanded = isMobileExpanded ?? false
    const setMobileExpanded = setIsMobileExpanded ?? (() => { })

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

    const toggleDesktop = () => {
        if (!isDesktopCollapsed) {
            setExpandedMenus({})
        }
        setIsDesktopCollapsed(!isDesktopCollapsed)
    }

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
                className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-40 shadow-xl border-r border-gray-700 flex flex-col font-inter
          ${isSmallScreen
                        ? mobileExpanded ? 'translate-x-0 w-64' : '-translate-x-full w-64'
                        : isDesktopCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ paddingLeft: isDesktopCollapsed && !isSmallScreen ? '22px' : '24px' }}
                >
                    <div className="flex items-center w-full">
                        <div className="flex items-center justify-center w-8 h-8 mr-3 shrink-0">
                            <img src={img.JJS} alt="JJS Logo" className="object-contain w-8 h-8" />
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
                            <p className="text-gray-400 text-xs uppercase font-semibold tracking-widest mt-0.5 leading-none">Admin Portal</p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-1 px-3">
                        {navItems.map((item, index) => {
                            if (item.type === 'section') {
                                return (
                                    <li key={item.label} className="relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                                        style={{
                                            maxHeight: showLabel ? '32px' : '0px',
                                            opacity: showLabel ? 1 : 0,
                                            padding: showLabel ? '2px 0' : '0',
                                            margin: showLabel ? '' : '0',
                                        }}
                                    >
                                        <div className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                                            {item.label}
                                        </div>
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
                                    data-nav-label={item.label}
                                    className="relative flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
                                    onMouseEnter={() => setHoveredItem(item.label)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    {item.subItems ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleSubMenu(item.label)}
                                            className={`flex items-center w-full py-2 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group border-none cursor-pointer outline-none bg-transparent text-left
                                                ${isActive ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}`}
                                            style={{
                                                paddingLeft: isDesktopCollapsed && !isSmallScreen ? '16px' : '12px',
                                                paddingRight: isDesktopCollapsed && !isSmallScreen ? '16px' : '12px'
                                            }}
                                        >
                                            <item.icon
                                                size={20}
                                                className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex-shrink-0 group-hover:scale-105 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`}
                                            />
                                            <div
                                                className="flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm leading-tight">{item.label}</span>
                                                    {item.description && (
                                                        <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-blue-300/80' : 'text-slate-500'}`}>
                                                            {item.description}
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`}
                                                />
                                            </div>
                                        </button>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            onClick={() => isSmallScreen && setMobileExpanded(false)}
                                            className={`flex items-center w-full py-2 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group outline-none
                                                ${isActive ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}`}
                                            style={{
                                                paddingLeft: isDesktopCollapsed && !isSmallScreen ? '16px' : '12px',
                                                paddingRight: isDesktopCollapsed && !isSmallScreen ? '16px' : '12px'
                                            }}
                                        >
                                            <item.icon
                                                size={20}
                                                className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex-shrink-0 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
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
                                                {item.description && (
                                                    <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                                                        {item.description}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    )}

                                    {/* Submenu Dropdown */}
                                    {item.subItems && (
                                        <div
                                            className="grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                                            style={{
                                                gridTemplateRows: (isExpanded && showLabel) ? '1fr' : '0fr',
                                                opacity: (isExpanded && showLabel) ? 1 : 0,
                                            }}
                                        >
                                            <div className="overflow-hidden">
                                                <ul className="mt-1 space-y-1 pl-9 pr-2 border-l border-slate-700/60 ml-5 py-1">
                                                    {item.subItems.map((subItem) => {
                                                        const isSubActive = isPathActive(location.pathname, subItem.path, subItem.matchNested)
                                                        return (
                                                            <li key={subItem.path}>
                                                                <Link
                                                                    to={subItem.path}
                                                                    onClick={() => isSmallScreen && setMobileExpanded(false)}
                                                                    className={`block px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium
                                                                        ${isSubActive ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}`}
                                                                >
                                                                    {subItem.label}
                                                                </Link>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Tooltips for collapsed desktop */}
                {isDesktopCollapsed && !isSmallScreen && hoveredItem && navItems.find(i => i.label === hoveredItem) && (
                    <div
                        className="fixed left-[4.5rem] z-[200] pointer-events-none"
                        style={{ top: `${document.querySelector(`li[data-nav-label="${hoveredItem}"]`)?.getBoundingClientRect().top || 0}px` }}
                    >
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-xs border border-gray-800 min-w-max">
                            <div className="font-semibold">{hoveredItem}</div>
                            {navItems.find(i => i.label === hoveredItem)?.description && (
                                <div className="text-[10px] text-gray-300 mt-0.5">{navItems.find(i => i.label === hoveredItem)?.description}</div>
                            )}
                            {navItems.find(i => i.label === hoveredItem)?.subItems && (
                                <div className="mt-2 pt-2 border-t border-gray-700 flex flex-col gap-1 pointer-events-auto">
                                    {navItems.find(i => i.label === hoveredItem)?.subItems.map(subItem => (
                                        <Link
                                            key={subItem.path}
                                            to={subItem.path}
                                            className={`text-[10px] py-1 px-2 rounded-md transition-colors ${isPathActive(location.pathname, subItem.path, subItem.matchNested) ? 'bg-blue-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                        >
                                            {subItem.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <div className="absolute right-full top-3 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900" />
                        </div>
                    </div>
                )}
            </aside>

            {/* Desktop Expand/Collapse Button */}
            {!isSmallScreen && (
                <button
                    type="button"
                    onClick={toggleDesktop}
                    style={{ left: isDesktopCollapsed ? '70px' : '246px', top: '24px' }}
                    className="fixed w-6 h-6 bg-[#0F172A] border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 hover:border-blue-500 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xl z-50 group cursor-pointer"
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
