import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
    Bell,
    Menu,
    X,
    User,
    LogOut,
} from 'lucide-react'
import {
    getNotificationUpdatesWebSocketUrl,
    notificationApi,
} from '../services/notificationApi.js'
import { StaffAuthContext } from '../context/StaffAuthContext.jsx'
import { playAlertSound } from '../utils/soundAlert.js'
import { getStoredStaffUser } from '../utils/staffSession.js'
import { requestWebNotificationPermission, showWebNotification } from '../../utils/webNotification.js'

const NOTIFICATION_LIMIT = 20
const NOTIFICATION_SOCKET_RECONNECT_MS = 2500
const NOTIFICATION_REFRESH_DEBOUNCE_MS = 200

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

const upsertNotifications = (current = [], incoming = []) => {
    const map = new Map()

    current.forEach((item) => {
        if (item?._id) {
            map.set(item._id, item)
        }
    })

    incoming.forEach((item) => {
        if (item?._id) {
            map.set(item._id, item)
        }
    })

    return [...map.values()].sort((first, second) => {
        const firstTime = new Date(first?.createdAt || 0).getTime()
        const secondTime = new Date(second?.createdAt || 0).getTime()
        return secondTime - firstTime
    })
}

const resolveNotificationRoute = (notification = {}) => {
    const baseRoute = String(notification?.route || '').trim()
    const entityId = String(notification?.entityId || '').trim()

    if (baseRoute === '/staff/orders' && entityId) {
        return `/staff/orders/${entityId}`
    }

    return baseRoute
}

const isWorkflowTurnNotification = (notification = {}) =>
    notification?.metadata?.event === 'workflow_step_ready'

const StaffNav = ({ onToggleSidebar }) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [notificationsLoading, setNotificationsLoading] = useState(false)
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
    const notificationIdsRef = useRef(new Set())
    const navigate = useNavigate()
    const location = useLocation()
    const { logout, staffUser } = useContext(StaffAuthContext)

    const user = useMemo(() => {
        const storedUser = staffUser || getStoredStaffUser()
        return {
            fullName: storedUser?.fullName || 'Staff User',
            email:
                storedUser?.email ||
                localStorage.getItem('rememberStaffEmail') ||
                'staff@jjstrack.com',
            photoURL: storedUser?.photoURL || null,
        }
    }, [staffUser])

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
    }, [location.pathname])

    useEffect(() => {
        if (!showNotifications || typeof window === 'undefined') return undefined
        if (!isMobileViewport) return undefined

        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [showNotifications, isMobileViewport])

    const loadNotifications = useCallback(async ({ showLoader = false } = {}) => {
        if (showLoader) {
            setNotificationsLoading(true)
        }

        try {
            const response = await notificationApi.getNotifications(NOTIFICATION_LIMIT)
            if (!isMountedRef.current) return

            const nextNotifications = Array.isArray(response?.notifications) ? response.notifications : []
            notificationIdsRef.current = new Set(nextNotifications.map((item) => item?._id).filter(Boolean))
            setNotifications(nextNotifications)
            setUnreadCount(
                Number.isFinite(Number(response?.unreadCount))
                    ? Number(response.unreadCount)
                    : nextNotifications.filter((item) => !item.isRead).length
            )
        } catch (error) {
            console.error('Failed to fetch staff notifications:', error)
            if (showLoader && isMountedRef.current) {
                setNotifications([])
                setUnreadCount(0)
            }
        } finally {
            if (showLoader && isMountedRef.current) {
                setNotificationsLoading(false)
            }
        }
    }, [])

    const showRealtimeNotificationToast = useCallback((notification) => {
        if (!notification || !isWorkflowTurnNotification(notification)) {
            return
        }

        const targetRoute = resolveNotificationRoute(notification)
        playAlertSound('workflow')

        toast.info(notification.title || 'Workflow update needed', {
            description: notification.message || 'One of your workflow stages is ready for progress update.',
            duration: 9000,
            action: targetRoute
                ? {
                    label: 'Open task',
                    onClick: () => {
                        if (targetRoute !== location.pathname) {
                            navigate(targetRoute)
                        }
                    },
                }
                : undefined,
        })

        showWebNotification(notification, {
            tagPrefix: 'jjstrack-staff',
            onClick: () => {
                if (targetRoute && targetRoute !== location.pathname) {
                    navigate(targetRoute)
                }
            },
        })
    }, [location.pathname, navigate])

    useEffect(() => {
        isMountedRef.current = true
        loadNotifications({ showLoader: true })

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadNotifications()
            }
        }, 20000)

        const handleWindowFocus = () => loadNotifications()
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadNotifications()
            }
        }

        window.addEventListener('focus', handleWindowFocus)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            isMountedRef.current = false
            window.clearInterval(intervalId)
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
            const socketUrl = getNotificationUpdatesWebSocketUrl()
            if (!socketUrl || isDisposed) return

            const socket = new WebSocket(socketUrl)
            notificationSocketRef.current = socket

            socket.onmessage = (event) => {
                if (isDisposed) return

                try {
                    const message = JSON.parse(event.data)

                    if (message?.type === 'notification:created' && message?.notification?._id) {
                        const incomingNotification = message.notification

                        setNotifications((current) => {
                            // Check if notification already exists in current list
                            const exists = current.some((n) => n?._id === incomingNotification._id)
                            if (exists) {
                                return current
                            }

                            // Add to ref set
                            notificationIdsRef.current.add(incomingNotification._id)

                            // Add to notifications list
                            const updated = upsertNotifications(current, [incomingNotification]).slice(0, NOTIFICATION_LIMIT)
                            return updated
                        })

                        if (!incomingNotification.isRead) {
                            setUnreadCount((current) => current + 1)
                        }

                        showRealtimeNotificationToast(incomingNotification)

                        return
                    }

                    if (message?.type === 'feed:refresh' && message?.channel === 'orders') {
                        scheduleNotificationRefresh()
                    }
                } catch (socketError) {
                    console.error('Failed to parse staff notification socket message:', socketError)
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

            if (notificationSocketRef.current) {
                const ws = notificationSocketRef.current
                ws.onmessage = null
                ws.onerror = null
                ws.onclose = null
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close()
                } else if (ws.readyState === WebSocket.CONNECTING) {
                    ws.onopen = () => ws.close()
                }
            }
        }
    }, [loadNotifications, showRealtimeNotificationToast])

    const handleLogout = () => {
        logout()
        navigate('/staff/login')
    }

    const handleOpenProfile = () => {
        setShowDropdown(false)
        navigate('/staff/profile')
    }

    const getUserInitials = (name) => {
        if (!name) return 'S'
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const toggleNotifications = () => {
        const nextState = !showNotifications
        setShowNotifications(nextState)
        setShowDropdown(false)

        if (nextState) {
            void requestWebNotificationPermission()
            loadNotifications({ showLoader: notifications.length === 0 })
        }
    }

    const handleMarkAllAsRead = async () => {
        const now = new Date().toISOString()
        setNotifications((current) =>
            current.map((item) => ({
                ...item,
                isRead: true,
                readAt: item.readAt || now,
            }))
        )
        setUnreadCount(0)

        try {
            await notificationApi.markAllAsRead()
        } catch (error) {
            console.error('Failed to mark all staff notifications as read:', error)
            loadNotifications()
        }
    }

    const handleNotificationClick = async (notification) => {
        if (!notification) return

        if (!notification.isRead) {
            setNotifications((current) =>
                current.map((item) =>
                    item._id === notification._id
                        ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
                        : item
                )
            )
            setUnreadCount((current) => Math.max(0, current - 1))

            try {
                await notificationApi.markAsRead(notification._id)
            } catch (error) {
                console.error('Failed to mark staff notification as read:', error)
                loadNotifications()
            }
        }

        setShowNotifications(false)

        const targetRoute = resolveNotificationRoute(notification)

        if (targetRoute && targetRoute !== location.pathname) {
            navigate(targetRoute)
        }
    }

    const notificationPanel = (
        <div
            ref={notificationPanelRef}
            className={`${isMobileViewport
                ? 'fixed inset-x-3 top-20 bottom-3 z-[10001] flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl'
                : 'absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl'
                } animate-in fade-in zoom-in duration-200`}
        >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">Notifications</p>
                    <p className="mt-0.5 text-xs text-gray-400">
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

            <div className={`overflow-y-auto ${isMobileViewport ? 'flex-1' : 'max-h-96'}`}>
                {notificationsLoading ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
                        <p className="mt-1 text-xs text-gray-400">Assigned tasks, workflow turn alerts, and due-soon reminders will appear here.</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <button
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${notification.isRead ? 'bg-white' : isWorkflowTurnNotification(notification) ? 'bg-amber-50/70' : 'bg-blue-50/60'}`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-gray-200' : isWorkflowTurnNotification(notification) ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="break-words text-sm font-semibold text-gray-900">{notification.title}</p>
                                            {isWorkflowTurnNotification(notification) && (
                                                <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                                    Action needed
                                                </span>
                                            )}
                                        </div>
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

                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors text-gray-600"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={22} />
                    </button>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
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

                    <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => {
                                setShowDropdown((prev) => !prev)
                                setShowNotifications(false)
                            }}
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

export default StaffNav
