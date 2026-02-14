import React, { useState } from 'react'
import logo from '../assets/jjs logo.png'

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center px-6 gap-3">
            <img src={logo} alt="jjs logo" className="h-10" />
            <h1 className="text-xl font-bold text-[#1E293B] font-playfair">JJS Track</h1>
          </div>
          {/* Desktop nav */}
          <ul className="hidden md:flex space-x-6">
            <li><a href="#home" className="text-blue-500 hover:text-blue-600">Home</a></li>
            <li><a href="#features" className="text-blue-500 hover:text-blue-600">Features</a></li>
            <li><a href="#about" className="text-blue-500 hover:text-blue-600">About</a></li>
          </ul>
          <button className="hidden md:block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Login
          </button>
          {/* Mobile hamburger */}
          <div
            className="md:hidden flex w-10 h-10 cursor-pointer items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="material-symbols-outlined text-blue-600">
              {isOpen ? 'close' : 'menu'}
            </span>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-6 pb-6 pt-4">
          <ul className="flex flex-col space-y-4">
            <li><a href="#home" onClick={() => setIsOpen(false)} className="text-blue-500 hover:text-blue-600 block">Home</a></li>
            <li><a href="#features" onClick={() => setIsOpen(false)} className="text-blue-500 hover:text-blue-600 block">Features</a></li>
            <li><a href="#about" onClick={() => setIsOpen(false)} className="text-blue-500 hover:text-blue-600 block">About</a></li>
          </ul>
          <button className="mt-4 w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Login
          </button>
        </div>
      )}
    </nav>
  )
}

export default LandingNavbar
