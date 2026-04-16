import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    Bell,
    Search,
    Menu,
    X,
    User,
    LogOut,
    Settings,
    Mail,
    Phone,
    MapPin,
    ChevronDown
} from 'lucide-react'

const AdminNav = ({ onToggleSidebar, pageTitle = 'Admin Panel', pageSubtitle = '' }) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const dropdownRef = useRef(null)
    const notifRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()

    const user = {
        fullName: 'Admin User',
        email: 'admin@jjstrack.com',
        photoURL: null
    }

    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
    const dayStr = today.toLocaleDateString('en-US', { weekday: 'long' })

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false)
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = () => {
        // Clear authentication data from localStorage
        localStorage.removeItem('adminToken')
        localStorage.removeItem('rememberAdminEmail')
        navigate('/')
    }

    const getUserInitials = (name) => {
        if (!name) return 'A'
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 w-full shrink-0">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">

                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors text-gray-600"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={22} />
                    </button>
                </div>
                <div className="flex  items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <p className="text-xs font-bold text-gray-900 leading-tight">{dayStr}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{dateStr}</p>
                    </div>

                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                        >
                            <Bell size={20} className="text-gray-500" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden ring-2 ring-blue-50">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    getUserInitials(user?.fullName)
                                )}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in zoom-in duration-200">
                                <div className="px-4 pb-3 mb-2 border-b border-gray-50">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                                </div>

                                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <User size={16} className="text-gray-400" />
                                    <span>My Profile</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Settings size={16} className="text-gray-400" />
                                    <span>Settings</span>
                                </button>

                                <div className="my-2 border-t border-gray-50"></div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={16} />
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

export default AdminNav
