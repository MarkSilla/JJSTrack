import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import HomeSidebar from '../components/adminsidebar'
import AdminNav from '../components/adminNav'
import AdminChatWidget from '../components/AdminChatWidget'
import PageEntrance from '../components/PageEntrance'

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
        subtitle: 'All scanned and released bookings.'
    },
    {
        match: /^\/admin\/staff$/,
        title: 'Staff',
        subtitle: 'Manage team members, roles, and workload.'
    },
    {
        match: /^\/admin\/services-pricing$/,
        title: 'Services Pricing',
        subtitle: 'Manage service rates shown on customer booking forms.'
    },
    {
        match: /^\/admin\/inventory$/,
        title: 'Inventory',
        subtitle: 'Monitor stock levels, adjustments, and item records.'
    },
    {
        match: /^\/admin\/inventory\/history$/,
        title: 'Inventory History',
        subtitle: 'Review detailed stock movement, batch usage, and audit activity.'
    },
    {
        match: /^\/admin\/profile$/,
        title: 'My Profile',
        subtitle: 'View your administrator account details.'
    },
    {
        match: /^\/admin\/report$/,
        title: 'Reports',
        subtitle: 'Generate and view detailed business reports.'
    },
    {
        match: /^\/admin\/archives$/,
        title: 'Archives',
        subtitle: 'Manage and restore deleted or old records.'
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
        <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
            <HomeSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobileExpanded={isMobileExpanded}
                setIsMobileExpanded={setIsMobileExpanded}
            />

            <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div className="flex flex-col h-screen">
                    <AdminNav
                        onToggleSidebar={handleBurgerClick}
                        pageTitle={pageMeta.title}
                        pageSubtitle={pageMeta.subtitle}
                    />
                    <main className="flex-1 min-w-0 w-full overflow-x-hidden overflow-y-auto p-0 pt-2 md:p-3 lg:p-1">
                        <PageEntrance variant="outlet">
                            <Outlet />
                        </PageEntrance>
                    </main>
                </div>
            </div>
            <AdminChatWidget />
        </div>
    )
}

export default AdminLayout
