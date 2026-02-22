import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/jjslogo1.png'

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignIn = () => {
    navigate('/login')
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-md sticky top-0 z-50">
      <style>{`
        .nav-link {
          position: relative;
          display: inline-block;
          transition: color 0.3s ease;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          transition: width 0.3s ease;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .nav-link:hover {
          color: #1d4ed8;
        }
        
        .mobile-nav-link {
          position: relative;
          display: inline-block;
          transition: all 0.3s ease;
          padding-left: 0;
        }
        
        .mobile-nav-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 2px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          transition: width 0.3s ease;
        }
        
        .mobile-nav-link:hover::before {
          width: 20px;
        }
        
        .mobile-nav-link:hover {
          padding-left: 28px;
          color: #1d4ed8;
        }
      `}</style>

      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center px-6 gap-3">
            <img src={logo} alt="jjs logo" className="h-10 transition-transform duration-300 hover:scale-110" />
            <h1 className="text-xl font-bold text-[#1E293B] font-playfair">JJS Track</h1>
          </div>
          <ul className="hidden md:flex space-x-8 items-center">
            <li>
              <a href="#home" className="nav-link text-blue-600 font-medium">
                Home
              </a>
            </li>
            <li>
              <a href="#features" className="nav-link text-blue-600 font-medium">
                Features
              </a>
            </li>
            <li>
              <a href="#about" className="nav-link text-blue-600 font-medium">
                About
              </a>
            </li>
          </ul>
          <button
            onClick={handleSignIn}
            className="hidden md:block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-opacity duration-200 hover:opacity-90"
          >
            Sign In
          </button>
          <div
            className="md:hidden flex w-10 h-10 cursor-pointer items-center justify-center hover:bg-blue-50 rounded-lg transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="material-symbols-outlined text-blue-600">
              {isOpen ? 'close' : 'menu'}
            </span>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/90 backdrop-blur-md px-6 pb-6 pt-4 animate-slideDown">
          <ul className="flex flex-col space-y-4">
            <li>
              <a
                href="#home"
                onClick={() => setIsOpen(false)}
                className="mobile-nav-link text-blue-600 font-medium block"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#features"
                onClick={() => setIsOpen(false)}
                className="mobile-nav-link text-blue-600 font-medium block"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#about"
                onClick={() => setIsOpen(false)}
                className="mobile-nav-link text-blue-600 font-medium block"
              >
                About
              </a>
            </li>
          </ul>
          <button
            onClick={handleSignIn}
            className="mt-6 w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-opacity duration-200 hover:opacity-90"
          >
            Sign In
          </button>
        </div>
      )}
    </nav>
  )
}

export default LandingNavbar