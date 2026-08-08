import { useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
export default function PageEntrance({ children, className = '', variant = 'portal' }) {
    const location = useLocation()
    const motionKey = `${location.pathname}${location.search}`
    const previousMotionKey = useRef(motionKey)
    const hasCommitted = useRef(false)
    const isOutlet = variant === 'outlet'
    const isRouteChange = isOutlet && hasCommitted.current && previousMotionKey.current !== motionKey

    useEffect(() => {
        previousMotionKey.current = motionKey
        hasCommitted.current = true
    }, [motionKey])

    const stateClass = isOutlet
        ? (isRouteChange ? 'motion-page-entrance--route-change' : 'motion-page-entrance--initial')
        : 'motion-page-entrance--portal'

    return (
        <div
            key={`${variant}-${motionKey}`}
            className={`motion-page-entrance motion-page-entrance--${variant} ${stateClass} w-full min-w-0 ${className}`}
        >
            {children}
        </div>
    )
}
