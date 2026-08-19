import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
    LayoutDashboard,
    Calendar,
    ShoppingBag,
    Users,
    Package,
    BarChart3,
    QrCode,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    PhilippinePeso,
} from 'lucide-react'
import img from '../assets/img.js'

const NAV_ITEMS = [
    { type: 'section', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard', description: 'Your main dashboard', path: '/admin/dashboard' },

    { type: 'section', label: 'Operations' },
    { icon: Calendar, label: 'Appointment', description: 'Booking schedule and queue', path: '/admin/appointment' },
    {
        icon: ShoppingBag,
        label: 'Orders',
        description: 'Production workflow and records',
        subItems: [
            { label: 'All Orders', path: '/admin/orders', matchNested: true },
            { label: 'Released', path: '/admin/released' },
            { label: 'Archives', path: '/admin/archives' },
        ]
    },
    {
        icon: Package,
        label: 'Inventory',
        description: 'Stock control and movement logs',
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

// Utility to check active path
const isPathActive = (pathname, targetPath, matchNested = false) => {
    if (!targetPath) return false
    return pathname === targetPath || (matchNested && pathname.startsWith(`${targetPath}/`))
}

const AdminSidebar = ({ collapsed, setCollapsed, isMobileExpanded, setIsMobileExpanded }) => {
    const location = useLocation()

    // Screen breakpoint state (Mobile: < 1024px)
    const [isSmallScreen, setIsSmallScreen] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    )
    const [hoveredItem, setHoveredItem] = useState(null)
    const [expandedSubmenus, setExpandedSubmenus] = useState({})

    const isDesktopCollapsed = collapsed ?? true
    const setIsDesktopCollapsed = setCollapsed ?? (() => { })
    const mobileExpanded = isMobileExpanded ?? false
    const setMobileExpanded = setIsMobileExpanded ?? (() => { })

    // Sync viewport resize
    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth < 1024
            setIsSmallScreen(small)
            if (!small) setMobileExpanded(false)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [setMobileExpanded])

    // Automatically expand active submenus based on route
    useEffect(() => {
        const activeSubmenus = NAV_ITEMS.reduce((acc, item) => {
            if (item.subItems?.some(sub => isPathActive(location.pathname, sub.path, sub.matchNested))) {
                acc[item.label] = true
            }
            return acc
        }, {})

        if (Object.keys(activeSubmenus).length > 0) {
            setExpandedSubmenus(prev => ({ ...prev, ...activeSubmenus }))
        }
    }, [location.pathname])

    // Click outside to close mobile sidebar
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.getElementById('admin-sidebar')
            if (mobileExpanded && sidebar && !sidebar.contains(event.target)) {
                setMobileExpanded(false)
            }
        }
        if (mobileExpanded) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [mobileExpanded, setMobileExpanded])

    const toggleSubMenu = (label) => {
        if (isDesktopCollapsed && !isSmallScreen) {
            setIsDesktopCollapsed(false)
        }
        setExpandedSubmenus(prev => ({ ...prev, [label]: !prev[label] }))
    }

    const toggleDesktop = () => {
        if (!isDesktopCollapsed) {
            setExpandedSubmenus({})
        }
        setIsDesktopCollapsed(!isDesktopCollapsed)
    }

    // Label visibility rule:
    // Mobile: Show full labels only when mobile sidebar is open
    // Desktop: Show full labels when desktop sidebar is expanded
    const showLabels = isSmallScreen ? mobileExpanded : !isDesktopCollapsed

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileExpanded && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={() => setMobileExpanded(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Main Container */}
            <aside
                id="admin-sidebar"
                className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-40 shadow-xl border-r border-gray-700 flex flex-col font-inter
                    ${mobileExpanded ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
                    ${isDesktopCollapsed ? 'lg:w-20 lg:translate-x-0' : 'lg:w-64 lg:translate-x-0'}
                `}
            >
                {/* Brand / Logo Header */}
                <div
                    className="p-4 border-b border-gray-700 flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ paddingLeft: isDesktopCollapsed && !isSmallScreen ? '22px' : '24px' }}
                >
                    <div className="flex items-center w-full">
                        <div className="flex items-center justify-center w-8 h-8 mr-3 shrink-0">
                            <img src={img.JJS} alt="JJS Logo" className="object-contain w-8 h-8" />
                        </div>
                        <div
                            className="flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            style={{
                                width: showLabels ? '120px' : '0px',
                                opacity: showLabels ? 1 : 0,
                                transform: showLabels ? 'translateX(0)' : 'translateX(-10px)',
                                pointerEvents: showLabels ? 'auto' : 'none',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <h1 className="text-sm font-bold text-white tracking-tight leading-none">JJS-Track</h1>
                            <p className="text-gray-400 text-xs uppercase font-semibold tracking-widest mt-0.5 leading-none">Admin Portal</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Items List */}
                <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-1 px-3">
                        {NAV_ITEMS.map((item, index) => {
                            // Section Header
                            if (item.type === 'section') {
                                return (
                                    <li
                                        key={item.label}
                                        className="relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                                        style={{
                                            maxHeight: showLabels ? '32px' : '0px',
                                            opacity: showLabels ? 1 : 0,
                                            padding: showLabels ? '2px 0' : '0',
                                            margin: showLabels ? '' : '0',
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
                            const isSubmenuExpanded = expandedSubmenus[item.label]

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
                                    {/* Submenu Item Button */}
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
                                                    width: showLabels ? '150px' : '0px',
                                                    opacity: showLabels ? 1 : 0,
                                                    transform: showLabels ? 'translateX(0)' : 'translateX(-8px)',
                                                    pointerEvents: showLabels ? 'auto' : 'none',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    marginLeft: showLabels ? '12px' : '0px'
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-XS leading-tight">{item.label}</span>
                                                    {item.description && (
                                                        <span className={`text-[8px] leading-tight mt-0.5 ${isActive ? 'text-blue-300/80' : 'text-slate-500'}`}>
                                                            {item.description}
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform duration-300 ${isSubmenuExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`}
                                                />
                                            </div>
                                        </button>
                                    ) : (
                                        /* Single Link Nav Item */
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
                                                    width: showLabels ? '150px' : '0px',
                                                    opacity: showLabels ? 1 : 0,
                                                    transform: showLabels ? 'translateX(0)' : 'translateX(-8px)',
                                                    pointerEvents: showLabels ? 'auto' : 'none',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    marginLeft: showLabels ? '12px' : '0px'
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

                                    {/* Submenu Accordion */}
                                    {item.subItems && (
                                        <div
                                            className="grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                                            style={{
                                                gridTemplateRows: (isSubmenuExpanded && showLabels) ? '1fr' : '0fr',
                                                opacity: (isSubmenuExpanded && showLabels) ? 1 : 0,
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

                {/* Collapsed Desktop Tooltip */}
                {isDesktopCollapsed && !isSmallScreen && hoveredItem && NAV_ITEMS.find(i => i.label === hoveredItem) && (
                    <div
                        className="fixed left-[4.5rem] z-[200] pointer-events-none"
                        style={{ top: `${document.querySelector(`li[data-nav-label="${hoveredItem}"]`)?.getBoundingClientRect().top || 0}px` }}
                    >
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-xs border border-gray-800 min-w-max">
                            <div className="font-semibold">{hoveredItem}</div>
                            {NAV_ITEMS.find(i => i.label === hoveredItem)?.description && (
                                <div className="text-[8px] text-gray-300 mt-0.5">{NAV_ITEMS.find(i => i.label === hoveredItem)?.description}</div>
                            )}
                            {NAV_ITEMS.find(i => i.label === hoveredItem)?.subItems && (
                                <div className="mt-2 pt-2 border-t border-gray-700 flex flex-col gap-1 pointer-events-auto">
                                    {NAV_ITEMS.find(i => i.label === hoveredItem)?.subItems.map(subItem => (
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

            {/* Desktop Expand / Collapse Floating Button */}
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

export default AdminSidebar
