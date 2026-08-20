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
    User,
    X
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
    { icon: BarChart3, label: 'Reports', description: 'Analytics & performance', path: '/admin/report' },
]

const isPathActive = (pathname, targetPath, matchNested = false) => {
    if (!targetPath) return false
    return pathname === targetPath || (matchNested && pathname.startsWith(`${targetPath}/`))
}

const AdminSidebar = ({ collapsed = true, setCollapsed = () => { }, isMobileOpen = false, setIsMobileOpen = () => { } }) => {
    const location = useLocation()
    const [tooltipState, setTooltipState] = useState({ visible: false, label: '', top: 0 })
    const [expandedSubmenus, setExpandedSubmenus] = useState({})
    const [isSmallScreen, setIsSmallScreen] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    )

    // Sync viewport size
    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth < 1024
            setIsSmallScreen(small)
            if (!small) setIsMobileOpen(false)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [setIsMobileOpen])

    // Auto-close mobile drawer on route change (e.g. after login redirect)
    useEffect(() => {
        if (isSmallScreen) {
            setIsMobileOpen(false)
        }
    }, [location.pathname])

    // Auto expand active submenus based on route
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

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        if (isSmallScreen && isMobileOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isSmallScreen, isMobileOpen])

    const toggleSubMenu = (label) => {
        if (collapsed && !isSmallScreen) {
            setCollapsed(false)
        }
        setExpandedSubmenus(prev => ({ ...prev, [label]: !prev[label] }))
    }

    const toggleDesktop = () => {
        if (!collapsed) {
            setExpandedSubmenus({})
        }
        setCollapsed(!collapsed)
    }

    const handleMouseEnter = (itemObj, e) => {
        if (collapsed && !isSmallScreen) {
            const rect = e.currentTarget.getBoundingClientRect()
            setTooltipState({
                visible: true,
                item: itemObj,
                top: rect.top + rect.height / 2
            })
        }
    }

    const handleMouseLeave = () => {
        setTooltipState(prev => ({ ...prev, visible: false }))
    }

    const showLabels = isSmallScreen ? true : !collapsed

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isSmallScreen && isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Main Container */}
            <aside
                id="admin-sidebar"
                className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white z-40 shadow-2xl border-r border-slate-800 flex flex-col font-inter transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    w-80 max-w-[85vw] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 ${collapsed ? 'lg:w-20' : 'lg:w-64'}
                `}
            >
                {/* Brand / Logo Header */}
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center w-full min-w-0 justify-center lg:justify-start">
                        <div className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl ">
                            <img src={img.JJS} alt="JJS Logo" className="object-contain w-8 h-8" />
                        </div>
                        <div
                            className="flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap ml-3"
                            style={{
                                width: showLabels ? '140px' : '0px',
                                opacity: showLabels ? 1 : 0,
                            }}
                        >
                            <h1 className="text-sm font-bold text-white tracking-tight leading-none">JJS-Track</h1>
                            <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-widest mt-0.5 leading-none">Admin Portal</p>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    {isSmallScreen && (
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Navigation Items List (Compact Layout) */}
                <nav className="flex-1 py-2 px-2.5 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item, index) => {
                            const isSection = item.type === 'section'
                            const isActive = item.path
                                ? isPathActive(location.pathname, item.path, item.matchNested)
                                : item.subItems?.some(sub => isPathActive(location.pathname, sub.path, sub.matchNested))
                            const isSubmenuExpanded = expandedSubmenus[item.label]

                            if (isSection) {
                                const isFirst = index === 0
                                return (
                                    <li key={item.label} className="overflow-hidden">
                                        {showLabels ? (
                                            <div className={`px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap ${isFirst ? 'pt-2 pb-1' : 'pt-5 pb-1'
                                                }`}>
                                                {item.label}
                                            </div>
                                        ) : (
                                            /* 24px Section Gap in Collapsed Mode (Matches design spec) */
                                            !isFirst && (
                                                <div className="my-2.5 h-4 flex items-center justify-center">
                                                    <div className="w-5 h-[1px] bg-slate-800/80 rounded-full" />
                                                </div>
                                            )
                                        )}
                                    </li>
                                )
                            }

                            const Icon = item.icon

                            return (
                                <li
                                    key={item.label}
                                    className="relative flex flex-col my-0.5"
                                    onMouseEnter={(e) => handleMouseEnter(item, e)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {item.subItems ? (
                                        /* Dropdown Accordion Item */
                                        <button
                                            type="button"
                                            onClick={() => toggleSubMenu(item.label)}
                                            className={`flex items-center w-full rounded-xl border transition-all duration-200 group text-left outline-none cursor-pointer ${collapsed && !isSmallScreen ? 'w-10 h-10 mx-auto justify-center px-0' : 'h-10 px-3'
                                                } ${isActive
                                                    ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 font-semibold'
                                                    : 'border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                                }`}
                                        >
                                            <Icon
                                                size={19}
                                                className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                                                    }`}
                                            />
                                            <div
                                                className="flex items-center justify-between transition-all duration-200 overflow-hidden whitespace-nowrap ml-3 flex-1"
                                                style={{
                                                    width: showLabels ? '100%' : '0px',
                                                    opacity: showLabels ? 1 : 0,
                                                    display: showLabels ? 'flex' : 'none'
                                                }}
                                            >
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-medium leading-tight">{item.label}</span>
                                                </div>
                                                <ChevronDown
                                                    size={15}
                                                    className={`transition-transform duration-200 shrink-0 ml-1 ${isSubmenuExpanded ? 'rotate-180 text-white' : 'text-slate-500'
                                                        }`}
                                                />
                                            </div>
                                        </button>
                                    ) : (
                                        /* Single Link Item */
                                        <Link
                                            to={item.path}
                                            onClick={() => isSmallScreen && setIsMobileOpen(false)}
                                            className={`flex items-center w-full rounded-xl border transition-all duration-200 group outline-none ${collapsed && !isSmallScreen ? 'w-10 h-10 mx-auto justify-center px-0' : 'h-10 px-3'
                                                } ${isActive
                                                    ? 'bg-blue-600 border-blue-500 text-white font-semibold shadow-md shadow-blue-600/25'
                                                    : 'border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                                }`}
                                        >
                                            <Icon
                                                size={19}
                                                className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                                                    }`}
                                            />
                                            <div
                                                className="flex flex-col transition-all duration-200 overflow-hidden whitespace-nowrap ml-3 flex-1"
                                                style={{
                                                    width: showLabels ? '100%' : '0px',
                                                    opacity: showLabels ? 1 : 0,
                                                    display: showLabels ? 'flex' : 'none'
                                                }}
                                            >
                                                <span className="text-xs font-medium leading-tight">{item.label}</span>
                                            </div>
                                        </Link>
                                    )}

                                    {/* Submenu Accordion Drawer */}
                                    {item.subItems && showLabels && (
                                        <div
                                            className="grid transition-all duration-200 ease-in-out overflow-hidden"
                                            style={{
                                                gridTemplateRows: isSubmenuExpanded ? '1fr' : '0fr',
                                                opacity: isSubmenuExpanded ? 1 : 0,
                                            }}
                                        >
                                            <div className="overflow-hidden">
                                                <ul className="mt-1 space-y-1 pl-7 pr-2 border-l border-slate-700/60 ml-3 py-1">
                                                    {item.subItems.map((subItem) => {
                                                        const isSubActive = isPathActive(location.pathname, subItem.path, subItem.matchNested)
                                                        return (
                                                            <li key={subItem.path}>
                                                                <Link
                                                                    to={subItem.path}
                                                                    onClick={() => isSmallScreen && setIsMobileOpen(false)}
                                                                    className={`block px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${isSubActive
                                                                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                                                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                                                                        }`}
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
            </aside>

            {/* Fixed Floating Tooltip / Popover on Desktop Hover */}
            {collapsed && !isSmallScreen && tooltipState.visible && tooltipState.item && (
                <div
                    className="fixed z-[9999] pointer-events-auto -translate-y-1/2 animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: '92px', top: `${tooltipState.top}px` }}
                    onMouseEnter={() => setTooltipState(prev => ({ ...prev, visible: true }))}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="relative bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-2xl whitespace-nowrap text-xs border border-slate-700/90 flex flex-col gap-1 min-w-[130px]">
                        {/* Left Arrow Pointer */}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-b-[5px] border-r-[6px] border-t-transparent border-b-transparent border-r-slate-900" />

                        <div className="font-semibold text-white tracking-tight leading-tight">{tooltipState.item.label}</div>

                        {tooltipState.item.subItems && (
                            <div className="mt-1 pt-1.5 border-t border-slate-700/80 flex flex-col gap-1">
                                {tooltipState.item.subItems.map((sub) => (
                                    <Link
                                        key={sub.path}
                                        to={sub.path}
                                        onClick={() => setTooltipState(prev => ({ ...prev, visible: false }))}
                                        className={`text-[11px] py-1 px-2.5 rounded-lg transition-colors font-medium ${isPathActive(location.pathname, sub.path, sub.matchNested)
                                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        {sub.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Desktop Expand / Collapse Floating Button */}
            {!isSmallScreen && (
                <button
                    type="button"
                    onClick={toggleDesktop}
                    style={{ left: collapsed ? '70px' : '246px', top: '24px' }}
                    className="fixed w-6 h-6 bg-[#0F172A] border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-800 hover:border-blue-500 transition-all duration-300 shadow-xl z-50 group cursor-pointer"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    ) : (
                        <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    )}
                </button>
            )}
        </>
    )
}

export default AdminSidebar
