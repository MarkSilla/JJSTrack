import React from 'react'

const LandingNavbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">JJS Track</div>
          <ul className="flex space-x-6">
            <li><a href="#home" className="text-gray-700 hover:text-blue-600">Home</a></li>
            <li><a href="#features" className="text-gray-700 hover:text-blue-600">Features</a></li>
            <li><a href="#about" className="text-gray-700 hover:text-blue-600">About</a></li>
            <li><a href="#contact" className="text-gray-700 hover:text-blue-600">Contact</a></li>
          </ul>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  )
}

export default LandingNavbar
