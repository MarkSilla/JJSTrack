import React, { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    Bell, Menu, X, User, LogOut
} from 'lucide-react'
import { AdminAuthContext } from '../context/AdminAuthContext'
import { getInventoryUpdatesWebSocketUrl } from '../services/inventoryApi'
import { notificationApi } from '../services/notificationApi'
import { getStoredAdminUser } from '../utils/adminSession'

const NOTIFICATION_LIMIT = 20
const NOTIFICATION_SOCKET_RECONNECT_MS = 2500
const NOTIFICATION_REFRESH_DEBOUNCE_MS = 200

// ← DAGDAG ITO
const PAGE_TITLES = {
    '/admin/dashboard':   { title: 'Dashboard',      subtitle: 'Overview of your system' },
    '/admin/appointment': { title: 'Appointments',   subtitle: 'Manage appointments' },
    '/admin/orders':      { title: 'Orders',          subtitle: 'All customer orders' },
    '/admin/released':    { title: 'Released Items',  subtitle: 'Released orders' },
    '/admin/inventory':   { title: 'Inventory',       subtitle: 'Manage your stocks' },
    '/admin/staff':       { title: 'Staff',            subtitle: 'Manage staff members' },
    '/admin/report':      { title: 'Reports',          subtitle: 'Analytics & insights' },
    '/admin/qr-scanner':  { title: 'QR Scanner',      subtitle: 'Scan QR codes' },
}

const formatNotificationTime = (createdAt) => {
    const date = new Date(createdAt)
    if (Number.isNaN(date.getTime())) return 'Just now'
    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hr ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const NOTIFICATION_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'booking', label: 'Booking' },
    { key: 'unread', label: 'Unread' }
]

const getVisibleNotifications = (notifications, filter) => {
    if (filter === 'inventory') return notifications.filter((n) => n.type === 'inventory')
    if (filter === 'booking') return notifications.filter((n) => n.type === 'booking')
    if (filter === 'unread') return notifications.filter((n) => !n.isRead)
    return notifications
}

const getEmptyNotificationState = (filter) => {
    if (filter === 'inventory') return { title: 'No inventory notifications', description: 'Inventory updates will appear here.' }
    if (filter === 'booking') return { title: 'No booking notifications', description: 'Booking updates will appear here.' }
    if (filter === 'unread') return { title: 'No unread notifications', description: 'Unread updates will appear here.' }
    return { title: 'No notifications yet', description: 'New updates will appear here.' }
}

const resolveNotificationRoute = (notification = {}) => {
    const baseRoute = String(notification?.route || '').trim()
    const entityId = String(notification?.entityId || '').trim()

    if (baseRoute === '/admin/orders' && entityId) {
        return `/admin/orders/${entityId}`
    }

    return baseRoute
}

const AdminNav = ({ onToggleSidebar, pageTitle = 'Admin Panel', pageSubtitle = '' }) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [notificationsLoading, setNotificationsLoading] = useState(false)
    const [notificationFilter, setNotificationFilter] = useState('all')
    const [unreadCount, setUnreadCount] = useState(0)
    const [isMobileViewport, setIsMobileViewport] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false
    )
    const dropdownRef = useRef(null)
    const notifRef = useRef(null)
    const notificationPanelRef = useRef(null)
    const isMountedRef = useRef(true)
    const notificationSocketRef = useRef(null)
    const notificationReconnectTimeoutRef = useRef(null)
    const notificationRefreshTimeoutRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()
    const { adminUser, logout } = useContext(AdminAuthContext)

    // ← DAGDAG ITO
    const currentPage = PAGE_TITLES[location.pathname] ?? { title: pageTitle, subtitle: pageSubtitle }

    const storedAdminUser = getStoredAdminUser()
    const user = {
        fullName: adminUser?.fullName || storedAdminUser?.fullName || 'System Administrator',
        email: adminUser?.email || storedAdminUser?.email || localStorage.getItem('rememberAdminEmail') || 'admin@jjstrack.com',
        photoURL: adminUser?.photoURL || storedAdminUser?.photoURL || null,
    }

    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    const dayStr = today.toLocaleDateString('en-US', { weekday: 'long' })

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false)
            }
            if (
                notifRef.current &&
                !notifRef.current.contains(event.target) &&
                (!notificationPanelRef.current || !notificationPanelRef.current.contains(event.target))
            ) {
                setShowNotifications(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return undefined
        const mediaQuery = window.matchMedia('(max-width: 639px)')
        const syncViewport = (event) => setIsMobileViewport(event.matches)
        setIsMobileViewport(mediaQuery.matches)
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncViewport)
            return () => mediaQuery.removeEventListener('change', syncViewport)
        }
        mediaQuery.addListener(syncViewport)
        return () => mediaQuery.removeListener(syncViewport)
    }, [])

    useEffect(() => {
        setShowDropdown(false)
        setShowNotifications(false)
        setNotificationFilter('all')
    }, [location.pathname])

    useEffect(() => {
        if (!showNotifications || typeof window === 'undefined') return undefined
        if (!isMobileViewport) return undefined
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = originalOverflow }
    }, [showNotifications, isMobileViewport])

    const loadNotifications = useCallback(async ({ showLoader = false } = {}) => {
        if (showLoader) setNotificationsLoading(true)
        try {
            const response = await notificationApi.getNotifications(NOTIFICATION_LIMIT)
            if (!isMountedRef.current) return
            const nextNotifications = Array.isArray(response?.notifications) ? response.notifications : []
            const parsedUnreadCount = Number(response?.unreadCount)
            setNotifications(nextNotifications)
            setUnreadCount(
                Number.isFinite(parsedUnreadCount)
                    ? parsedUnreadCount
                    : nextNotifications.filter((n) => !n.isRead).length
            )
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            if (showLoader && isMountedRef.current) {
                setNotifications([])
                setUnreadCount(0)
            }
        } finally {
            if (showLoader && isMountedRef.current) setNotificationsLoading(false)
        }
    }, [])

    useEffect(() => {
        isMountedRef.current = true
        loadNotifications({ showLoader: true })
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') loadNotifications()
        }, 15000)
        const handleWindowFocus = () => loadNotifications()
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') loadNotifications()
        }
        window.addEventListener('focus', handleWindowFocus)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            isMountedRef.current = false
            clearInterval(intervalId)
            window.removeEventListener('focus', handleWindowFocus)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [loadNotifications])

    useEffect(() => {
        if (typeof window === 'undefined') return undefined

        let isDisposed = false

        const scheduleNotificationRefresh = () => {
            if (notificationRefreshTimeoutRef.current) {
                clearTimeout(notificationRefreshTimeoutRef.current)
            }

            notificationRefreshTimeoutRef.current = window.setTimeout(() => {
                if (!isDisposed) {
                    loadNotifications()
                }
            }, NOTIFICATION_REFRESH_DEBOUNCE_MS)
        }

        const connectNotificationSocket = () => {
            if (isDisposed) return

            const socket = new WebSocket(getInventoryUpdatesWebSocketUrl())
            notificationSocketRef.current = socket

            socket.onmessage = (event) => {
                if (isDisposed) return

                try {
                    const message = JSON.parse(event.data)

                    if (message?.type === 'inventory:changed') {
                        scheduleNotificationRefresh()
                    }
                } catch (socketError) {
                    console.error('Failed to parse notification sync socket message:', socketError)
                }
            }

            socket.onerror = () => {
                if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                    socket.close()
                }
            }

            socket.onclose = () => {
                if (isDisposed) return

                notificationReconnectTimeoutRef.current = window.setTimeout(() => {
                    connectNotificationSocket()
                }, NOTIFICATION_SOCKET_RECONNECT_MS)
            }
        }

        connectNotificationSocket()

        return () => {
            isDisposed = true

            if (notificationRefreshTimeoutRef.current) {
                clearTimeout(notificationRefreshTimeoutRef.current)
            }

            if (notificationReconnectTimeoutRef.current) {
                clearTimeout(notificationReconnectTimeoutRef.current)
            }

            if (
                notificationSocketRef.current &&
                (notificationSocketRef.current.readyState === WebSocket.OPEN ||
                    notificationSocketRef.current.readyState === WebSocket.CONNECTING)
            ) {
                notificationSocketRef.current.close()
            }
        }
    }, [loadNotifications])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const handleOpenProfile = () => {
        setShowDropdown(false)
        navigate('/admin/profile')
    }

    const toggleDropdown = () => {
        setShowDropdown((prev) => !prev)
        setShowNotifications(false)
    }

    const toggleNotifications = () => {
        const nextState = !showNotifications
        setShowNotifications(nextState)
        setShowDropdown(false)
        if (nextState) {
            setNotificationFilter('all')
            loadNotifications({ showLoader: notifications.length === 0 })
        }
    }

    const handleMarkAllAsRead = async () => {
        setNotifications((current) =>
            current.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
        )
        setUnreadCount(0)
        try {
            await notificationApi.markAllAsRead()
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error)
            loadNotifications()
        }
    }

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            setNotifications((current) =>
                current.map((item) =>
                    item._id === notification._id
                        ? { ...item, isRead: true, readAt: new Date().toISOString() }
                        : item
                )
            )
            setUnreadCount((current) => Math.max(0, current - 1))
            try {
                await notificationApi.markAsRead(notification._id)
            } catch (error) {
                console.error('Failed to mark notification as read:', error)
                loadNotifications()
            }
        }
        setShowNotifications(false)
        const targetRoute = resolveNotificationRoute(notification)
        if (targetRoute && targetRoute !== location.pathname) {
            navigate(targetRoute)
        }
    }

    const getUserInitials = (name) => {
        if (!name) return 'A'
        const parts = name.split(' ')
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
        return name.substring(0, 2).toUpperCase()
    }

    const visibleNotifications = getVisibleNotifications(notifications, notificationFilter)
    const emptyNotificationState = getEmptyNotificationState(notificationFilter)

    const notificationPanel = (
        <div
            ref={notificationPanelRef}
            className={`${isMobileViewport
                ? 'fixed inset-x-3 top-20 bottom-3 z-[10001] flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl'
                : 'absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] sm:w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl'
            } animate-in fade-in zoom-in duration-200`}
        >
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-100">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">Notifications</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {unreadCount > 0
                            ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                            : 'All caught up'}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                    {isMobileViewport && (
                        <button
                            onClick={() => setShowNotifications(false)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            aria-label="Close notifications"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 overflow-x-auto sm:overflow-visible">
                    {NOTIFICATION_FILTERS.map((filterOption) => (
                        <button
                            key={filterOption.key}
                            onClick={() => setNotificationFilter(filterOption.key)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${notificationFilter === filterOption.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {filterOption.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`overflow-y-auto ${isMobileViewport ? 'flex-1' : 'max-h-80'}`}>
                {notificationsLoading ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">Loading notifications...</p>
                    </div>
                ) : visibleNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">{emptyNotificationState.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{emptyNotificationState.description}</p>
                    </div>
                ) : (
                    visibleNotifications.map((notification) => (
                        <button
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${notification.isRead ? 'bg-white' : 'bg-blue-50/60'}`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${notification.isRead ? 'bg-gray-200' : 'bg-blue-500'}`} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-900 break-words">{notification.title}</p>
                                        <span className="whitespace-nowrap text-[11px] text-gray-400">{formatNotificationTime(notification.createdAt)}</span>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-gray-500 break-words">{notification.message}</p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    )

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 w-full shrink-0">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">

                {/* Left — hamburger + page title ← BINAGO ITO */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors text-gray-600 shrink-0"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={22} />
                    </button>

                    {/* Page Title */}
                    <div className="min-w-0">
                        <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">
                            {currentPage.title}
                        </h1>
                        {currentPage.subtitle && (
                            <p className="text-[11px] text-gray-400 hidden sm:block truncate">
                                {currentPage.subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right — date, bell, avatar */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <p className="text-xs font-bold text-gray-900 leading-tight">{dayStr}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{dateStr}</p>
                    </div>

                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={toggleNotifications}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                            aria-label="Open notifications"
                            aria-expanded={showNotifications}
                        >
                            <Bell size={20} className="text-gray-500" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 rounded-full border-2 border-white text-[10px] font-semibold text-white flex items-center justify-center leading-none">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            isMobileViewport
                                ? createPortal(
                                    <>
                                        <div
                                            className="fixed inset-0 z-[10000] bg-slate-900/20 backdrop-blur-[1px]"
                                            onClick={() => setShowNotifications(false)}
                                            aria-hidden="true"
                                        />
                                        {notificationPanel}
                                    </>,
                                    document.body
                                )
                                : notificationPanel
                        )}
                    </div>

                    <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block" />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={toggleDropdown}
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
                                <button
                                    onClick={handleOpenProfile}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <User size={16} className="text-gray-400" />
                                    <span>My Profile</span>
                                </button>
                                <div className="my-2 border-t border-gray-50" />
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
