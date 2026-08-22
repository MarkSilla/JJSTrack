import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import StaffSidebar from '../components/staffsidenav'
import StaffNav from '../components/staffnav'
import StaffChatWidget from '../components/staffchat'
import StaffCalendarDrawer from '../components/StaffCalendarDrawer'
import PageEntrance from '../../components/PageEntrance'

const StaffLayout = () => {
    const [collapsed, setCollapsed] = useState(true)
    const [isMobileExpanded, setIsMobileExpanded] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [calendarEntries, setCalendarEntries] = useState([])
    const location = useLocation()

    const handleBurgerClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMobileExpanded(prev => !prev)
        } else {
            setCollapsed(prev => !prev)
        }
    }

    React.useEffect(() => {
        setIsMobileExpanded(false)
    }, [location.pathname])

    return (
        <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden">
            <StaffSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobileExpanded={isMobileExpanded}
                setIsMobileExpanded={setIsMobileExpanded}
            />

            <div className={`min-w-0 flex-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div className="flex flex-col h-screen min-w-0">
                    <StaffNav
                        onToggleSidebar={handleBurgerClick}
                    />
                    <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-[1400px] mx-auto w-full">
                            <PageEntrance variant="outlet">
                                <Outlet context={{ toggleCalendar: () => setCalendarOpen(true), setCalendarEntries }} />
                            </PageEntrance>
                        </div>
                        <StaffChatWidget />
                    </main>
                </div>
            </div>

            <StaffCalendarDrawer
                isOpen={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                schedules={calendarEntries}
            />
        </div>
    )
}

export default StaffLayout
