import React from 'react'
import { useLocation } from 'react-router-dom'
import { MdNotificationsNone, MdSearch, MdMenu, MdClose } from 'react-icons/md'


const HomeNavbar = ({ collapsed, setCollapsed }) => {
  const location = useLocation()


  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const dayStr = today.toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 sm:hidden transition-colors cursor-pointer text-gray-600"
          >
            {collapsed ? <MdMenu size={24} /> : <MdClose size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-800 whitespace-nowrap hidden sm:block">
          </h1>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <MdSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search orders, appointments, or invoices..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-full outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <MdNotificationsNone size={22} className="text-gray-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm font-semibold shadow-sm">

            </div>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-gray-700 leading-tight">
                {dateStr}
              </span>
              <span className="text-xs text-gray-400 leading-tight">
                {dayStr}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HomeNavbar
