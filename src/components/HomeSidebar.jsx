import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import logo from '../assets/jjslogo1.png'
import { MdDashboard, MdCalendarToday, MdLogout, MdMenu, MdChevronLeft, MdShoppingBag, MdReceipt } from 'react-icons/md'

const navItems = [
    { icon: MdDashboard, label: 'Dashboard', path: '/home' },
    { icon: MdCalendarToday, label: 'Appointment', path: '/appointment' },
    { icon: MdShoppingBag, label: 'Orders', path: '/order' },
    { icon: MdReceipt, label: 'Invoices', path: '/invoices' },
]

const HomeSidebar = ({ collapsed, setCollapsed }) => {
    const location = useLocation()

    return (
        <>
            {/* Mobile Backdrop */}
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 sm:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setCollapsed(true)}
                />
            )}
            <aside className={`fixed top-0 left-0 h-screen bg-[#0F172A] text-white flex flex-col transition-all duration-300 ease-in-out z-50 
                ${collapsed ? '-translate-x-full sm:translate-x-0 sm:w-[70px]' : 'translate-x-0 w-[240px]'}`}>
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="jjslogo" className='w-14 h-15' />
                            <span className="text-md font-bold font-inter">JJS-Track</span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                        {collapsed ? <MdMenu size={24} /> : <MdChevronLeft size={24} />}
                    </button>
                </div>
                <nav className="flex-1 flex flex-col gap-1 p-3 mt-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path

                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                                ${isActive
                                        ? 'bg-[#2563EB]/20 text-[#60A5FA]'
                                        : 'hover:bg-gray-700/60 text-gray-400'
                                    }`}
                            >
                                <item.icon size={22} className={`shrink-0 ${isActive ? 'text-[#60A5FA]' : ''}`} />
                                {!collapsed && (
                                    <span className="whitespace-nowrap overflow-hidden text-sm">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-3 border-t border-gray-700">
                    <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-600/30 transition-colors text-red-400 hover:text-red-300">
                        <MdLogout size={22} className="shrink-0" />
                        {!collapsed && (
                            <span className="whitespace-nowrap overflow-hidden text-sm">
                                Logout
                            </span>
                        )}
                    </a>
                </div>
            </aside>
        </>
    )
}

export default HomeSidebar
