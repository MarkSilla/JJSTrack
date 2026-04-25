import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdNotificationsNone, MdMenu, MdClose, MdPerson, MdLogout, MdEmail, MdPhone, MdLocationOn } from 'react-icons/md'
import { AuthContext } from '../context/Context'
import { getNotificationUpdatesWebSocketUrl, notificationApi } from '../../services/notificationApi.js'

const NOTIFICATION_LIMIT = 20
const NOTIFICATION_SOCKET_RECONNECT_MS = 2500
const LIVE_ALERT_DURATION_MS = 6000

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

const sortNotifications = (items = []) =>
  [...items].sort((first, second) => {
    const firstTime = new Date(first?.createdAt || 0).getTime()
    const secondTime = new Date(second?.createdAt || 0).getTime()
    return secondTime - firstTime
  })

const upsertNotifications = (current = [], incoming = []) => {
  const notificationMap = new Map()

  current.forEach((item) => {
    if (item?._id) {
      notificationMap.set(item._id, item)
    }
  })

  incoming.forEach((item) => {
    if (item?._id) {
      notificationMap.set(item._id, item)
    }
  })

  return sortNotifications([...notificationMap.values()])
}

const HomeNavbar = ({ collapsed, setCollapsed }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [liveAlerts, setLiveAlerts] = useState([])
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)
  const notificationIdsRef = useRef(new Set())
  const notificationSocketRef = useRef(null)
  const notificationReconnectTimeoutRef = useRef(null)
  const liveAlertTimeoutsRef = useRef(new Map())
  const isMountedRef = useRef(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useContext(AuthContext)

  const dismissLiveAlert = useCallback((notificationId) => {
    setLiveAlerts((current) => current.filter((item) => item._id !== notificationId))

    const timeoutId = liveAlertTimeoutsRef.current.get(notificationId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      liveAlertTimeoutsRef.current.delete(notificationId)
    }
  }, [])

  const pushLiveAlert = useCallback((notification) => {
    if (!notification?._id || document.visibilityState !== 'visible') {
      return
    }

    setLiveAlerts((current) => [
      notification,
      ...current.filter((item) => item._id !== notification._id),
    ].slice(0, 3))

    const existingTimeout = liveAlertTimeoutsRef.current.get(notification._id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const timeoutId = window.setTimeout(() => {
      dismissLiveAlert(notification._id)
    }, LIVE_ALERT_DURATION_MS)

    liveAlertTimeoutsRef.current.set(notification._id, timeoutId)
  }, [dismissLiveAlert])

  const loadNotifications = useCallback(async ({ showLoader = false } = {}) => {
    if (!user) {
      if (showLoader && isMountedRef.current) {
        setNotifications([])
        setUnreadCount(0)
      }
      notificationIdsRef.current = new Set()
      return
    }

    if (showLoader) {
      setNotificationsLoading(true)
    }

    try {
      const response = await notificationApi.getNotifications(NOTIFICATION_LIMIT)
      if (!isMountedRef.current) return

      const nextNotifications = Array.isArray(response?.notifications) ? response.notifications : []
      notificationIdsRef.current = new Set(
        nextNotifications.map((item) => item?._id).filter(Boolean)
      )

      setNotifications(nextNotifications)
      setUnreadCount(
        Number.isFinite(Number(response?.unreadCount))
          ? Number(response.unreadCount)
          : nextNotifications.filter((item) => !item.isRead).length
      )
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      if (showLoader && isMountedRef.current) {
        setNotifications([])
        setUnreadCount(0)
      }
    } finally {
      if (showLoader && isMountedRef.current) {
        setNotificationsLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    isMountedRef.current = true

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      isMountedRef.current = false
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setShowDropdown(false)
      setShowNotifications(false)
      setNotifications([])
      setUnreadCount(0)
      setLiveAlerts([])
      notificationIdsRef.current = new Set()
    }
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    loadNotifications({ showLoader: true })

    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      loadNotifications()
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
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, loadNotifications])

  useEffect(() => {
    if (!user || typeof window === 'undefined') return undefined

    let isDisposed = false

    const connectNotificationSocket = () => {
      const socketUrl = getNotificationUpdatesWebSocketUrl()
      if (!socketUrl || isDisposed) return

      const socket = new WebSocket(socketUrl)
      notificationSocketRef.current = socket

      socket.onmessage = (event) => {
        if (isDisposed) return

        try {
          const message = JSON.parse(event.data)
          if (message?.type !== 'notification:created' || !message?.notification?._id) {
            return
          }

          const incomingNotification = message.notification
          if (notificationIdsRef.current.has(incomingNotification._id)) {
            return
          }

          notificationIdsRef.current.add(incomingNotification._id)
          setNotifications((current) =>
            upsertNotifications(current, [incomingNotification]).slice(0, NOTIFICATION_LIMIT)
          )

          if (!incomingNotification.isRead) {
            setUnreadCount((current) => current + 1)
            pushLiveAlert(incomingNotification)
          }
        } catch (error) {
          console.error('Failed to parse realtime notification message:', error)
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
  }, [user, pushLiveAlert])

  useEffect(() => {
    return () => {
      liveAlertTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      liveAlertTimeoutsRef.current.clear()
    }
  }, [])

  const handleLogout = async () => {
    setShowDropdown(false)
    setShowNotifications(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const handleUpdateProfile = () => {
    setShowDropdown(false)
    navigate('/profile')
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return 'U'
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
      console.error('Failed to mark all notifications as read:', error)
      loadNotifications()
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification) return

    dismissLiveAlert(notification._id)

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
        console.error('Failed to mark notification as read:', error)
        loadNotifications()
      }
    }

    setShowNotifications(false)

    if (notification.route && notification.route !== location.pathname) {
      navigate(notification.route)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 w-full">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6">

        {/* Left - Mobile menu toggle */}
        <div className="flex items-center gap-3">
          <button
            id="jjs-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 lg:hidden transition-colors cursor-pointer text-gray-600"
          >
            {collapsed ? <MdMenu size={22} /> : <MdClose size={22} />}
          </button>
        </div>

        {/* Right - Notifications + Date + User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={toggleNotifications}
              className="relative p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Open notifications"
              aria-expanded={showNotifications}
            >
              <MdNotificationsNone size={18} className="sm:w-6 sm:h-6 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 rounded-full border-2 border-white text-[10px] font-semibold text-white flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 top-14 bg-slate-900/10 backdrop-blur-[1px] sm:hidden"
                  aria-hidden="true"
                />
                <div className="fixed inset-x-3 top-16 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in duration-200 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 sm:max-h-[28rem] sm:w-96">
                  <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">Notifications</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {unreadCount > 0
                          ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                          : 'All caught up'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="self-start rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
                        <p className="mt-1 text-xs text-gray-400">Pickup updates will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                            notification.isRead ? 'bg-white' : 'bg-blue-50/60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                notification.isRead ? 'bg-gray-200' : 'bg-blue-500'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                <p className="break-words text-[13px] font-semibold text-gray-900 sm:text-sm">
                                  {notification.title}
                                </p>
                                <span className="whitespace-nowrap text-[10px] text-gray-400 sm:text-[11px]">
                                  {formatNotificationTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-5 text-gray-500 break-words">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1 pr-3 transition-colors"
            >
              {/* Profile Picture */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-sm overflow-hidden">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getUserInitials(user?.fullName)
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 sm:py-3 animate-in fade-in zoom-in duration-200 max-h-96 overflow-y-auto">
                {/* User Info Header */}
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1">
                    {user?.fullName || 'User'}
                  </p>
                  <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                    {/* Email */}
                    <div className="flex items-center gap-2 min-w-0">
                      <MdEmail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{user?.email}</span>
                    </div>
                    {/* Phone */}
                    {user?.phoneNumber && (
                      <div className="flex items-center gap-2 min-w-0">
                        <MdPhone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{user.phoneNumber}</span>
                      </div>
                    )}
                    {/* Address */}
                    {user?.address && (
                      <div className="flex items-center gap-2 min-w-0">
                        <MdLocationOn size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{user.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <button
                  onClick={handleUpdateProfile}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MdPerson size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Update Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <MdLogout size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {liveAlerts.length > 0 && (
        <div className="fixed top-16 left-3 right-3 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:top-20 sm:w-[min(24rem,calc(100vw-1.5rem))]">
          {liveAlerts.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleNotificationClick(notification)
                }
              }}
              role="button"
              tabIndex={0}
              className="w-full cursor-pointer rounded-2xl border border-blue-100 bg-white/95 p-3.5 text-left shadow-2xl backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-white sm:p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MdNotificationsNone size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <p className="break-words text-[13px] font-semibold text-gray-900 sm:text-sm">
                      {notification.title}
                    </p>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        dismissLiveAlert(notification._id)
                      }}
                      className="rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                      aria-label="Dismiss notification"
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-gray-500 break-words">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}

export default HomeNavbar
