import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import HomeSidebar from '../components/adminsidebar'
import AdminNav from '../components/adminNav'

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(true)
    const [isMobileExpanded, setIsMobileExpanded] = useState(false)

    const handleBurgerClick = () => {
        if (window.innerWidth < 1024) {
            setIsMobileExpanded(!isMobileExpanded)
        } else {
            setCollapsed(!collapsed)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <HomeSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobileExpanded={isMobileExpanded}
                setIsMobileExpanded={setIsMobileExpanded}
            />

            <div className={`flex-1 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div className="flex flex-col h-screen">
                    <AdminNav onToggleSidebar={handleBurgerClick} />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}

export default AdminLayout