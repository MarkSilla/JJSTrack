import { useEffect, useRef } from 'react'
import { getTrackingUpdatesWebSocketUrl } from '../../services/trackingApi.js'

const TRACKING_SOCKET_RECONNECT_MS = 2500

const useTrackingUpdatesSocket = (onTrackingUpdated, { enabled = true } = {}) => {
    const callbackRef = useRef(onTrackingUpdated)
    const socketRef = useRef(null)
    const reconnectTimeoutRef = useRef(null)

    useEffect(() => {
        callbackRef.current = onTrackingUpdated
    }, [onTrackingUpdated])

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return undefined

        let isDisposed = false

        const connectTrackingSocket = () => {
            const socketUrl = getTrackingUpdatesWebSocketUrl()
            if (!socketUrl || isDisposed) return

            const socket = new WebSocket(socketUrl)
            socketRef.current = socket

            socket.onmessage = (event) => {
                if (isDisposed) return

                try {
                    const message = JSON.parse(event.data)
                    if (message?.type !== 'tracking:updated') {
                        return
                    }

                    callbackRef.current?.(message?.tracking || {})
                } catch (error) {
                    console.error('Failed to parse realtime tracking update:', error)
                }
            }

            socket.onerror = () => {
                if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                    socket.close()
                }
            }

            socket.onclose = () => {
                if (isDisposed) return

                reconnectTimeoutRef.current = window.setTimeout(() => {
                    connectTrackingSocket()
                }, TRACKING_SOCKET_RECONNECT_MS)
            }
        }

        connectTrackingSocket()

        return () => {
            isDisposed = true

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }

            if (
                socketRef.current &&
                (socketRef.current.readyState === WebSocket.OPEN ||
                    socketRef.current.readyState === WebSocket.CONNECTING)
            ) {
                socketRef.current.close()
            }
        }
    }, [enabled])
}

export default useTrackingUpdatesSocket
