import React from 'react'
import logo from '../assets/jjs logo.png'

const LandingNavbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center px-6 gap-3">
            <img src={logo} alt="jjs logo" className="h-10" />
            <h1 className="text-xl font-bold text-[#1E293B] font-playfair ">JJS Track</h1>
          </div>
          <ul className="flex space-x-6">
            <li><a href="#home" className="text-blue-500 hover:text-blue-600">Home</a></li>
            <li><a href="#features" className="text-blue-500 hover:text-blue-600">Features</a></li>
            <li><a href="#about" className="text-blue-500 hover:text-blue-600">About</a></li>
          </ul>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Login
          </button>
        </div>
      </div>
    </nav>
  )
}

export default LandingNavbar
