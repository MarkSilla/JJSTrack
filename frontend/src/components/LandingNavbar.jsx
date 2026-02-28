import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import img from '../assets/img.js'

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignIn = () => {
    navigate('/login')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg'
        : 'bg-transparent'
        }`}
    >
      <style>{`
        .nav-link {
          position: relative;
          display: inline-block;
          transition: color 0.4s ease;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          transition: width 0.4s ease;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .nav-link.nav-light:hover {
          color: #bfdbfe;
        }
        
        .nav-link.nav-dark:hover {
          color: #1d4ed8;
        }
        
        .mobile-nav-link {
          position: relative;
          display: inline-block;
          transition: all 0.4s ease;
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
          transition: width 0.4s ease;
        }
        
        .mobile-nav-link:hover::before {
          width: 20px;
        }
        
        .mobile-nav-link:hover {
          padding-left: 28px;
          color: #1d4ed8;
        }
      `}</style>

      <div className="container mx-auto px-6 py-2 2xl:mx-24 py-2 px-0">
        <div className="flex justify-between items-center">
          <ul className="hidden xl:flex gap-6 items-center md:gap-3">
            <li>
              <a
                href="#home"
                className={`nav-link font-medium transition-colors duration-500 ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                  }`}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#features"
                className={`nav-link font-medium transition-colors duration-500 ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                  }`}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#about"
                className={`nav-link font-medium transition-colors duration-500 ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                  }`}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#location"
                className={`nav-link font-medium transition-colors duration-500 ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                  }`}
              >
                Location
              </a>
            </li>
            <li>
              <a
                href="#testimonials"
                className={`nav-link font-medium transition-colors duration-500 ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                  }`}
              >
                Testimonials
              </a>
            </li>
            <li>
              <a
                href="#FAQ"
                className={`nav-link font-medium transition-colors duration-500 ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                  }`}
              >
                FAQ
              </a>
            </li>
          </ul>
          <div className={`z-50 flex items-center transition-all duration-500 ease-in-out
             ${scrolled ? "flex-row items-center " : "flex-col items-center "}
                `} >
            <img src={img.jjslogo1} alt="logo" className={`w-10 h-10
              ${scrolled ? "w-12 h-12" : "w-14 h-14"}
            `} />
            <div className={`flex flex-col transition-all duration-500
            ${scrolled ? "ml-3 items-start" : "items-center mt-2"}
            `}>
              <h1 className={`font-playfair font-bold transition-all duration-500
            ${scrolled ? "text-lg text-[#1E293B]" : "text-xl text-white"}
            `}>
                JJS Track
              </h1>

              <span
                className={`text-xs font-inter font-light transition-all duration-500
        ${scrolled ? "text-slate-900" : "text-slate-300"}
      `}
              >
                Jennoel-Jennyl Sportswear
              </span>
            </div>
          </div>
          <button
            onClick={handleSignIn}
            className={`hidden xl:block px-6 py-2.5 rounded-lg font-medium transition-all duration-500 ${scrolled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
              }`}
          >
            Sign In
          </button>
          <div
            className={` xl:hidden flex w-10 h-10 cursor-pointer items-center justify-center rounded-lg transition-all duration-500 ${scrolled ? 'hover:bg-blue-50' : 'hover:bg-white/20'
              }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span
              className={`material-symbols-outlined transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                }`}
            >
              {isOpen ? 'close' : 'menu'}
            </span>
          </div>
        </div>
      </div>
      {
        isOpen && (
          <div
            className={`xl:hidden border-t px-6 pb-6 pt-4 animate-slideDown transition-all duration-500 ${scrolled
              ? 'border-gray-200 bg-white/95 backdrop-blur-md'
              : 'border-white/20 bg-black/40 backdrop-blur-md'
              }`}
          >
            <ul className="flex flex-col space-y-4">
              <li>
                <a
                  href="#home"
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link font-medium block transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                    }`}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link font-medium block transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                    }`}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link font-medium block transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                    }`}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#location"
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link font-medium block transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                    }`}
                >
                  Location
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link font-medium block transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                    }`}
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a
                  href="#FAQ"
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link font-medium block transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                    }`}
                >
                  FAQ
                </a>
              </li>
            </ul>
            <div className="border-t-2 border-black/3 0 mt-6"></div>
            <button
              onClick={handleSignIn}
              className={`mt-6 w-full px-6 py-2.5 rounded-lg font-medium transition-all duration-500 ${scrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                }`}
            >
              Sign In
            </button>
          </div>
        )
      }
    </nav >
  )
}

export default LandingNavbar