import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import StaffSidebar from '../components/staffsidenav'
import StaffNav from '../components/staffnav'
import StaffChatWidget from '../components/staffchat'
import StaffCalendarDrawer from '../components/StaffCalendarDrawer'

const StaffLayout = () => {
    const [collapsed, setCollapsed] = useState(true)
    const [isMobileExpanded, setIsMobileExpanded] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [calendarEntries, setCalendarEntries] = useState([])

    const handleBurgerClick = () => {
        if (window.innerWidth < 1024) {
            setIsMobileExpanded(!isMobileExpanded)
        } else {
            setCollapsed(!collapsed)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden">
            <StaffSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobileExpanded={isMobileExpanded}
                setIsMobileExpanded={setIsMobileExpanded}
            />

            <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div className="flex flex-col h-screen min-w-0">
                    <StaffNav
                        onToggleSidebar={handleBurgerClick}
                    />
                    <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-2 md:p-6 lg:p-4">
                        <Outlet context={{ toggleCalendar: () => setCalendarOpen(true), setCalendarEntries }} />
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
