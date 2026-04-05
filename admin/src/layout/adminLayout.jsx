import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import HomeSidebar from '../components/adminsidebar'
import AdminNav from '../components/adminNav'
import AdminChatWidget from '../components/AdminChatWidget'

const PAGE_META = [
    {
        match: /^\/admin\/dashboard$/,
        title: 'Dashboard',
        subtitle: 'Overview of orders, appointments, and business activity.'
    },
    {
        match: /^\/admin\/analytic$/,
        title: 'Reports',
        subtitle: 'Performance insights and key metrics.'
    },
    {
        match: /^\/admin\/appointment$/,
        title: 'Appointments',
        subtitle: 'Manage schedules, bookings, and customer appointments.'
    },
    {
        match: /^\/admin\/orders$/,
        title: 'Orders',
        subtitle: 'Track and manage all customer orders.'
    },
    {
        match: /^\/admin\/orders\/[^/]+$/,
        title: 'Order Details',
        subtitle: 'Review status, items, and progress of the selected order.'
    },
    {
        match: /^\/admin\/qr-scanner$/,
        title: 'QR Scanner',
        subtitle: 'Scan and verify order records quickly.'
    },
    {
        match: /^\/admin\/released$/,
        title: 'Released Items',
        subtitle: 'View and monitor all released orders.'
    },
    {
        match: /^\/admin\/staff$/,
        title: 'Staff',
        subtitle: 'Manage team members, roles, and workload.'
    },
    {
        match: /^\/admin\/inventory$/,
        title: 'Inventory',
        subtitle: 'Monitor stock levels, adjustments, and item records.'
    },
]

const DEFAULT_PAGE_META = {
    title: 'Admin Panel',
    subtitle: 'Manage and monitor your system operations.'
}

const getPageMeta = (pathname) => {
    const page = PAGE_META.find((entry) => entry.match.test(pathname))
    return page || DEFAULT_PAGE_META
}

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(true)
    const [isMobileExpanded, setIsMobileExpanded] = useState(false)
    const location = useLocation()
    const pageMeta = getPageMeta(location.pathname)

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
                    <AdminNav
                        onToggleSidebar={handleBurgerClick}
                        pageTitle={pageMeta.title}
                        pageSubtitle={pageMeta.subtitle}
                    />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-4">
                        <Outlet />
                    </main>
                </div>
            </div>
            <AdminChatWidget />
        </div>
    )
}

export default AdminLayout
