import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import jjsLogo from '../assets/jjs_result.png'
import { AuthContext } from '../context/Context.jsx'

const navLinks = [
  ['Home', '#home'],
  ['Features', '#features'],
  ['About', '#about'],
  ['Location', '#location'],
  ['Testimonials', '#testimonials'],
  ['FAQ', '#FAQ'],
]

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  const { isAuthenticated } = useContext(AuthContext)

  useEffect(() => {
    let frameId = null
    const handleScroll = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50)
        frameId = null
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleAuthAction = () => {
    setIsOpen(false)
    if (isAuthenticated) {
      navigate('/login')
    } else {
      navigate('/login')
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-500 ease-in-out ${scrolled
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

      <div className="mx-auto w-full max-w-[88rem] px-4 py-2 sm:px-6 lg:px-8">
        <div className="relative flex h-14 w-full items-center justify-between sm:h-16">
          <div className="min-w-0 flex-1">
            <ul className="hidden items-center gap-4 xl:flex 2xl:gap-6">
              {navLinks.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    className={`nav-link whitespace-nowrap text-sm font-medium transition-colors duration-500 2xl:text-base ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                      }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[85] flex -translate-x-1/2 -translate-y-1/2 justify-center">
            <div className="flex items-center justify-center transition-all duration-500 ease-in-out">
              <img
                src={jjsLogo}
                alt="JJS logo"
                width="56"
                height="56"
                decoding="async"
                className={`h-11 w-11 object-contain transition-all duration-500 sm:h-12 sm:w-12 ${scrolled ? 'xl:h-12 xl:w-12' : 'xl:h-14 xl:w-14'}`}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end">
            <button
              onClick={handleAuthAction}
              className={`hidden rounded-lg px-6 py-2.5 font-medium transition-all duration-500 xl:block ${scrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                }`}
            >
              {isAuthenticated ? 'Sign in' : 'Sign In'}
            </button>
            <button
              type="button"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-500 xl:hidden ${scrolled ? 'hover:bg-blue-50' : 'hover:bg-white/20'
                }`}
            >
              {isOpen ? (
                <X className={`transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'}`} size={24} />
              ) : (
                <Menu className={`transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'}`} size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[90] xl:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-dvh w-[min(82vw,22rem)] flex-col overflow-y-auto border-l shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${scrolled
            ? 'border-gray-200 bg-white/95 text-slate-900'
            : 'border-white/15 bg-[#020617]/95 text-white'
            }`}
        >
          <div className={`flex min-h-20 items-center justify-center border-b px-5 ${scrolled ? 'border-gray-200' : 'border-white/15'}`}>
            <img
              src={jjsLogo}
              alt="JJS logo"
              width="56"
              height="56"
              decoding="async"
              className="h-14 w-14 object-contain"
            />
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
              className={`absolute right-4 top-5 flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${scrolled ? 'text-blue-600 hover:bg-blue-50' : 'text-white hover:bg-white/10'}`}
            >
              <X size={24} />
            </button>
          </div>
          <div
            className="flex flex-1 flex-col px-5 pb-6 pt-5"
          >
            <ul className="flex flex-col space-y-4">
              {navLinks.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`mobile-nav-link block text-base font-semibold transition-colors duration-500 ${scrolled ? 'text-blue-600' : 'text-white'
                      }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <div className={`mt-6 border-t-2 ${scrolled ? 'border-slate-200' : 'border-white/25'}`}></div>
            <button
              onClick={handleAuthAction}
              className={`mt-6 w-full rounded-lg px-6 py-2.5 font-medium transition-all duration-500 ${scrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                }`}
            >
              {isAuthenticated ? 'Sign In' : 'Sign In'}
            </button>
          </div>
        </aside>
      </div>
    </nav >
  )
}

export default LandingNavbar
